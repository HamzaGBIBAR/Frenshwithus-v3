import { Router } from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import streamifier from 'streamifier';
import prisma from '../lib/db.js';
import { cloudinary } from '../config/cloudinary.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, messageValidation, availabilityValidation, profileUpdateValidation, passwordChangeValidation } from '../middleware/validate.js';
import { captureException } from '../lib/sentry.js';
import { localSlotToUtc, utcSlotToZoned, getUserTz } from '../lib/availabilityUtc.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('PROFESSOR'));

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MESSAGE_ALLOWED_MIMES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
];
const MESSAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only jpg, jpeg, png allowed.'));
    }
    cb(null, true);
  },
});

const uploadMessageAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MESSAGE_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!MESSAGE_ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only Word, Excel and PDF files are allowed.'));
    }
    cb(null, true);
  },
});

function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'frenchwithus/avatars',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

function uploadMessageFileToCloudinary(buffer, originalName = 'file.bin') {
  const safeName = String(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'frenchwithus/messages',
        public_id: publicId,
        overwrite: false,
        resource_type: 'raw',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const match = url.match(/\/v\d+\/(.+)\.(?:jpg|jpeg|png)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// My profile
router.get('/profile', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
  });
  res.json(user);
});

router.put('/profile', profileUpdateValidation, validate, async (req, res) => {
  const { name, avatarUrl } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
  });
  res.json(user);
});

router.put('/profile/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      captureException(new Error('Cloudinary env vars not configured'));
      return res.status(503).json({ error: 'Avatar upload not configured' });
    }
    const result = await uploadBufferToCloudinary(req.file.buffer, req.user.id);
    const avatarUrl = result.secure_url;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
    });
    res.json(user);
  } catch (err) {
    captureException(err);
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: err.message || 'Avatar upload failed' });
  }
});

router.delete('/profile/avatar', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });
    const publicId = extractPublicIdFromUrl(user?.avatarUrl);
    if (publicId && process.env.CLOUDINARY_API_KEY) {
      await cloudinary.uploader.destroy(publicId);
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
    });
    res.json(updated);
  } catch (err) {
    captureException(err);
    console.error('Avatar delete error:', err);
    res.status(500).json({ error: err.message || 'Avatar delete failed' });
  }
});

router.put('/password', passwordChangeValidation, validate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  const hashed = bcrypt.hashSync(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
  res.json({ ok: true });
});

// My courses – inclut sessionEnded et sessionEndedAt
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { professorId: req.user.id },
    include: { student: { select: { id: true, name: true, email: true, country: true } } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const [endedSessions, activeSessions] = await Promise.all([
    prisma.liveSession.findMany({
      where: { endedAt: { not: null } },
      select: { roomName: true, endedAt: true, endReason: true },
      orderBy: { endedAt: 'desc' },
    }),
    prisma.liveSession.findMany({
      where: { professorId: req.user.id, endedAt: null },
      select: { roomName: true, startedAt: true },
      orderBy: { startedAt: 'desc' },
    }),
  ]);
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
  const sessionStartedAtByCourse = {};
  for (const s of activeSessions) {
    if (!s.roomName.startsWith('frenchwithus-course-')) continue;
    const courseId = s.roomName.replace('frenchwithus-course-', '');
    if (!sessionStartedAtByCourse[courseId]) sessionStartedAtByCourse[courseId] = s.startedAt;
  }

  const coursesWithStatus = courses.map((c) => ({
    ...c,
    sessionEnded: c.isStarted && endedCourseIds.has(c.id),
    sessionEndedAt: endedAtByCourse[c.id] || null,
    endReason: endReasonByCourse[c.id] || c.absenceReason || null,
    sessionStartedAt: sessionStartedAtByCourse[c.id] || null,
  }));

  res.json(coursesWithStatus);
});

// My weekly availability (stored in UTC; returned in professor's timezone)
router.get('/availability', async (req, res) => {
  const [slots, user] = await Promise.all([
    prisma.professorAvailability.findMany({
      where: { professorId: req.user.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.user.findUnique({
      where: { id: req.user.id },
      select: { timezone: true, country: true },
    }),
  ]);
  const tz = getUserTz(user?.timezone, user?.country);
  const inLocal = slots.map((s) => {
    const z = utcSlotToZoned(s.dayOfWeek, s.startTime, s.endTime, tz);
    return z ? { ...s, dayOfWeek: z.dayOfWeek, startTime: z.startTime, endTime: z.endTime } : s;
  });
  res.json(inLocal);
});

// Professor enters slot in their local timezone; prefer profile timezone over browser so "teacher in Paris" uses Paris even if opened from elsewhere.
router.post('/availability', availabilityValidation, validate, async (req, res) => {
  const { dayOfWeek, startTime, endTime, timezone: bodyTz } = req.body;
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { timezone: true, country: true },
  });
  let tz = getUserTz(user?.timezone, user?.country);
  if (!user?.timezone && !user?.country && bodyTz && typeof bodyTz === 'string' && bodyTz.trim().length > 0) {
    tz = bodyTz.trim();
    await prisma.user.update({
      where: { id: req.user.id },
      data: { timezone: tz },
    }).catch(() => {});
  }
  const utc = localSlotToUtc(Number(dayOfWeek), startTime, endTime, tz);
  if (!utc) return res.status(400).json({ error: 'Invalid time slot; could not convert to UTC. Check time format (HH:mm) and timezone.' });
  const slot = await prisma.professorAvailability.create({
    data: { professorId: req.user.id, dayOfWeek: utc.dayOfWeek, startTime: utc.startTime, endTime: utc.endTime, enteredTimezone: tz },
  });
  res.json(slot);
});

router.delete('/availability/:id', async (req, res) => {
  await prisma.professorAvailability.delete({
    where: { id: req.params.id, professorId: req.user.id },
  });
  res.json({ ok: true });
});

// Update meeting link
router.put('/courses/:id/meeting-link', async (req, res) => {
  const { meetingLink } = req.body;
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, professorId: req.user.id },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const updated = await prisma.course.update({
    where: { id: course.id },
    data: { meetingLink },
  });
  res.json(updated);
});

