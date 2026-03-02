import { Router } from 'express';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, messageValidation } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('STUDENT'));

// Upcoming courses – inclut sessionEnded et sessionEndedAt
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { studentId: req.user.id },
    include: { professor: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const endedSessions = await prisma.liveSession.findMany({
    where: { endedAt: { not: null } },
    select: { roomName: true, endedAt: true, endReason: true },
    orderBy: { endedAt: 'desc' },
  });
  const endedCourseIds = new Set();
  const endedAtByCourse = {};
  const endReasonByCourse = {};
  for (const s of endedSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    const courseId = s.roomName.replace('frenchwithus-course-', '');
    endedCourseIds.add(courseId);
    if (!endedAtByCourse[courseId]) {
      endedAtByCourse[courseId] = s.endedAt;
      endReasonByCourse[courseId] = s.endReason;
    }
  }

  const courseProfessorOnline = req.app.locals?.courseProfessorOnline ?? {};

  const coursesWithStatus = courses.map((c) => {
    const sessionEnded = c.isStarted && endedCourseIds.has(c.id);
    return {
      ...c,
      sessionEnded,
      sessionEndedAt: endedAtByCourse[c.id] || null,
      endReason: endReasonByCourse[c.id] || c.absenceReason || null,
      // L'enregistrement n'est accessible qu'après que le prof ait terminé le cours
      recordingLink: sessionEnded ? c.recordingLink : null,
      // Le prof est-il dans la réunion ? (pour activer le bouton Rejoindre)
      professorOnline: !!courseProfessorOnline[c.id],
    };
  });

  res.json(coursesWithStatus);
});

// Get meeting link (only if unlocked)
router.get('/courses/:id/meeting-link', async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, studentId: req.user.id },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const now = new Date();
  const [year, month, day] = course.date.split('-').map(Number);
  const [hour, min] = course.time.split(':').map(Number);
  const courseDateTime = new Date(year, month - 1, day, hour, min);
  const timeReached = now >= courseDateTime;
  const unlocked = timeReached && course.isStarted;
  if (!unlocked) {
    return res.json({ unlocked: false, message: 'The professor has not started the session yet.' });
  }
  res.json({ unlocked: true, meetingLink: course.meetingLink });
});

// Payment status
router.get('/payments', async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { studentId: req.user.id },
    orderBy: { date: 'desc' },
  });
  res.json(payments);
});

// Send message to professor
router.post('/messages', messageValidation, validate, async (req, res) => {
  const { receiverId, content } = req.body;
  const msg = await prisma.message.create({
    data: { senderId: req.user.id, receiverId, content },
    include: {
      receiver: { select: { id: true, name: true } },
    },
  });
  res.json(msg);
});

// All professors (so student can contact any of them)
router.get('/professors', async (req, res) => {
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: { id: true, name: true, email: true, avatarUrl: true },
    orderBy: { name: 'asc' },
  });
  res.json(professors);
});

// My messages
router.get('/messages', async (req, res) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.user.id },
        { receiverId: req.user.id },
      ],
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(messages);
});

export default router;
