import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole('PROFESSOR'));

// My courses
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { professorId: req.user.id },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
  res.json(courses);
});

// Create course
router.post('/courses', async (req, res) => {
  const { studentId, date, time, meetingLink } = req.body;
  const course = await prisma.course.create({
    data: {
      professorId: req.user.id,
      studentId,
      date,
      time,
      meetingLink: meetingLink || null,
    },
    include: { student: { select: { id: true, name: true } } },
  });
  res.json(course);
});

// Update meeting link
router.put('/courses/:id/meeting-link', async (req, res) => {
  const { meetingLink } = req.body;
  const course = await prisma.course.update({
    where: { id: req.params.id, professorId: req.user.id },
    data: { meetingLink },
  });
  res.json(course);
});

// Start course
router.put('/courses/:id/start', async (req, res) => {
  const course = await prisma.course.update({
    where: { id: req.params.id, professorId: req.user.id },
    data: { isStarted: true },
  });
  res.json(course);
});

// Add recording link
router.put('/courses/:id/recording', async (req, res) => {
  const { recordingLink } = req.body;
  const course = await prisma.course.update({
    where: { id: req.params.id, professorId: req.user.id },
    data: { recordingLink },
  });
  res.json(course);
});

// Assigned students
router.get('/students', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { professorId: req.user.id, role: 'STUDENT' },
    select: { id: true, name: true, email: true },
  });
  res.json(students);
});

// Send message to student
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

// My messages (conversations with students)
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
