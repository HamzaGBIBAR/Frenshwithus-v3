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

// My weekly availability
router.get('/availability', async (req, res) => {
  const slots = await prisma.professorAvailability.findMany({
    where: { professorId: req.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  res.json(slots);
});

router.post('/availability', async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;
  const slot = await prisma.professorAvailability.create({
    data: { professorId: req.user.id, dayOfWeek, startTime, endTime },
  });
  res.json(slot);
});

router.delete('/availability/:id', async (req, res) => {
  await prisma.professorAvailability.delete({
    where: { id: req.params.id, professorId: req.user.id },
  });
  res.json({ ok: true });
});

// All professors' availability (for planning overview - profs can see everyone's slots)
router.get('/planning/availability-all', async (req, res) => {
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      name: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  res.json(professors);
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
