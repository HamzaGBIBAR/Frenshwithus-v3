import { Router } from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import prisma from '../lib/db.js';
import { cloudinary } from '../config/cloudinary.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, messageValidation } from '../middleware/validate.js';

const router = Router();

const MESSAGE_ALLOWED_MIMES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
];
const MESSAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

router.use(authenticate);
router.use(requireRole('STUDENT'));

// Upcoming courses – inclut sessionEnded et sessionEndedAt
router.get('/courses', async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { studentId: req.user.id },
    include: { professor: { select: { id: true, name: true, email: true, avatarUrl: true } } },
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

  const courseProfessorOnline = req.app.locals?.courseProfessorOnline ?? {};

  const coursesWithStatus = courses.map((c) => {
    const sessionEnded = c.isStarted && endedCourseIds.has(c.id);
    return {
      ...c,
      sessionEnded,
      sessionEndedAt: endedAtByCourse[c.id] || null,
      endReason: endReasonByCourse[c.id] || c.absenceReason || null,
      // L'enregistrement n'est accessible qu'après que le prof ait terminé le cours
      recordingLink: sessionEnded ? c.recordingLink : null,
      // Le prof est-il dans la réunion ? (pour activer le bouton Rejoindre)
      professorOnline: !!courseProfessorOnline[c.id],
    };
  });

  res.json(coursesWithStatus);
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

// Send message to professor with attachment
router.post('/messages/attachment', uploadMessageAttachment.single('file'), async (req, res) => {
  try {
    const receiverId = String(req.body.receiverId || '').trim();
    const content = String(req.body.content || '').trim();
    const file = req.file;
    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
    if (!file && !content) return res.status(400).json({ error: 'Message content or file is required' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const receiver = await prisma.user.findFirst({
      where: { id: receiverId, role: 'PROFESSOR' },
      select: { id: true, name: true },
    });
    if (!receiver) return res.status(404).json({ error: 'Professor not found' });

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
      },
      include: {
        receiver: { select: { id: true, name: true } },
      },
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Attachment upload failed' });
  }
});

// All professors (so student can contact any of them)
router.get('/professors', async (req, res) => {
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: { id: true, name: true, email: true, avatarUrl: true },
    orderBy: { name: 'asc' },
  });
  res.json(professors);
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
