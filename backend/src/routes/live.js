import { Router } from 'express';
import prisma from '../lib/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const LIVE_ROOM = 'frenchwithus-live';

/**
 * GET /live-access
 * Vérifie si l'utilisateur peut accéder au live et si le professeur est en ligne.
 * Rôles autorisés : STUDENT, PROFESSOR
 */
router.get('/live-access', authenticate, async (req, res) => {
  const { role } = req.user;
  if (role !== 'STUDENT' && role !== 'PROFESSOR') {
    return res.status(403).json({ error: 'Accès réservé aux étudiants et professeurs' });
  }

  const professorOnline = req.app.locals?.professorOnline ?? false;
  const roomName = LIVE_ROOM;

  res.json({
    canAccess: true,
    professorOnline,
    roomName,
    role,
  });
});

/**
 * POST /live/session/start
 * Professeur démarre une session (appelé côté front quand il entre dans la salle)
 */
router.post('/live/session/start', authenticate, async (req, res) => {
  if (req.user.role !== 'PROFESSOR') {
    return res.status(403).json({ error: 'Réservé aux professeurs' });
  }

  const session = await prisma.liveSession.create({
    data: {
      roomName: LIVE_ROOM,
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

  const { sessionId, recordingUrl } = req.body || {};

  if (sessionId) {
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        recordingUrl: recordingUrl || null,
      },
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
export { LIVE_ROOM };
