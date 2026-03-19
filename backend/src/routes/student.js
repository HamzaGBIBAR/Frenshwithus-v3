import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, messageValidation, studentAvailabilityValidation, profileUpdateValidation, passwordChangeValidation } from '../middleware/validate.js';
import { captureException } from '../lib/sentry.js';
import { localSlotToUtc, utcSlotToZoned, getUserTz } from '../lib/availabilityUtc.js';
import { convertToBase64, AVATAR_MAX_SIZE as BASE64_MAX_SIZE, AVATAR_ALLOWED_MIMES } from '../lib/avatarBase64.js';
import { convertDocumentToBase64, DOCUMENT_MAX_SIZE, DOCUMENT_ALLOWED_TYPES } from '../lib/documentBase64.js';

const router = Router();

const AVATAR_MIMES = AVATAR_ALLOWED_MIMES;
const AVATAR_MAX_SIZE = BASE64_MAX_SIZE;

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!AVATAR_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF allowed.'));
    }
    cb(null, true);
  },
});

const MESSAGE_ALLOWED_MIMES = DOCUMENT_ALLOWED_TYPES;
const MESSAGE_MAX_SIZE = DOCUMENT_MAX_SIZE;
const PAYMENT_PROOF_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
const PAYMENT_PROOF_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadMessageAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MESSAGE_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!MESSAGE_ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, Excel, and images allowed.'));
    }
    cb(null, true);
  },
});

const uploadPaymentProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PAYMENT_PROOF_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!PAYMENT_PROOF_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WebP images and PDF are allowed.'));
    }
    cb(null, true);
  },
});

function uploadPaymentProofToCloudinary(buffer, mimetype) {
  const isPdf = mimetype === 'application/pdf';
  const publicId = `payment-proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'frenchwithus/payment-proofs',
        public_id: publicId,
        overwrite: false,
        resource_type: isPdf ? 'raw' : 'image',
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

// My profile
router.get('/profile', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
  });
  res.json(user);
});

router.put('/profile', profileUpdateValidation, validate, async (req, res) => {
  const { name } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, name: true, email: true, createdAt: true, avatarUrl: true },
  });
  res.json(user);
});

router.post('/profile/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Convert image to Base64 with validation
    const result = convertToBase64(req.file.buffer, req.file.mimetype);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error,
        errorCode: result.errorCode,
      });
    }
    
    // Store Base64 data URI in database
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.data },
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

router.put('/profile/password', passwordChangeValidation, validate, async (req, res) => {
  const bcrypt = (await import('bcryptjs')).default;
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed },
  });
  res.json({ ok: true });
});

// My weekly availability (stored in UTC; returned in student's timezone)
router.get('/availability', async (req, res) => {
  const [slots, user] = await Promise.all([
    prisma.studentAvailability.findMany({
      where: { studentId: req.user.id },
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

// Student enters slot in their local timezone; we always convert to UTC before storing (DB must store only UTC).
// Prefer profile timezone (user.timezone or from user.country) so "student from Canada" uses Canada time even if opened from Morocco.
router.post('/availability', studentAvailabilityValidation, validate, async (req, res) => {
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
  const slot = await prisma.studentAvailability.create({
    data: { studentId: req.user.id, dayOfWeek: utc.dayOfWeek, startTime: utc.startTime, endTime: utc.endTime, enteredTimezone: tz },
  });
  res.json(slot);
});

router.delete('/availability/:id', async (req, res) => {
  await prisma.studentAvailability.delete({
    where: { id: req.params.id, studentId: req.user.id },
  });
  res.json({ ok: true });
});

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

// Upload payment proof (screenshot/receipt for WhatsApp payment)
router.post('/payments/:id/proof', uploadPaymentProof.single('proof'), async (req, res) => {
  const paymentId = req.params.id;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, studentId: req.user.id, status: 'unpaid' },
    include: { student: { select: { name: true } } },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found or already paid' });

  const uploadResult = await uploadPaymentProofToCloudinary(file.buffer, file.mimetype);
  await prisma.payment.update({
    where: { id: paymentId },
    data: { proofUrl: uploadResult.secure_url, proofUploadedAt: new Date() },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  for (const admin of admins) {
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId: admin.id, dedupeKey: `payment-proof-${paymentId}` } },
      update: {
        title: 'Preuve de paiement reçue',
        body: `${payment.student?.name || 'Élève'} a envoyé une preuve pour ${payment.reference} (€${payment.amount})`,
        type: 'info',
        link: '/admin/payments',
        archivedAt: null,
      },
      create: {
        userId: admin.id,
        dedupeKey: `payment-proof-${paymentId}`,
        title: 'Preuve de paiement reçue',
        body: `${payment.student?.name || 'Élève'} a envoyé une preuve pour ${payment.reference} (€${payment.amount})`,
        type: 'info',
        link: '/admin/payments',
      },
    });
  }

  res.json({ ok: true, proofUrl: uploadResult.secure_url });
});

// Remove payment proof (student can remove and re-upload if mistaken)
router.delete('/payments/:id/proof', async (req, res) => {
  const paymentId = req.params.id;
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, studentId: req.user.id, status: 'unpaid' },
  });
  if (!payment) return res.status(404).json({ error: 'Payment not found or already paid' });
  await prisma.payment.update({
    where: { id: paymentId },
    data: { proofUrl: null, proofUploadedAt: null },
  });
  res.json({ ok: true });
});

// Send message to professor
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

    // Convert file to Base64
    const conversionResult = convertDocumentToBase64(file.buffer, file.originalname, file.mimetype);
    if (!conversionResult.success) {
      return res.status(400).json({ error: conversionResult.error, errorCode: conversionResult.errorCode });
    }

    const msg = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        attachmentUrl: conversionResult.data,
        attachmentName: file.originalname,
        attachmentMimeType: conversionResult.mimeType,
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

// All professors (so student can contact any of them)
router.get('/professors', async (req, res) => {
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: { id: true, name: true, email: true, avatarUrl: true, lastActiveAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(professors);
});

// My messages
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
