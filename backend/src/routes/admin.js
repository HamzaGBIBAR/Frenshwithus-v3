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

// Students CRUD
router.get('/students', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      professorId: true,
      professor: { select: { id: true, name: true } },
    },
  });
  res.json(users);
});

router.post('/students', userCreateValidation, validate, async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const user = await prisma.user.create({
    data: { name, email, password: hashPassword(password), role: 'STUDENT' },
    select: { id: true, name: true, email: true },
  });
  res.json(user);
});

router.put('/students/:id', userUpdateValidation, validate, async (req, res) => {
  const { name, email, password, professorId } = req.body;
  const data = { name, email };
  if (password) data.password = hashPassword(password);
  if (professorId !== undefined) data.professorId = professorId || null;
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'STUDENT' },
    data,
    select: { id: true, name: true, email: true, professorId: true },
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

// Courses list
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    include: {
      professor: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
  res.json(courses);
});

// Create course (admin assigns professor and student)
router.post('/courses', courseCreateValidation, validate, async (req, res) => {
  const { professorId, studentId, date, time, meetingLink } = req.body;
  const course = await prisma.course.create({
    data: {
      professorId,
      studentId,
      date,
      time,
      meetingLink: meetingLink || null,
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
  const { professorId, studentId, date, time, meetingLink } = req.body;
  const data = {};
  if (professorId !== undefined) data.professorId = professorId;
  if (studentId !== undefined) data.studentId = studentId;
  if (date !== undefined) data.date = date;
  if (time !== undefined) data.time = time;
  if (meetingLink !== undefined) data.meetingLink = meetingLink;
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

export default router;
