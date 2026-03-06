/**
 * Auto-generate weekly courses from professor and student availability.
 * Availability slots are stored in UTC. We find overlaps in UTC, then create courses in Morocco time.
 */

import prisma from './db.js';
import {
  utcSlotToMoroccoDateAndTime,
  findOverlaps,
  moroccoDateTimeToUtc,
} from './availabilityUtc.js';

const DEFAULT_DURATION_MIN = 60;

/**
 * Get Monday of the week for a given date (YYYY-MM-DD).
 */
function getMondayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Build candidate courses for the week: (professorId, studentId, date, time) in Morocco.
 * Only pairs where student is assigned to professor (student.professorId === professor.id).
 * Uses slot start as course start; ensures overlap is at least durationMin long.
 */
function buildCandidates(professors, students, weekStartMonday, durationMin) {
  const candidates = [];
  const durationMinNum = Number(durationMin) || DEFAULT_DURATION_MIN;

  for (const student of students) {
    const professorId = student.professorId || null;
    if (!professorId) continue;
    const professor = professors.find((p) => p.id === professorId);
    if (!professor || !professor.availability?.length) continue;

    const overlaps = findOverlaps(professor.availability, student.studentAvailability);
    for (const ov of overlaps) {
      const { date, time } = utcSlotToMoroccoDateAndTime(ov.dayOfWeek, ov.startUtc, weekStartMonday);
      candidates.push({
        professorId: professor.id,
        studentId: student.id,
        date,
        time,
        durationMin: durationMinNum,
      });
    }
  }

  return candidates;
}

/**
 * Remove candidates that would double-book professor or student.
 * existingCourses: array of { professorId, studentId, date, time } for the week.
 */
function filterDoubleBooking(candidates, existingCourses) {
  const professorBusy = new Set();
  const studentBusy = new Set();
  for (const c of existingCourses) {
    professorBusy.add(`${c.date}T${c.time}:${c.professorId}`);
    studentBusy.add(`${c.date}T${c.time}:${c.studentId}`);
  }

  const out = [];
  for (const cand of candidates) {
    const keyP = `${cand.date}T${cand.time}:${cand.professorId}`;
    const keyS = `${cand.date}T${cand.time}:${cand.studentId}`;
    if (professorBusy.has(keyP) || studentBusy.has(keyS)) continue;
    out.push(cand);
    professorBusy.add(keyP);
    studentBusy.add(keyS);
  }
  return out;
}

/**
 * Run auto-generation for the given week.
 * @param {string} weekStart - Monday of the week (YYYY-MM-DD)
 * @param {number} [durationMin] - course duration in minutes
 * @returns {{ created: number, courses: Array, message?: string }}
 */
export async function autoGenerateWeeklyCourses(weekStart, durationMin = DEFAULT_DURATION_MIN) {
  const weekMonday = getMondayOfWeek(weekStart);

  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      name: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      professorId: true,
      studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });

  let candidates = buildCandidates(professors, students, weekMonday, durationMin);
  const seen = new Set();
  candidates = candidates.filter((c) => {
    const key = `${c.professorId}:${c.studentId}:${c.date}:${c.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (candidates.length === 0) {
    return { created: 0, courses: [], message: 'No overlapping availability found for assigned professor–student pairs.' };
  }

  const weekEndDate = new Date(weekMonday + 'T12:00:00Z');
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  const weekEndStr = weekEndDate.toISOString().slice(0, 10);

  const existingCourses = await prisma.course.findMany({
    where: {
      date: { gte: weekMonday, lte: weekEndStr },
    },
    select: { date: true, time: true, professorId: true, studentId: true },
  });

  const toCreate = filterDoubleBooking(candidates, existingCourses);

  const created = [];
  for (const c of toCreate) {
    const startUtc = moroccoDateTimeToUtc(c.date, c.time);
    const course = await prisma.course.create({
      data: {
        professorId: c.professorId,
        studentId: c.studentId,
        date: c.date,
        time: c.time,
        startUtc: startUtc || undefined,
        durationMin: c.durationMin,
      },
      include: {
        professor: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
    });
    created.push(course);
  }

  return { created: created.length, courses: created };
}

/**
 * Preview only: return suggested slots without creating courses.
 */
export async function previewAutoGenerate(weekStart, durationMin = DEFAULT_DURATION_MIN) {
  const weekMonday = getMondayOfWeek(weekStart);

  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      name: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      professorId: true,
      studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });

  let candidates = buildCandidates(professors, students, weekMonday, durationMin);
  const seen = new Set();
  candidates = candidates.filter((c) => {
    const key = `${c.professorId}:${c.studentId}:${c.date}:${c.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const weekEndDate = new Date(weekMonday + 'T12:00:00Z');
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
  const weekEndStr = weekEndDate.toISOString().slice(0, 10);
  const existing = await prisma.course.findMany({
    where: { date: { gte: weekMonday, lte: weekEndStr } },
    select: { date: true, time: true, professorId: true, studentId: true },
  });

  const toCreate = filterDoubleBooking(candidates, existing);
  return {
    suggested: toCreate.length,
    slots: toCreate.map((c) => ({
      professorId: c.professorId,
      studentId: c.studentId,
      date: c.date,
      time: c.time,
      durationMin: c.durationMin,
    })),
  };
}
