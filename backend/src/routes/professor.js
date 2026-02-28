import { Router } from 'express';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, messageValidation, availabilityValidation } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('PROFESSOR'));

// My courses – inclut sessionEnded et sessionEndedAt
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { professorId: req.user.id },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const endedSessions = await prisma.liveSession.findMany({
    where: { endedAt: { not: null } },
    select: { roomName: true, endedAt: true },
    orderBy: { endedAt: 'desc' },
  });
  const endedCourseIds = new Set();
  const endedAtByCourse = {};
  for (const s of endedSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    const courseId = s.roomName.replace('frenchwithus-course-', '');
    endedCourseIds.add(courseId);
    if (!endedAtByCourse[courseId]) endedAtByCourse[courseId] = s.endedAt;
  }

  const coursesWithStatus = courses.map((c) => ({
    ...c,
    sessionEnded: c.isStarted && endedCourseIds.has(c.id),
    sessionEndedAt: endedAtByCourse[c.id] || null,
  }));

  res.json(coursesWithStatus);
});

// My weekly availability
router.get('/availability', async (req, res) => {
  const slots = await prisma.professorAvailability.findMany({
    where: { professorId: req.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  res.json(slots);
});

router.post('/availability', availabilityValidation, validate, async (req, res) => {
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

// Students: all students (assigned ones listed first, so prof can message anyone)
router.get('/students', async (req, res) => {
  const professorId = req.user.id;
  const [assigned, allStudents] = await Promise.all([
    prisma.user.findMany({
      where: { professorId, role: 'STUDENT' },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true },
    }),
  ]);
  const seen = new Set();
  const merged = [];
  const assignedIds = new Set(assigned.map((s) => s.id));
  assigned.forEach((s) => { seen.add(s.id); merged.push(s); });
  allStudents.forEach((s) => {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      merged.push(s);
    }
  });
  merged.sort((a, b) => {
    const aAssigned = assignedIds.has(a.id);
    const bAssigned = assignedIds.has(b.id);
    if (aAssigned && !bAssigned) return -1;
    if (!aAssigned && bAssigned) return 1;
    return a.name.localeCompare(b.name);
  });
  res.json(merged);
});

// Send message to student
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
