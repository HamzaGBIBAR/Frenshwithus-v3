import { Router } from 'express';
import prisma from '../lib/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const DAY_MS = 24 * 60 * 60 * 1000;

function parseCourseDateTime(course) {
  return new Date(`${course.date}T${course.time}`);
}

async function ensureNotification(userId, payload) {
  await prisma.notification.upsert({
    where: { userId_dedupeKey: { userId, dedupeKey: payload.dedupeKey } },
    update: {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      link: payload.link || null,
      // do not set archivedAt: null — respect user's choice to archive
    },
    create: {
      userId,
      dedupeKey: payload.dedupeKey,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      link: payload.link || null,
    },
  });
}

async function generateAdminNotifications(userId) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * DAY_MS);

  const threeDaysAgo = new Date(now.getTime() - 3 * DAY_MS);

  const [duePayments, absentCourses, recentReservations] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: 'paid',
        nextPaymentDue: { not: null, lte: in7Days },
      },
      include: { student: { select: { name: true } } },
      take: 20,
      orderBy: { nextPaymentDue: 'asc' },
    }),
    prisma.course.findMany({
      where: { absenceReason: 'professor_absent' },
      include: {
        professor: { select: { name: true } },
        student: { select: { name: true } },
      },
      take: 20,
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: threeDaysAgo } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  for (const p of duePayments) {
    await ensureNotification(userId, {
      dedupeKey: `admin-payment-${p.id}-${p.nextPaymentDue?.toISOString().slice(0, 10) || 'na'}`,
      title: 'Paiement a echeance',
      body: `${p.student?.name || 'Eleve'} - ${new Date(p.nextPaymentDue).toLocaleDateString()}`,
      type: 'warning',
      link: '/admin/payments',
    });
  }

  for (const c of absentCourses) {
    await ensureNotification(userId, {
      dedupeKey: `admin-absence-${c.id}`,
      title: 'Absence professeur detectee',
      body: `${c.professor?.name || 'Prof'} / ${c.student?.name || 'Eleve'} - ${c.date} ${c.time}`,
      type: 'warning',
      link: '/admin/courses',
    });
  }

  for (const r of recentReservations) {
    const audienceLabel = r.audience === 'adults' ? 'Adulte' : r.audience === 'children' ? 'Enfant' : '';
    await ensureNotification(userId, {
      dedupeKey: `admin-reservation-${r.id}`,
      title: 'Nouvelle reservation',
      body: `${r.firstName} ${r.lastName} (${r.email})${audienceLabel ? ` - ${audienceLabel}` : ''}`,
      type: 'info',
      link: '/admin/reservations',
    });
  }
}

