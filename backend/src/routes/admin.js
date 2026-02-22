import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

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

router.post('/professors', async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const user = await prisma.user.create({
    data: { name, email, password: hashPassword(password), role: 'PROFESSOR' },
    select: { id: true, name: true, email: true },
  });
  res.json(user);
});

router.put('/professors/:id', async (req, res) => {
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

router.post('/students', async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const user = await prisma.user.create({
    data: { name, email, password: hashPassword(password), role: 'STUDENT' },
    select: { id: true, name: true, email: true },
  });
  res.json(user);
});

router.put('/students/:id', async (req, res) => {
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
router.put('/students/:id/assign', async (req, res) => {
  const { professorId } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'STUDENT' },
    data: { professorId: professorId || null },
    select: { id: true, name: true, professorId: true },
  });
  res.json(user);
});

// Payments
router.post('/payments', async (req, res) => {
  const { studentId, amount, status } = req.body;
  const payment = await prisma.payment.create({
    data: { studentId, amount, status: status || 'unpaid' },
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

router.put('/payments/:id/status', async (req, res) => {
  const { status } = req.body;
  const payment = await prisma.payment.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(payment);
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

// Revenue total
router.get('/revenue', async (req, res) => {
  const paid = await prisma.payment.aggregate({
    where: { status: 'paid' },
    _sum: { amount: true },
  });
  res.json({ total: paid._sum.amount || 0 });
});

export default router;
