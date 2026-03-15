import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, userCreateValidation, userUpdateValidation, courseCreateValidation, paymentCreateValidation, paymentStatusValidation, assignProfessorValidation, studentAvailabilityValidation, messageValidation } from '../middleware/validate.js';
import { autoGenerateWeeklyCourses, previewAutoGenerate } from '../lib/autoGenerateCourses.js';
import { utcSlotToZoned, moroccoSlotToUtc, MOROCCO_TZ, moroccoDateTimeToUtc, getTimezoneFromCountry, getUserTz, findOverlaps, utcSlotToMoroccoDateAndTime } from '../lib/availabilityUtc.js';
import { captureException } from '../lib/sentry.js';
import { convertDocumentToBase64, DOCUMENT_MAX_SIZE, DOCUMENT_ALLOWED_TYPES } from '../lib/documentBase64.js';

const router = Router();

const MESSAGE_ALLOWED_MIMES = DOCUMENT_ALLOWED_TYPES;
const MESSAGE_MAX_SIZE = DOCUMENT_MAX_SIZE;
const uploadMessageAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MESSAGE_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!MESSAGE_ALLOWED_MIMES.includes(file.mimetype)) return cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, Excel, and images allowed.'));
    cb(null, true);
  },
});

router.use(authenticate);
router.use(requireRole('ADMIN'));

const hashPassword = (p) => bcrypt.hashSync(p, 10);

// Professors CRUD
router.get('/professors', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: { id: true, name: true, email: true, age: true, country: true, timezone: true },
  });
  res.json(users);
});

// Professors' availability: stored in UTC; return professor local + reference (UTC = Morocco as UTC+0 so 9h Paris → 8h ref).
router.get('/professors/availability', async (req, res) => {
  const REF_TZ = 'UTC';
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      age: true,
      country: true,
      timezone: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  const profTz = (p) => getUserTz(p.timezone, p.country);
  const inMorocco = professors.map((p) => {
    const tz = profTz(p);
    return {
      ...p,
      availability: (p.availability || []).map((s) => {
        const z = utcSlotToZoned(s.dayOfWeek, s.startTime, s.endTime, MOROCCO_TZ);
        const localZ = tz ? utcSlotToZoned(s.dayOfWeek, s.startTime, s.endTime, tz) : null;
        const refZ = utcSlotToZoned(s.dayOfWeek, s.startTime, s.endTime, REF_TZ);
        const crossesMidnight = refZ && s.startTime && s.endTime && s.endTime < s.startTime;
        const refEndDay = crossesMidnight ? (s.dayOfWeek === 7 ? 1 : s.dayOfWeek + 1) : null;
        return z
          ? {
              ...s,
              dayOfWeek: z.dayOfWeek,
              startTime: z.startTime,
              endTime: z.endTime,
              ...(localZ && { localDayOfWeek: localZ.dayOfWeek, localStartTime: localZ.startTime, localEndTime: localZ.endTime }),
              ...(refZ && { refDayOfWeek: refZ.dayOfWeek, refStartTime: refZ.startTime, refEndTime: refZ.endTime, ...(refEndDay != null && { refEndDayOfWeek: refEndDay }) }),
            }
          : s;
      }),
    };
  });
  res.json(inMorocco);
});

router.post('/professors', userCreateValidation, validate, async (req, res) => {
  const { name, email, password, age, country, timezone } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const data = { name, email, password: hashPassword(password), role: 'PROFESSOR' };
  if (age != null) data.age = age;
  if (country) data.country = country;
  if (timezone) data.timezone = timezone;
  else if (country) data.timezone = getTimezoneFromCountry(country);
  const user = await prisma.user.create({
    data,
    select: { id: true, name: true, email: true, age: true, country: true, timezone: true },
  });
  res.json(user);
});

router.put('/professors/:id', userUpdateValidation, validate, async (req, res) => {
  const { name, email, password, age, country, timezone } = req.body;
  const data = { name, email };
  if (password) data.password = hashPassword(password);
  if (age !== undefined) data.age = age === '' || age == null ? null : age;
  if (country !== undefined) data.country = country || null;
  if (timezone !== undefined) data.timezone = timezone || null;
  else if (country) data.timezone = getTimezoneFromCountry(country);
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'PROFESSOR' },
    data,
    select: { id: true, name: true, email: true, age: true, country: true, timezone: true },
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
    select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true, country: true, timezone: true },
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
      age: true,
      pack: true,
      professorId: true,
      country: true,
      timezone: true,
      professor: { select: { id: true, name: true } },
    },
  });
  res.json(users);
});

