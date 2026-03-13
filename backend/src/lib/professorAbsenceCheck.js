/**
 * Vérifie périodiquement les cours où le professeur n'a pas démarré après 15 minutes.
 * Marque le cours "Absence du Prof" et notifie l'admin via Socket.IO si connecté.
 * Course start is taken from startUtc (UTC) when set, else from date+time as Morocco.
 */
import prisma from './db.js';
import { moroccoDateTimeToUtc } from './availabilityUtc.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000; // toutes les minutes

let intervalId = null;

/** Get course start as Date (UTC). Uses startUtc when set, else converts Morocco date+time to UTC dynamically. */
function getCourseStart(course) {
  if (course.startUtc) return new Date(course.startUtc);
  // Use dynamic Morocco timezone (handles Ramadan UTC+0 vs standard UTC+1)
  const utcDate = moroccoDateTimeToUtc(course.date, course.time);
  if (utcDate && !isNaN(utcDate.getTime())) return utcDate;
  // Fallback: parse as Morocco with dynamic offset using Intl API
  const timePart = !course.time || course.time.length <= 5 ? `${course.time || '00:00'}:00` : course.time;
  const isoStr = `${course.date}T${timePart}`;
  try {
    const probe = new Date(isoStr + 'Z');
    const moroccoStr = probe.toLocaleString('sv-SE', { timeZone: 'Africa/Casablanca' });
    const moroccoProbeTime = new Date(moroccoStr.replace(' ', 'T') + 'Z');
    const offsetMs = probe.getTime() - moroccoProbeTime.getTime();
    return new Date(new Date(isoStr + 'Z').getTime() + offsetMs);
  } catch (_) {
    // Last resort fallback: assume UTC+1
    return new Date(`${course.date}T${timePart}+01:00`);
  }
}

export function startProfessorAbsenceChecker(app) {
  if (intervalId) return;

  const run = async () => {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - FIFTEEN_MINUTES_MS);

      const courses = await prisma.course.findMany({
        where: {
          isStarted: false,
          absenceReason: null,
        },
        include: {
          professor: { select: { id: true, name: true } },
          student: { select: { id: true, name: true } },
        },
      });

      // Filter: course start (UTC) was at least 15 min ago
      // Extra safety: also verify using string comparison in Africa/Casablanca timezone
      const toMark = courses.filter((c) => {
        const courseStart = getCourseStart(c);
        if (isNaN(courseStart.getTime())) return false;
        
        // Primary check: is the course start at least 15 min in the past?
        if (courseStart.getTime() > cutoff.getTime()) return false;
        
        // Safety guard: verify using Africa/Casablanca string comparison
        // This prevents marking courses as absent if the time hasn't arrived in Morocco yet
        if (c.date && c.time) {
          try {
            const moroccoNow = now.toLocaleString('sv-SE', { timeZone: 'Africa/Casablanca' });
            const moroccoDateStr = moroccoNow.slice(0, 10);
            const moroccoTimeStr = moroccoNow.slice(11, 16);
            const courseTimeShort = (c.time || '').slice(0, 5);
            
            // If course is still in the future in Morocco time, don't mark as absent
            if (c.date > moroccoDateStr || (c.date === moroccoDateStr && courseTimeShort > moroccoTimeStr)) {
              return false;
            }
            
            // Calculate 15 minutes after course time in Morocco
            const [ch, cm] = courseTimeShort.split(':').map(Number);
            const courseMinutes = ch * 60 + cm;
            const [nh, nm] = moroccoTimeStr.split(':').map(Number);
            const nowMinutes = nh * 60 + nm;
            
            // Only mark absent if at least 15 min have passed since course start (same day)
            if (c.date === moroccoDateStr && nowMinutes < courseMinutes + 15) {
              return false;
            }
          } catch (_) { /* Intl not available, rely on UTC comparison */ }
        }
        
        return true;
      });

      for (const course of toMark) {
        await prisma.course.update({
          where: { id: course.id },
          data: { absenceReason: 'professor_absent' },
        });
        console.log(`[ProfessorAbsence] Cours ${course.id} marqué "Absence du Prof" (${course.date} ${course.time})`);
      }
    } catch (err) {
      console.error('[ProfessorAbsence] Erreur:', err);
    }
  };

  run(); // exécuter immédiatement
  intervalId = setInterval(run, CHECK_INTERVAL_MS);
  console.log('[ProfessorAbsence] Vérification démarrée (toutes les minutes)');
}

export function stopProfessorAbsenceChecker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[ProfessorAbsence] Vérification arrêtée');
  }
}
