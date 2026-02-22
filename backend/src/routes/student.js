import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole('STUDENT'));

// Upcoming courses
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { studentId: req.user.id },
    include: { professor: { select: { id: true, name: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
  res.json(courses);
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
router.post('/messages', async (req, res) => {
  const { receiverId, content } = req.body;
  const msg = await prisma.message.create({
    data: { senderId: req.user.id, receiverId, content },
    include: {
      receiver: { select: { id: true, name: true } },
    },
  });
  res.json(msg);
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
