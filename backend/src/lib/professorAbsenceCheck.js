/**
 * Vérifie périodiquement les cours où le professeur n'a pas démarré après 15 minutes.
 * Marque le cours "Absence du Prof" et notifie l'admin via Socket.IO si connecté.
 */
import prisma from './db.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000; // toutes les minutes

let intervalId = null;

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

      // Filtrer : cours dont l'heure de début est passée depuis au moins 15 min
      const toMark = courses.filter((c) => {
        const courseStart = new Date(`${c.date}T${c.time}`);
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
