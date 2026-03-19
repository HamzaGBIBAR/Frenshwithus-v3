/**
 * Smart scheduling matcher (green/orange/red) for admin.
 *
 * Availability slots are stored in UTC in DB:
 * - dayOfWeek: 1..7 (Mon..Sun)
 * - startTime/endTime: "HH:mm" in UTC
 * - Slots may cross midnight (endTime <= startTime) which wraps into next UTC day.
 *
 * Admin schedules by proposing a start instant in Morocco local time.
 * We convert that local (date+time) to UTC to evaluate overlap precisely.
 */

import { moroccoDateTimeToUtc, MOROCCO_TZ } from './availabilityUtc.js';

function parseTimeToMin(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const [hRaw, mRaw] = timeStr.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function addDayOfWeek(dayOfWeek, add) {
  const d = Number(dayOfWeek);
  const x = ((d - 1 + add) % 7) + 1;
  return x;
}

function dayOfWeekFromUtcDate(date) {
  // getUTCDay(): 0=Sun..6=Sat
  const jsDow = date.getUTCDay();
  return jsDow === 0 ? 7 : jsDow;
}

function slotIntervalRelativeToMeetingStart({ dayOfWeek, startTime, endTime }, meetingStartDayUTC, meetingStartMinUTC) {
  const startMin = parseTimeToMin(startTime);
  const endMin = parseTimeToMin(endTime);
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return null;

  const wraps = endMin <= startMin; // cross midnight

  // Build an interval [absStart0, absEnd0) relative to meetingStartDayUTC 00:00.
  // Then shift by meetingStartMinUTC so that the meeting start instant is 0.
  let absStart0;
  let absEnd0;

  if (!wraps) {
    if (dayOfWeek !== meetingStartDayUTC) return null;
    absStart0 = startMin;
    absEnd0 = endMin;
  } else {
    // Wrapped interval: [startMin on dayOfWeek, endMin on next day)
    const nextDay = addDayOfWeek(dayOfWeek, 1);
    if (meetingStartDayUTC === dayOfWeek) {
      absStart0 = startMin;
      absEnd0 = 1440 + endMin;
    } else if (meetingStartDayUTC === nextDay) {
      absStart0 = -1440 + startMin;
      absEnd0 = endMin;
    } else {
      return null;
    }
  }

  return {
    absStart: absStart0 - meetingStartMinUTC,
    absEnd: absEnd0 - meetingStartMinUTC,
  };
}

function computeBestStatusForMeeting({ studentSlots, profSlots, meetingStartDayUTC, meetingStartMinUTC, durationMin }) {
  let best = null;

  for (const prof of profSlots || []) {
    const pInt = slotIntervalRelativeToMeetingStart(prof, meetingStartDayUTC, meetingStartMinUTC);
    if (!pInt) continue;
    const profContainsStart = pInt.absStart <= 0 && pInt.absEnd > 0;
    if (!profContainsStart) continue;

    for (const student of studentSlots || []) {
      const sInt = slotIntervalRelativeToMeetingStart(student, meetingStartDayUTC, meetingStartMinUTC);
      if (!sInt) continue;
      const studentContainsStart = sInt.absStart <= 0 && sInt.absEnd > 0;
      if (!studentContainsStart) continue;

      const intersectionStart = Math.max(pInt.absStart, sInt.absStart);
      const intersectionEnd = Math.min(pInt.absEnd, sInt.absEnd);
      if (intersectionEnd <= intersectionStart) continue;

      const status = intersectionEnd >= durationMin ? 'green' : 'orange';
      const exact = status === 'green' && intersectionStart === 0 && intersectionEnd === durationMin;
      const overlapLen = intersectionEnd - intersectionStart; // flexibility beyond just the meeting length

      const cand = {
        status,
        exact,
        overlapLen,
        intersectionStart,
        intersectionEnd,
      };

      if (!best) {
        best = cand;
        continue;
      }

      // Ranking: exact > green > orange, then overlap length desc.
      const rankBest = best.exact ? 2 : best.status === 'green' ? 1 : 0;
      const rankCand = cand.exact ? 2 : cand.status === 'green' ? 1 : 0;
      if (rankCand > rankBest) {
        best = cand;
        continue;
      }
      if (rankCand === rankBest && cand.overlapLen > best.overlapLen) {
        best = cand;
      }
    }
  }

  return best || { status: 'red', exact: false, overlapLen: 0 };
}

function hoursList() {
  // Keep existing UI ordering: 01..23 then 00 at end.
  const arr = [];
  for (let h = 1; h <= 23; h += 1) arr.push(`${String(h).padStart(2, '0')}:00`);
  arr.push('00:00');
  return arr;
}

function addDaysToDateStrUtc(dateStr, addDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  base.setUTCDate(base.getUTCDate() + addDays);
  return base.toISOString().slice(0, 10);
}

function coursePayloadForCandidate({ professorId, studentId, weekStart, dayOfWeekMorocco, timeStr, durationMin }) {
  const dayIdx = dayOfWeekMorocco - 1;
  const date = addDaysToDateStrUtc(weekStart, dayIdx);
  return { professorId, studentId, date, time: timeStr, durationMin };
}

export async function buildStudentScheduleMatches({ prisma, studentId, weekStart, durationMin }) {
  const durationMinNum = Number(durationMin) || 60;
  const hours = hoursList();

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      timezone: true,
      country: true,
      professorId: true,
      studentAvailability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  if (!student) {
    return { error: 'Student not found' };
  }

  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      name: true,
      availability: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });

  const weekStartIso = weekStart && /^\\d{4}-\\d{2}-\\d{2}$/.test(weekStart) ? weekStart : new Date().toISOString().slice(0, 10);
  const weekEnd = addDaysToDateStrUtc(weekStartIso, 6);

  // Fetch existing courses for the week to prevent double-booking.
  const courses = await prisma.course.findMany({
    where: { date: { gte: weekStartIso, lte: weekEnd } },
    select: {
      id: true,
      professorId: true,
      studentId: true,
      startUtc: true,
      durationMin: true,
      date: true,
      time: true,
    },
  });

  const coursesByProfessor = new Map();
  const coursesByStudent = [];
  for (const c of courses) {
    const startUtc = c.startUtc ? new Date(c.startUtc) : moroccoDateTimeToUtc(c.date, c.time);
    if (!startUtc || isNaN(startUtc.getTime())) continue;
    const startMs = startUtc.getTime();
    const endMs = startMs + (Number(c.durationMin) || 60) * 60 * 1000;

    if (c.studentId === student.id) {
      coursesByStudent.push({ startMs, endMs });
    }

    const list = coursesByProfessor.get(c.professorId) || [];
    list.push({ startMs, endMs });
    coursesByProfessor.set(c.professorId, list);
  }

  function isOverlapping(aStartMs, aEndMs, bStartMs, bEndMs) {
    return aStartMs < bEndMs && aEndMs > bStartMs;
  }

  function studentBusy(candidateStartMs, candidateEndMs) {
    for (const c of coursesByStudent) {
      if (isOverlapping(candidateStartMs, candidateEndMs, c.startMs, c.endMs)) return true;
    }
    return false;
  }

  function professorBusy(professorId, candidateStartMs, candidateEndMs) {
    const list = coursesByProfessor.get(professorId) || [];
    for (const c of list) {
      if (isOverlapping(candidateStartMs, candidateEndMs, c.startMs, c.endMs)) return true;
    }
    return false;
  }

  const gridByTeacher = {};
  const topCandidatesByTeacher = new Map(); // professorId -> candidate
  const greenDaysByTeacher = new Map(); // professorId -> Set(dayOfWeekMorocco)

  // Pre-load student slots once (in UTC).
  const studentSlots = student.studentAvailability || [];

  // Init containers for professors.
  for (const prof of professors) {
    gridByTeacher[prof.id] = {};
    topCandidatesByTeacher.set(prof.id, null);
    greenDaysByTeacher.set(prof.id, new Set());
  }

  // Candidate evaluation: loop Morocco day/time then evaluate per professor.
  for (let dayOfWeekMorocco = 1; dayOfWeekMorocco <= 7; dayOfWeekMorocco += 1) {
    const date = addDaysToDateStrUtc(weekStartIso, dayOfWeekMorocco - 1);
    for (const timeStr of hours) {
      const startUtc = moroccoDateTimeToUtc(date, timeStr);
      if (!startUtc || isNaN(startUtc.getTime())) {
        // If conversion fails, mark everything red for this cell.
        for (const prof of professors) {
          gridByTeacher[prof.id][dayOfWeekMorocco] = gridByTeacher[prof.id][dayOfWeekMorocco] || {};
          gridByTeacher[prof.id][dayOfWeekMorocco][timeStr] = { status: 'red', exact: false, overlapLen: 0 };
        }
        continue;
      }

      const candidateStartMs = startUtc.getTime();
      const candidateEndMs = candidateStartMs + durationMinNum * 60 * 1000;

      const studentIsBusy = studentBusy(candidateStartMs, candidateEndMs);

      // UTC day/time of candidate start instant.
      const meetingStartDayUTC = dayOfWeekFromUtcDate(startUtc);
      const meetingStartMinUTC = startUtc.getUTCHours() * 60 + startUtc.getUTCMinutes();

      for (const prof of professors) {
        gridByTeacher[prof.id][dayOfWeekMorocco] = gridByTeacher[prof.id][dayOfWeekMorocco] || {};
        if (studentIsBusy || professorBusy(prof.id, candidateStartMs, candidateEndMs)) {
          gridByTeacher[prof.id][dayOfWeekMorocco][timeStr] = { status: 'red', exact: false, overlapLen: 0, busy: true };
          continue;
        }

        const best = computeBestStatusForMeeting({
          studentSlots,
          profSlots: prof.availability || [],
          meetingStartDayUTC,
          meetingStartMinUTC,
          durationMin: durationMinNum,
        });

        gridByTeacher[prof.id][dayOfWeekMorocco][timeStr] = { ...best, busy: false };

        if (best.status === 'green') {
          greenDaysByTeacher.get(prof.id).add(dayOfWeekMorocco);
        }

        const existing = topCandidatesByTeacher.get(prof.id);
        const cand = {
          professorId: prof.id,
          dayOfWeekMorocco,
          time: timeStr,
          status: best.status,
          exact: best.exact,
          overlapLen: best.overlapLen,
          course: coursePayloadForCandidate({
            professorId: prof.id,
            studentId: student.id,
            weekStart: weekStartIso,
            dayOfWeekMorocco,
            timeStr,
            durationMin: durationMinNum,
          }),
        };

        const scoreRank = (c) => (c.exact ? 3 : c.status === 'green' ? 2 : c.status === 'orange' ? 1 : 0);
        const bestScore = existing ? scoreRank(existing) : -1;
        const candScore = scoreRank(cand);
        if (!existing || candScore > bestScore || (candScore === bestScore && cand.overlapLen > existing.overlapLen)) {
          topCandidatesByTeacher.set(prof.id, cand);
        }
      }
    }
  }

  const allTop = [];
  for (const prof of professors) {
    const c = topCandidatesByTeacher.get(prof.id);
    if (!c) continue;
    const freqDays = greenDaysByTeacher.get(prof.id)?.size || 0;
    allTop.push({ ...c, professorName: prof.name, frequencyDays: freqDays });
  }

  allTop.sort((a, b) => {
    // exact > green > orange, then overlap duration, then frequency.
    const rankA = a.exact ? 3 : a.status === 'green' ? 2 : a.status === 'orange' ? 1 : 0;
    const rankB = b.exact ? 3 : b.status === 'green' ? 2 : b.status === 'orange' ? 1 : 0;
    if (rankB !== rankA) return rankB - rankA;
    if (b.overlapLen !== a.overlapLen) return b.overlapLen - a.overlapLen;
    if (b.frequencyDays !== a.frequencyDays) return b.frequencyDays - a.frequencyDays;
    if (a.dayOfWeekMorocco !== b.dayOfWeekMorocco) return a.dayOfWeekMorocco - b.dayOfWeekMorocco;
    return a.time.localeCompare(b.time);
  });

  const topMatches = allTop.slice(0, 8);

  return {
    student: { id: student.id, name: student.name, timezone: student.timezone || null, country: student.country || null, professorId: student.professorId || null },
    weekStart: weekStartIso,
    durationMin: durationMinNum,
    timeSlots: hours,
    professors: professors.map((p) => ({ id: p.id, name: p.name, assigned: student.professorId === p.id })),
    gridByTeacher,
    topMatches,
  };
}