async function generateProfessorNotifications(userId) {
  const now = new Date();
  const in24h = new Date(now.getTime() + DAY_MS);
  const today = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [courses, unreadMessages] = await Promise.all([
    prisma.course.findMany({
      where: { professorId: userId, date: { gte: today } },
      include: { student: { select: { name: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: 30,
    }),
    prisma.message.findMany({
      where: { receiverId: userId, isSeen: false },
      include: { sender: { select: { id: true, name: true, role: true } } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  for (const c of courses) {
    if (c.createdAt >= sevenDaysAgo) {
      await ensureNotification(userId, {
        dedupeKey: `prof-new-course-${c.id}`,
        title: 'Nouveau cours assigne',
        body: `${c.student?.name || 'Eleve'} - ${c.date} ${c.time}`,
        type: 'info',
        link: '/professor/courses',
      });
    }
  }

  const upcoming = courses.filter((c) => {
    const dt = parseCourseDateTime(c);
    return dt >= now && dt <= in24h;
  });

  for (const c of upcoming) {
    await ensureNotification(userId, {
      dedupeKey: `prof-upcoming-${c.id}`,
      title: 'Cours a venir',
      body: `${c.student?.name || 'Eleve'} - ${c.date} ${c.time}`,
      type: 'info',
      link: '/professor/courses',
    });
  }

  const grouped = unreadMessages
    .filter((m) => m.sender?.role === 'STUDENT')
    .reduce((acc, m) => {
      const key = m.sender.id;
      acc[key] = acc[key] || { senderName: m.sender.name, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {});

  for (const senderId of Object.keys(grouped)) {
    const g = grouped[senderId];
    await ensureNotification(userId, {
      dedupeKey: `prof-unread-${senderId}`,
      title: 'Nouveaux messages',
      body: `${g.senderName} (${g.count})`,
      type: 'info',
      link: '/professor/messages',
    });
  }
}

async function generateStudentNotifications(userId) {
  const now = new Date();
  const in24h = new Date(now.getTime() + DAY_MS);
  const today = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [courses, unreadMessages, unpaid] = await Promise.all([
    prisma.course.findMany({
      where: { studentId: userId, date: { gte: today } },
      include: { professor: { select: { name: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: 30,
    }),
    prisma.message.findMany({
      where: { receiverId: userId, isSeen: false },
      include: { sender: { select: { id: true, name: true, role: true } } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: { studentId: userId, status: 'unpaid' },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ]);

  for (const c of courses) {
    if (c.createdAt >= sevenDaysAgo) {
      await ensureNotification(userId, {
        dedupeKey: `student-new-course-${c.id}`,
        title: 'Nouveau cours programme',
        body: `${c.professor?.name || 'Prof'} - ${c.date} ${c.time}`,
        type: 'info',
        link: '/student',
      });
    }
  }

  const upcoming = courses.filter((c) => {
    const dt = parseCourseDateTime(c);
    return dt >= now && dt <= in24h;
  });

  for (const c of upcoming) {
    await ensureNotification(userId, {
      dedupeKey: `student-upcoming-${c.id}`,
      title: 'Cours bientot',
      body: `${c.professor?.name || 'Prof'} - ${c.date} ${c.time}`,
      type: 'info',
      link: '/student',
    });
  }

  const grouped = unreadMessages
    .filter((m) => m.sender?.role === 'PROFESSOR')
    .reduce((acc, m) => {
      const key = m.sender.id;
      acc[key] = acc[key] || { senderName: m.sender.name, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {});

  for (const senderId of Object.keys(grouped)) {
    const g = grouped[senderId];
    await ensureNotification(userId, {
      dedupeKey: `student-unread-${senderId}`,
      title: 'Nouveaux messages',
      body: `${g.senderName} (${g.count})`,
      type: 'info',
      link: '/student/messages',
    });
  }

  for (const p of unpaid) {
    await ensureNotification(userId, {
      dedupeKey: `student-unpaid-${p.id}`,
      title: 'Paiement en attente',
      body: `Montant: €${Number(p.amount || 0).toFixed(2)} - Réf: ${p.reference || p.id.slice(-6)}`,
      type: 'warning',
      link: '/student#payments',
    });
  }
}

router.get('/notifications', authenticate, async (req, res) => {
  if (req.user.role === 'ADMIN') await generateAdminNotifications(req.user.id);
  if (req.user.role === 'PROFESSOR') await generateProfessorNotifications(req.user.id);
  if (req.user.role === 'STUDENT') await generateStudentNotifications(req.user.id);

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ notifications, unreadCount });
});

router.put('/notifications/read-all', authenticate, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false, archivedAt: null },
    data: { isRead: true, readAt: new Date() },
  });
  res.json({ ok: true });
});

router.put('/notifications/:id/read', authenticate, async (req, res) => {
  const updated = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id, archivedAt: null },
    data: { isRead: true, readAt: new Date() },
  });
  if (!updated.count) return res.status(404).json({ error: 'Notification not found' });
  res.json({ ok: true });
});

router.delete('/notifications/:id', authenticate, async (req, res) => {
  const updated = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (!updated.count) return res.status(404).json({ error: 'Notification not found' });
  res.json({ ok: true });
});

router.put('/notifications/archive-all', authenticate, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  res.json({ ok: true });
});

export default router;