router.post('/students', userCreateValidation, validate, async (req, res) => {
  const { name, email, password, age, pack, country, timezone } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });
  const data = { name, email, password: hashPassword(password), role: 'STUDENT' };
  if (age != null) data.age = age;
  if (pack) data.pack = pack;
  if (country) data.country = country;
  if (timezone) data.timezone = timezone;
  else if (country) data.timezone = getTimezoneFromCountry(country);
  const user = await prisma.user.create({
    data,
    select: { id: true, name: true, email: true, age: true, pack: true, country: true, timezone: true },
  });
  res.json(user);
});

router.put('/students/:id', userUpdateValidation, validate, async (req, res) => {
  const { name, email, password, age, pack, professorId, country, timezone } = req.body;
  const data = { name, email };
  if (password) data.password = hashPassword(password);
  if (age !== undefined) data.age = age === '' || age == null ? null : age;
  if (pack !== undefined) data.pack = pack === '' || pack == null ? null : pack;
  if (professorId !== undefined) data.professorId = professorId || null;
  if (country !== undefined) data.country = country || null;
  if (timezone !== undefined) data.timezone = timezone || null;
  else if (country) data.timezone = getTimezoneFromCountry(country);
  const user = await prisma.user.update({
    where: { id: req.params.id, role: 'STUDENT' },
    data,
    select: { id: true, name: true, email: true, age: true, pack: true, professorId: true, country: true, timezone: true },
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

// Generate unique payment reference (e.g. FWU-2026-001)
async function generatePaymentReference() {
  const year = new Date().getFullYear();
  const prefix = `FWU-${year}-`;
  const last = await prisma.payment.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const num = last ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(num).padStart(3, '0')}`;
}

// Payments
router.post('/payments', paymentCreateValidation, validate, async (req, res) => {
  const { studentId, amount, status } = req.body;
  const st = status || 'unpaid';
  const reference = await generatePaymentReference();
  const data = { reference, studentId, amount, status: st };
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

// Create course (admin assigns professor and student). Admin enters Morocco time; we store UTC.
router.post('/courses', courseCreateValidation, validate, async (req, res) => {
  const { professorId, studentId, date, time, meetingLink, durationMin } = req.body;
  const startUtc = moroccoDateTimeToUtc(date, time);
  const course = await prisma.course.create({
    data: {
      professorId,
      studentId,
      date,
      time,
      startUtc: startUtc || undefined,
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

// Update course (e.g. change professor). If date/time provided (Morocco), store startUtc.
router.put('/courses/:id', async (req, res) => {
  const { professorId, studentId, date, time, meetingLink, durationMin } = req.body;
  const data = {};
  if (professorId !== undefined) data.professorId = professorId;
  if (studentId !== undefined) data.studentId = studentId;
  if (date !== undefined) data.date = date;
  if (time !== undefined) data.time = time;
  if (date !== undefined && time !== undefined) {
    const startUtc = moroccoDateTimeToUtc(date, time);
    if (startUtc) data.startUtc = startUtc;
  }
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

// Auto-generate weekly courses from professor + student availability (UTC slots → Morocco time courses)
router.post('/courses/auto-generate', async (req, res) => {
  try {
    const weekStart = req.body.weekStart || new Date().toISOString().slice(0, 10);
    const durationMin = req.body.durationMin ? parseInt(req.body.durationMin, 10) : 60;
    const result = await autoGenerateWeeklyCourses(weekStart, durationMin);
    res.json(result);
  } catch (err) {
    console.error('[auto-generate]', err);
    res.status(500).json({ error: err.message || 'Auto-generate failed' });
  }
});

router.get('/courses/auto-generate/preview', async (req, res) => {
  try {
    const weekStart = req.query.weekStart || new Date().toISOString().slice(0, 10);
    const durationMin = req.query.durationMin ? parseInt(req.query.durationMin, 10) : 60;
    const result = await previewAutoGenerate(weekStart, durationMin);
    res.json(result);
  } catch (err) {
    console.error('[auto-generate preview]', err);
    res.status(500).json({ error: err.message || 'Preview failed' });
  }
});

// Overlapping availability between a professor and student (for admin to assign lessons quickly).
// Returns slots in Africa/Casablanca time; optional weekStart=YYYY-MM-DD (Monday) for week context.
router.get('/match-availability', async (req, res) => {
  const professorId = req.query.professorId;
  const studentId = req.query.studentId;
  if (!professorId || !studentId) return res.status(400).json({ error: 'professorId and studentId are required' });
  const [professor, student] = await Promise.all([
    prisma.user.findFirst({
      where: { id: professorId, role: 'PROFESSOR' },
      select: { id: true, name: true, availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
    }),
    prisma.user.findFirst({
      where: { id: studentId, role: 'STUDENT' },
      select: { id: true, name: true, studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
    }),
  ]);
  if (!professor) return res.status(404).json({ error: 'Professor not found' });
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const overlaps = findOverlaps(professor.availability, student.studentAvailability);
  const weekStart = req.query.weekStart && /^\d{4}-\d{2}-\d{2}$/.test(req.query.weekStart)
    ? req.query.weekStart
    : (() => {
        const d = new Date();
        const day = d.getUTCDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setUTCDate(d.getUTCDate() + diff);
        return d.toISOString().slice(0, 10);
      })();
  const slotsInMorocco = overlaps.map((ov) => {
    const { date, time } = utcSlotToMoroccoDateAndTime(ov.dayOfWeek, ov.startUtc, weekStart);
    const endParts = utcSlotToMoroccoDateAndTime(ov.dayOfWeek, ov.endUtc, weekStart);
    return {
      dayOfWeek: ov.dayOfWeek,
      startUtc: ov.startUtc,
      endUtc: ov.endUtc,
      date,
      time,
      endTime: endParts.time,
      display: `${date} ${time} – ${endParts.time}`,
    };
  });
  res.json({
    professor: { id: professor.id, name: professor.name },
    student: { id: student.id, name: student.name },
    weekStart,
    slots: slotsInMorocco,
  });
});

// Student availability in Morocco time (stored in UTC)
router.get('/students/availability', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      age: true,
      pack: true,
      country: true,
      timezone: true,
      professorId: true,
      professor: { select: { id: true, name: true } },
      studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  // Reference time = UTC (Morocco treated as UTC+0 for availability reference)
  const REF_TZ = 'UTC';
  const studentTz = (s) => getUserTz(s.timezone, s.country);
  const inMorocco = students.map((s) => {
    const tz = studentTz(s);
    return {
      ...s,
      studentAvailability: (s.studentAvailability || []).map((slot) => {
        const z = utcSlotToZoned(slot.dayOfWeek, slot.startTime, slot.endTime, MOROCCO_TZ);
        const localZ = tz ? utcSlotToZoned(slot.dayOfWeek, slot.startTime, slot.endTime, tz) : null;
        const refZ = utcSlotToZoned(slot.dayOfWeek, slot.startTime, slot.endTime, REF_TZ);
        const crossesMidnight = refZ && slot.startTime && slot.endTime && slot.endTime < slot.startTime;
        const refEndDay = crossesMidnight ? (slot.dayOfWeek === 7 ? 1 : slot.dayOfWeek + 1) : null;
        return z
          ? {
              ...slot,
              dayOfWeek: z.dayOfWeek,
              startTime: z.startTime,
              endTime: z.endTime,
              ...(localZ && { localDayOfWeek: localZ.dayOfWeek, localStartTime: localZ.startTime, localEndTime: localZ.endTime }),
              ...(refZ && { refDayOfWeek: refZ.dayOfWeek, refStartTime: refZ.startTime, refEndTime: refZ.endTime, ...(refEndDay != null && { refEndDayOfWeek: refEndDay }) }),
            }
          : slot;
      }),
    };
  });
  res.json(inMorocco);
});

// Admin enters student slot in Morocco time; we always convert to UTC before storing (DB must store only UTC).
router.post('/students/:id/availability', studentAvailabilityValidation, validate, async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;
  const utc = moroccoSlotToUtc(Number(dayOfWeek), startTime, endTime);
  if (!utc) return res.status(400).json({ error: 'Invalid time slot; could not convert Morocco time to UTC.' });
  const slot = await prisma.studentAvailability.create({
    data: { studentId: req.params.id, dayOfWeek: utc.dayOfWeek, startTime: utc.startTime, endTime: utc.endTime, enteredTimezone: MOROCCO_TZ },
  });
  res.json(slot);
});

router.delete('/students/:id/availability/:slotId', async (req, res) => {
  await prisma.studentAvailability.delete({
    where: { id: req.params.slotId, studentId: req.params.id },
  });
  res.json({ ok: true });
});

// —— Discussions with professors (admin ↔ professor only) ——
router.get('/professor-discussions', async (req, res) => {
  const adminId = req.user.id;
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: adminId, receiver: { role: 'PROFESSOR' } },
        { receiverId: adminId, sender: { role: 'PROFESSOR' } },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  const byProfessor = {};
  for (const m of messages) {
    const profId = m.senderId === adminId ? m.receiverId : m.senderId;
    const prof = m.senderId === adminId ? m.receiver : m.sender;
    if (prof?.role !== 'PROFESSOR') continue;
    if (!byProfessor[profId]) {
      byProfessor[profId] = { professorId: profId, professorName: prof.name, lastMessage: null, lastMessageAt: null, unreadCount: 0 };
    }
    const entry = byProfessor[profId];
    if (!entry.lastMessageAt || new Date(m.createdAt) > new Date(entry.lastMessageAt)) {
      entry.lastMessage = m.content?.trim() || (m.attachmentName ? `[${m.attachmentName}]` : '—');
      entry.lastMessageAt = m.createdAt;
    }
    if (m.receiverId === adminId && !m.isSeen) entry.unreadCount += 1;
  }
  const list = Object.values(byProfessor).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
  res.json(list);
});

router.get('/professor-discussions/:professorId', async (req, res) => {
  const adminId = req.user.id;
  const professorId = req.params.professorId;
  const professor = await prisma.user.findFirst({ where: { id: professorId, role: 'PROFESSOR' }, select: { id: true, name: true } });
  if (!professor) return res.status(404).json({ error: 'Professor not found' });
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: adminId, receiverId: professorId },
        { senderId: professorId, receiverId: adminId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  res.json({ professor, messages });
});

router.post('/professor-discussions/:professorId', async (req, res) => {
  const adminId = req.user.id;
  const professorId = req.params.professorId;
  const professor = await prisma.user.findFirst({ where: { id: professorId, role: 'PROFESSOR' }, select: { id: true } });
  if (!professor) return res.status(404).json({ error: 'Professor not found' });
  const content = String(req.body.content ?? '').trim().slice(0, 2000);
  if (!content) return res.status(400).json({ error: 'Message content is required' });
  const msg = await prisma.message.create({
    data: { senderId: adminId, receiverId: professorId, content, isSeen: false },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
  });
  res.json(msg);
});

router.post('/professor-discussions/:professorId/attachment', uploadMessageAttachment.single('file'), async (req, res) => {
  try {
    const adminId = req.user.id;
    const professorId = req.params.professorId;
    const professor = await prisma.user.findFirst({ where: { id: professorId, role: 'PROFESSOR' }, select: { id: true } });
    if (!professor) return res.status(404).json({ error: 'Professor not found' });
    const content = String(req.body.content || '').trim();
    const file = req.file;
    if (!file && !content) return res.status(400).json({ error: 'Message content or file is required' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Convert file to Base64
    const conversionResult = convertDocumentToBase64(file.buffer, file.originalname, file.mimetype);
    if (!conversionResult.success) {
      return res.status(400).json({ error: conversionResult.error, errorCode: conversionResult.errorCode });
    }

    const msg = await prisma.message.create({
      data: {
        senderId: adminId,
        receiverId: professorId,
        content,
        attachmentUrl: conversionResult.data,
        attachmentName: file.originalname,
        attachmentMimeType: conversionResult.mimeType,
        attachmentSize: file.size,
        isSeen: false,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    });
    res.json(msg);
  } catch (err) {
    captureException(err);
    res.status(500).json({ error: err.message || 'Attachment upload failed' });
  }
});

router.put('/professor-discussions/:professorId/seen', async (req, res) => {
  const updated = await prisma.message.updateMany({
    where: { receiverId: req.user.id, senderId: req.params.professorId, isSeen: false },
    data: { isSeen: true, seenAt: new Date() },
  });
  res.json({ ok: true, count: updated.count });
});

// —— Discussion globale (admin + tous les professeurs, un seul fil) ——
router.get('/global-discussion', async (req, res) => {
  const messages = await prisma.globalDiscussionMessage.findMany({
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
    take: 500,
  });
  res.json(messages);
});

router.post('/global-discussion', async (req, res) => {
  const content = String(req.body.content ?? '').trim().slice(0, 2000);
  if (!content) return res.status(400).json({ error: 'Message content is required' });
  const msg = await prisma.globalDiscussionMessage.create({
    data: { senderId: req.user.id, content },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  res.json(msg);
});

router.post('/global-discussion/attachment', uploadMessageAttachment.single('file'), async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();
    const file = req.file;
    if (!file && !content) return res.status(400).json({ error: 'Message content or file is required' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Convert file to Base64
    const conversionResult = convertDocumentToBase64(file.buffer, file.originalname, file.mimetype);
    if (!conversionResult.success) {
      return res.status(400).json({ error: conversionResult.error, errorCode: conversionResult.errorCode });
    }

    const msg = await prisma.globalDiscussionMessage.create({
      data: {
        senderId: req.user.id,
        content,
        attachmentUrl: conversionResult.data,
        attachmentName: file.originalname,
        attachmentMimeType: conversionResult.mimeType,
        attachmentSize: file.size,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    res.json(msg);
  } catch (err) {
    captureException(err);
    res.status(500).json({ error: err.message || 'Attachment upload failed' });
  }
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

// Dashboard analytics (charts, KPIs). Optional ?year=YYYY for full year (Jan–Dec).
router.get('/analytics/dashboard', async (req, res) => {
  const now = new Date();
  const yearParam = req.query.year ? parseInt(req.query.year, 10) : null;
  let monthKeys = [];

  if (yearParam && yearParam >= 2020 && yearParam <= 2100) {
    for (let m = 1; m <= 12; m++) {
      monthKeys.push(`${yearParam}-${String(m).padStart(2, '0')}`);
    }
  } else {
    const monthsBack = 6;
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(d.toISOString().slice(0, 7));
    }
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ['STUDENT', 'PROFESSOR'] } },
    select: { id: true, role: true, createdAt: true },
  });
  const students = users.filter((u) => u.role === 'STUDENT');
  const professors = users.filter((u) => u.role === 'PROFESSOR');

  const payments = await prisma.payment.findMany({
    select: { id: true, studentId: true, amount: true, status: true, date: true, nextPaymentDue: true },
  });

  const courses = await prisma.course.findMany({
    select: { id: true, studentId: true, date: true },
  });

  const endedSessions = await prisma.liveSession.findMany({
    where: { endedAt: { not: null } },
    select: { roomName: true, endedAt: true },
  });
  const endedCourseIds = new Set();
  for (const s of endedSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    endedCourseIds.add(s.roomName.replace('frenchwithus-course-', ''));
  }

  const newStudentsByMonth = monthKeys.map((m) => ({
    month: m,
    count: students.filter((s) => s.createdAt.toISOString().slice(0, 7) === m).length,
  }));

  const cancellationsByMonth = monthKeys.map((m) => {
    const [y, mo] = m.split('-').map(Number);
    const start = new Date(y, mo - 1, 1);
    const end = new Date(y, mo, 0, 23, 59, 59);
    return {
      month: m,
      count: payments.filter(
        (p) =>
          p.status === 'unpaid' &&
          p.nextPaymentDue &&
          new Date(p.nextPaymentDue) >= start &&
          new Date(p.nextPaymentDue) <= end
      ).length,
    };
  });

  const activeByMonth = monthKeys.map((m) => {
    const studentIds = new Set();
    for (const c of courses) {
      if (c.date.startsWith(m) && endedCourseIds.has(c.id)) {
        studentIds.add(c.studentId);
      }
    }
    return { month: m, count: studentIds.size };
  });

  const revenueByMonth = monthKeys.map((m) => {
    const total = payments
      .filter((p) => p.status === 'paid' && p.date.toISOString().slice(0, 7) === m)
      .reduce((s, p) => s + p.amount, 0);
    return { month: m, total };
  });

  const lessonsByMonth = monthKeys.map((m) => {
    const count = courses.filter((c) => c.date.startsWith(m) && endedCourseIds.has(c.id)).length;
    return { month: m, count };
  });

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingCourses = courses.filter((c) => c.date >= today).length;

  const studentsByCountry = await prisma.user.groupBy({
    where: { role: 'STUDENT', country: { not: null } },
    by: ['country'],
    _count: { id: true },
  });

  res.json({
    kpis: {
      totalStudents: students.length,
      totalProfessors: professors.length,
      totalRevenue,
      totalLessons: endedCourseIds.size,
      upcomingCourses,
      unpaidCount: payments.filter((p) => p.status === 'unpaid').length,
      dueSoonCount: payments.filter((p) => {
        if (p.status !== 'paid' || !p.nextPaymentDue) return false;
        const due = new Date(p.nextPaymentDue);
        const in7 = new Date();
        in7.setDate(in7.getDate() + 7);
        return due <= in7;
      }).length,
    },
    subscriptionTrends: { newStudentsByMonth, cancellationsByMonth, activeByMonth },
    revenueByMonth,
    lessonsByMonth,
    studentsByCountry: studentsByCountry
      .map((s) => ({ country: s.country, count: s._count.id }))
      .sort((a, b) => b.count - a.count),
  });
});

// Teacher (professor) statistics for admin dashboard
router.get('/analytics/teachers', async (req, res) => {
  const now = new Date();
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      name: true,
      availability: { select: { id: true } },
      coursesAsProfessor: {
        select: { id: true, date: true, time: true, absenceReason: true, isStarted: true },
      },
    },
  });

  const endedSessions = await prisma.liveSession.findMany({
    where: { endedAt: { not: null } },
    select: { roomName: true, endReason: true },
  });
  const endReasonByCourse = {};
  for (const s of endedSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    const courseId = s.roomName.replace('frenchwithus-course-', '');
    endReasonByCourse[courseId] = s.endReason;
  }

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStart = oneWeekAgo.toISOString().slice(0, 10);

  let absentCount = 0;
  let activeThisWeekCount = 0;
  const professorIdsActiveThisWeek = new Set();
  const professorIdsAbsent = new Set();

  for (const p of professors) {
    for (const c of p.coursesAsProfessor) {
      // Use proper Morocco timezone conversion (handles Ramadan UTC+0 vs standard UTC+1)
      const courseStart = c.startUtc ? new Date(c.startUtc) : moroccoDateTimeToUtc(c.date, c.time);
      const endReason = endReasonByCourse[c.id] || c.absenceReason;
      // Only count as absent if: professor did NOT start the course AND endReason is professor_absent
      // If professor started (even late), they showed up - don't count as absent
      if (!c.isStarted && courseStart && courseStart <= now && endReason === 'professor_absent') {
        professorIdsAbsent.add(p.id);
      }
      if (c.date >= weekStart) {
        professorIdsActiveThisWeek.add(p.id);
      }
    }
    if (professorIdsAbsent.has(p.id)) absentCount++;
    if (professorIdsActiveThisWeek.has(p.id)) activeThisWeekCount++;
  }

  const withAvailabilityCount = professors.filter((p) => p.availability && p.availability.length > 0).length;

  res.json({
    total: professors.length,
    absent: professorIdsAbsent.size,
    activeThisWeek: professorIdsActiveThisWeek.size,
    withAvailability: withAvailabilityCount,
    withoutAvailability: professors.length - withAvailabilityCount,
  });
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

// Réservations séance gratuite (liste pour admin / création de compte)
router.get('/reservations', async (req, res) => {
  const list = await prisma.reservation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(list);
});

router.delete('/reservations/:id', async (req, res) => {
  await prisma.reservation.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Blocked IPs (rate-limit blocks); admin can list and unblock
router.get('/blocked-ips', async (req, res) => {
  const list = await prisma.blockedIp.findMany({
    orderBy: { blockedAt: 'desc' },
    select: { id: true, ip: true, blockedAt: true },
  });
  res.json(list);
});

router.delete('/blocked-ips/:id', async (req, res) => {
  await prisma.blockedIp.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
