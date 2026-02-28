import { Router } from 'express';
import prisma from '../lib/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /live-access?courseId=xxx
 * Accès au live par cours (style Teams). Vérifie que l'utilisateur est prof ou élève du cours.
 */
router.get('/live-access', authenticate, async (req, res) => {
  const { role } = req.user;
  const courseId = req.query.courseId;
  if (!courseId) {
    return res.status(400).json({ error: 'courseId requis' });
  }
  if (role !== 'STUDENT' && role !== 'PROFESSOR') {
    return res.status(403).json({ error: 'Accès réservé aux étudiants et professeurs' });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, professorId: true, studentId: true },
  });
  if (!course) {
    return res.status(404).json({ error: 'Cours introuvable' });
  }
  if (role === 'PROFESSOR' && course.professorId !== req.user.id) {
    return res.status(403).json({ error: 'Ce cours ne vous appartient pas' });
  }
  if (role === 'STUDENT' && course.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Ce cours ne vous est pas assigné' });
  }

  const courseProfessorOnline = req.app.locals?.courseProfessorOnline ?? {};
  const professorOnline = !!courseProfessorOnline[courseId];
  const roomName = `frenchwithus-course-${courseId}`;

  res.json({
    canAccess: true,
    professorOnline,
    roomName,
    role,
    courseId,
  });
});

/**
 * POST /live/session/start
 * Professeur démarre une session pour un cours (isStarted + session DB)
 */
router.post('/live/session/start', authenticate, async (req, res) => {
  if (req.user.role !== 'PROFESSOR') {
    return res.status(403).json({ error: 'Réservé aux professeurs' });
  }
  const { courseId } = req.body || {};
  if (!courseId) {
    return res.status(400).json({ error: 'courseId requis' });
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, professorId: req.user.id },
  });
  if (!course) {
    return res.status(404).json({ error: 'Cours introuvable' });
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { isStarted: true },
  });

  const session = await prisma.liveSession.create({
    data: {
      roomName: `frenchwithus-course-${courseId}`,
      professorId: req.user.id,
    },
  });

  res.json({ sessionId: session.id });
});

/**
 * POST /live/session/end
 * Professeur termine une session (enregistrement du lien si disponible)
 */
router.post('/live/session/end', authenticate, async (req, res) => {
  if (req.user.role !== 'PROFESSOR') {
    return res.status(403).json({ error: 'Réservé aux professeurs' });
  }

  const { sessionId, recordingUrl, endReason } = req.body || {};

  if (sessionId) {
    const data = {
      endedAt: new Date(),
      recordingUrl: recordingUrl || null,
    };
    if (endReason && ['student_absent', 'completed', 'meeting_issue'].includes(endReason)) {
      data.endReason = endReason;
    }
    await prisma.liveSession.update({
      where: { id: sessionId },
      data,
    });
  }

  res.json({ ok: true });
});

/**
 * GET /live/sessions
 * Historique des sessions (professeur ou admin)
 */
router.get('/live/sessions', authenticate, async (req, res) => {
  const { role } = req.user;
  if (role !== 'PROFESSOR' && role !== 'ADMIN') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const where = role === 'PROFESSOR' ? { professorId: req.user.id } : {};
  const sessions = await prisma.liveSession.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      roomName: true,
      startedAt: true,
      endedAt: true,
      recordingUrl: true,
      professor: { select: { name: true } },
    },
  });

  res.json({ sessions });
});

export default router;
