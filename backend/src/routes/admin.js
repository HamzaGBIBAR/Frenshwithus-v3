import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, userCreateValidation, userUpdateValidation, courseCreateValidation, paymentCreateValidation, paymentStatusValidation, assignProfessorValidation, studentAvailabilityValidation } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

const hashPassword = (p) => bcrypt.hashSync(p, 10);

// Professors CRUD
router.get('/professors', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: { id: true, name: true, email: true },
  });
  res.json(users);
});

router.post('/professors', userCreateValidation, validate, async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const user = await prisma.user.create({
    data: { name, email, password: hashPassword(password), role: 'PROFESSOR' },
    select: { id: true, name: true, email: true },
  });
  res.json(user);
});

router.put('/professors/:id', userUpdateValidation, validate, async (req, res) => {
  const { name, email, password } = req.body;
  const data = { name, email };
  if (password) data.password = hashPassword(password);
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'PROFESSOR' },
    data,
    select: { id: true, name: true, email: true },
  });
  res.json(user);
});

router.delete('/professors/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id, role: 'PROFESSOR' } });
  res.json({ ok: true });
});

router.get('/professors/:id', async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, role: 'PROFESSOR' },
    select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
  });
  if (!user) return res.status(404).json({ error: 'Professor not found' });
  res.json(user);
});

// Students CRUD
router.get('/students', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      professorId: true,
      country: true,
      professor: { select: { id: true, name: true } },
    },
  });
  res.json(users);
});

router.post('/students', userCreateValidation, validate, async (req, res) => {
  const { name, email, password, country } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const data = { name, email, password: hashPassword(password), role: 'STUDENT' };
  if (country) data.country = country;
  const user = await prisma.user.create({
    data,
    select: { id: true, name: true, email: true, country: true },
  });
  res.json(user);
});

router.put('/students/:id', userUpdateValidation, validate, async (req, res) => {
  const { name, email, password, professorId, country } = req.body;
  const data = { name, email };
  if (password) data.password = hashPassword(password);
  if (professorId !== undefined) data.professorId = professorId || null;
  if (country !== undefined) data.country = country || null;
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'STUDENT' },
    data,
    select: { id: true, name: true, email: true, professorId: true, country: true },
  });
  res.json(user);
});

router.delete('/students/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id, role: 'STUDENT' } });
  res.json({ ok: true });
});

// Assign student to professor
router.put('/students/:id/assign', assignProfessorValidation, validate, async (req, res) => {
  const { professorId } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'STUDENT' },
    data: { professorId: professorId || null },
    select: { id: true, name: true, professorId: true },
  });
  res.json(user);
});

// Payments
router.post('/payments', paymentCreateValidation, validate, async (req, res) => {
  const { studentId, amount, status } = req.body;
  const st = status || 'unpaid';
  const data = { studentId, amount, status: st };
  if (st === 'paid') {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    data.nextPaymentDue = next;
  }
  const payment = await prisma.payment.create({
    data,
    include: { student: { select: { id: true, name: true } } },
  });
  res.json(payment);
});

router.get('/payments', async (req, res) => {
  const payments = await prisma.payment.findMany({
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(payments);
});

// Payments due soon (next 7 days or overdue) - for admin notification
router.get('/payments/due-soon', async (req, res) => {
  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const payments = await prisma.payment.findMany({
    where: {
      status: 'paid',
      nextPaymentDue: { not: null, lte: in7Days },
    },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { nextPaymentDue: 'asc' },
  });
  res.json(payments);
});

router.put('/payments/:id/status', paymentStatusValidation, validate, async (req, res) => {
  const { status } = req.body;
  const existing = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Payment not found' });

  const data = { status };
  if (status === 'paid') {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    data.nextPaymentDue = next;
  } else {
    data.nextPaymentDue = null;
  }

  const payment = await prisma.payment.update({
    where: { id: req.params.id },
    data,
    include: { student: { select: { id: true, name: true, email: true } } },
  });
  res.json(payment);
});

router.delete('/payments/:id', async (req, res) => {
  await prisma.payment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Courses list – inclut sessionEnded si le prof a terminé la session live
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    include: {
      professor: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
    },
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

  const coursesWithStatus = courses.map((c) => ({
    ...c,
    sessionEnded: c.isStarted && endedCourseIds.has(c.id),
    sessionEndedAt: endedAtByCourse[c.id] || null,
    endReason: endReasonByCourse[c.id] || c.absenceReason || null,
  }));

  res.json(coursesWithStatus);
});

// Create course (admin assigns professor and student)
router.post('/courses', courseCreateValidation, validate, async (req, res) => {
  const { professorId, studentId, date, time, meetingLink, durationMin } = req.body;
  const course = await prisma.course.create({
    data: {
      professorId,
      studentId,
      date,
      time,
      meetingLink: meetingLink || null,
      durationMin: durationMin ? parseInt(durationMin, 10) : 60,
    },
    include: {
      professor: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
    },
  });
  res.json(course);
});

// Update course (e.g. change professor)
router.put('/courses/:id', async (req, res) => {
  const { professorId, studentId, date, time, meetingLink, durationMin } = req.body;
  const data = {};
  if (professorId !== undefined) data.professorId = professorId;
  if (studentId !== undefined) data.studentId = studentId;
  if (date !== undefined) data.date = date;
  if (time !== undefined) data.time = time;
  if (meetingLink !== undefined) data.meetingLink = meetingLink;
  if (durationMin !== undefined) data.durationMin = parseInt(durationMin, 10);
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data,
    include: {
      professor: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
    },
  });
  res.json(course);
});

