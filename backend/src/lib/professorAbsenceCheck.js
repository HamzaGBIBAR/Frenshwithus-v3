/**
 * Vérifie périodiquement les cours où le professeur n'a pas démarré après 15 minutes.
 * Marque le cours "Absence du Prof" et notifie l'admin via Socket.IO si connecté.
 * Les heures des cours sont interprétées en heure Maroc (UTC+1).
 */
import prisma from './db.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000; // toutes les minutes

let intervalId = null;

/** Parse date + time as Morocco (UTC+1) to avoid marking courses before they actually start. */
function getCourseStartMorocco(dateStr, timeStr) {
  const timePart = !timeStr || timeStr.length <= 5 ? `${timeStr || '00:00'}:00` : timeStr;
  return new Date(`${dateStr}T${timePart}+01:00`);
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

      // Filtrer : cours dont l'heure de début (Maroc) est passée depuis au moins 15 min
      const toMark = courses.filter((c) => {
        const courseStart = getCourseStartMorocco(c.date, c.time);
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