// Start course
router.put('/courses/:id/start', async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, professorId: req.user.id },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const updated = await prisma.course.update({
    where: { id: course.id },
    data: { isStarted: true },
  });
  res.json(updated);
});

// Add recording link
router.put('/courses/:id/recording', async (req, res) => {
  const { recordingLink } = req.body;
  const course = await prisma.course.findFirst({
    where: { id: req.params.id, professorId: req.user.id },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const updated = await prisma.course.update({
    where: { id: course.id },
    data: { recordingLink },
  });
  res.json(updated);
});

// Students: all students (assigned ones listed first, so prof can message anyone)
router.get('/students', async (req, res) => {
  const professorId = req.user.id;
  const [assigned, allStudents] = await Promise.all([
    prisma.user.findMany({
      where: { professorId, role: 'STUDENT' },
      select: { id: true, name: true, email: true, lastActiveAt: true },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, lastActiveAt: true },
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
    data: { senderId: req.user.id, receiverId, content, isSeen: false },
    include: {
      receiver: { select: { id: true, name: true } },
    },
  });
  res.json(msg);
});

// Send message to student with attachment
router.post('/messages/attachment', uploadMessageAttachment.single('file'), async (req, res) => {
  try {
    const receiverId = String(req.body.receiverId || '').trim();
    const content = String(req.body.content || '').trim();
    const file = req.file;
    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
    if (!file && !content) return res.status(400).json({ error: 'Message content or file is required' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const receiver = await prisma.user.findFirst({
      where: { id: receiverId, role: 'STUDENT' },
      select: { id: true, name: true },
    });
    if (!receiver) return res.status(404).json({ error: 'Student not found' });

    const uploadResult = await uploadMessageFileToCloudinary(file.buffer, file.originalname);
    const msg = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        attachmentUrl: uploadResult.secure_url,
        attachmentName: file.originalname,
        attachmentMimeType: file.mimetype,
        attachmentSize: file.size,
        isSeen: false,
      },
      include: {
        receiver: { select: { id: true, name: true } },
      },
    });
    res.json(msg);
  } catch (err) {
    captureException(err);
    res.status(500).json({ error: err.message || 'Attachment upload failed' });
  }
});

// —— Discussion with Admin (professor ↔ admin only) ——
async function getAdminUserId() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  return admin?.id ?? null;
}

router.get('/admin-discussion', async (req, res) => {
  const adminId = await getAdminUserId();
  if (!adminId) return res.json([]);
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.user.id, receiverId: adminId },
        { senderId: adminId, receiverId: req.user.id },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
  res.json(messages);
});

router.post('/admin-discussion', async (req, res) => {
  const adminId = await getAdminUserId();
  if (!adminId) return res.status(503).json({ error: 'Admin not available' });
  const content = String(req.body.content ?? '').trim().slice(0, 2000);
  if (!content) return res.status(400).json({ error: 'Message content is required' });
  const msg = await prisma.message.create({
    data: { senderId: req.user.id, receiverId: adminId, content, isSeen: false },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
  });
  res.json(msg);
});

router.post('/admin-discussion/attachment', uploadMessageAttachment.single('file'), async (req, res) => {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) return res.status(503).json({ error: 'Admin not available' });
    const content = String(req.body.content || '').trim();
    const file = req.file;
    if (!file && !content) return res.status(400).json({ error: 'Message content or file is required' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const uploadResult = await uploadMessageFileToCloudinary(file.buffer, file.originalname);
    const msg = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId: adminId,
        content,
        attachmentUrl: uploadResult.secure_url,
        attachmentName: file.originalname,
        attachmentMimeType: file.mimetype,
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
    const uploadResult = await uploadMessageFileToCloudinary(file.buffer, file.originalname);
    const msg = await prisma.globalDiscussionMessage.create({
      data: {
        senderId: req.user.id,
        content,
        attachmentUrl: uploadResult.secure_url,
        attachmentName: file.originalname,
        attachmentMimeType: file.mimetype,
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

// My messages (conversations with students)
router.get('/messages', async (req, res) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.user.id, archivedBySender: false },
        { receiverId: req.user.id, archivedByReceiver: false },
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

router.put('/messages/:id/seen', async (req, res) => {
  const updated = await prisma.message.updateMany({
    where: {
      id: req.params.id,
      receiverId: req.user.id,
    },
    data: {
      isSeen: true,
      seenAt: new Date(),
    },
  });
  if (!updated.count) return res.status(404).json({ error: 'Message not found' });
  res.json({ ok: true });
});

router.put('/messages/:id/archive', async (req, res) => {
  const msg = await prisma.message.findFirst({
    where: {
      id: req.params.id,
      OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    },
    select: { id: true, senderId: true, receiverId: true },
  });
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const data = msg.senderId === req.user.id
    ? { archivedBySender: true }
    : { archivedByReceiver: true };

  await prisma.message.update({
    where: { id: msg.id },
    data,
  });
  res.json({ ok: true });
});

export default router;
