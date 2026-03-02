import { Router } from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import streamifier from 'streamifier';
import prisma from '../lib/db.js';
import { cloudinary } from '../config/cloudinary.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, messageValidation, availabilityValidation, profileUpdateValidation, passwordChangeValidation } from '../middleware/validate.js';
import { captureException } from '../lib/sentry.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('PROFESSOR'));

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
