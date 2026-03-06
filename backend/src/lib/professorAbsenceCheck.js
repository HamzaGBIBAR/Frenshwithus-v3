/**
 * Vérifie périodiquement les cours où le professeur n'a pas démarré après 15 minutes.
 * Marque le cours "Absence du Prof" et notifie l'admin via Socket.IO si connecté.
 * Course start is taken from startUtc (UTC) when set, else from date+time as Morocco.
 */
import prisma from './db.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000; // toutes les minutes

let intervalId = null;

/** Get course start as Date (UTC). Uses startUtc when set, else parses date+time as Morocco. */
function getCourseStart(course) {
  if (course.startUtc) return new Date(course.startUtc);
  const timePart = !course.time || course.time.length <= 5 ? `${course.time || '00:00'}:00` : course.time;
  return new Date(`${course.date}T${timePart}+01:00`);
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
      const toMark = courses.filter((c) => {
        const courseStart = getCourseStart(c);
        if (isNaN(courseStart.getTime())) return false;
        return courseStart.getTime() <= cutoff.getTime();
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