router.delete('/courses/:id', async (req, res) => {
  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Student availability (admin manages)
router.get('/students/availability', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      professorId: true,
      professor: { select: { id: true, name: true } },
      studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  res.json(students);
});

router.post('/students/:id/availability', studentAvailabilityValidation, validate, async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;
  const slot = await prisma.studentAvailability.create({
    data: { studentId: req.params.id, dayOfWeek, startTime, endTime },
  });
  res.json(slot);
});

router.delete('/students/:id/availability/:slotId', async (req, res) => {
  await prisma.studentAvailability.delete({
    where: { id: req.params.slotId, studentId: req.params.id },
  });
  res.json({ ok: true });
});

// Messages (admin sees ALL messages sent by everyone)
router.get('/messages', async (req, res) => {
  const messages = await prisma.message.findMany({
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });
  res.json(messages);
});

// Get professors with their availability (for admin when creating courses)
router.get('/professors/availability', async (req, res) => {
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

// Revenue total
router.get('/revenue', async (req, res) => {
  const paid = await prisma.payment.aggregate({
    where: { status: 'paid' },
    _sum: { amount: true },
  });
  res.json({ total: paid._sum.amount || 0 });
});

// Student statistics overview
router.get('/statistics', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true, country: true },
  });

  const courses = await prisma.course.findMany({
    select: { id: true, studentId: true, durationMin: true, date: true, time: true },
  });

  const endedSessions = await prisma.liveSession.findMany({
    where: { endedAt: { not: null } },
    select: { roomName: true, startedAt: true, endedAt: true, endReason: true },
  });

  const endedCourseIds = new Set();
  const sessionDurations = {};
  for (const s of endedSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    const cid = s.roomName.replace('frenchwithus-course-', '');
    endedCourseIds.add(cid);
    if (s.startedAt && s.endedAt) {
      const mins = Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000);
      sessionDurations[cid] = mins > 0 ? mins : 0;
    }
  }

  const stats = students.map((st) => {
    const studentCourses = courses.filter((c) => c.studentId === st.id);
    const attendedCourses = studentCourses.filter((c) => endedCourseIds.has(c.id));
    const totalLessons = attendedCourses.length;
    let totalMinutes = 0;
    for (const c of attendedCourses) {
      totalMinutes += sessionDurations[c.id] ?? c.durationMin;
    }
    return {
      id: st.id,
      name: st.name,
      email: st.email,
      country: st.country,
      totalLessons,
      totalMinutes,
      totalCourses: studentCourses.length,
    };
  });

  res.json(stats);
});

// Session history for a specific student
router.get('/students/:id/sessions', async (req, res) => {
  const studentId = req.params.id;

  const courses = await prisma.course.findMany({
    where: { studentId },
    select: {
      id: true,
      date: true,
      time: true,
      durationMin: true,
      isStarted: true,
      absenceReason: true,
      professor: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
  });

  const endedSessions = await prisma.liveSession.findMany({
    where: { endedAt: { not: null } },
    select: { roomName: true, startedAt: true, endedAt: true, endReason: true },
  });

  const sessionMap = {};
  for (const s of endedSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    const cid = s.roomName.replace('frenchwithus-course-', '');
    if (!sessionMap[cid]) {
      const mins = s.startedAt && s.endedAt
        ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000)
        : 0;
      sessionMap[cid] = { actualMin: mins > 0 ? mins : 0, endReason: s.endReason };
    }
  }

  const sessions = courses.map((c) => {
    const session = sessionMap[c.id];
    const attended = !!session;
    return {
      courseId: c.id,
      date: c.date,
      time: c.time,
      durationMin: c.durationMin,
      professor: c.professor,
      attended,
      actualMin: session?.actualMin ?? 0,
      endReason: session?.endReason || c.absenceReason || null,
    };
  });

  res.json(sessions);
});

export default router;
