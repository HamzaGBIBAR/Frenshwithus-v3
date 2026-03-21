import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { formatTimeAMPM, formatDateToAMPM, formatProfessorName, formatStudentName, shouldShowProfessorAbsent } from '../../utils/format';
import ProfessorStatistics from '../../components/ProfessorStatistics';
import { IconTeacher, IconStudent, IconBolt, IconMatch } from '../../components/Icons';

const TIME_SLOTS_24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function slotContains(start, end, t) {
  if (!start || !end) return false;
  if (start < end) return t >= start && t < end;
  return t >= start || t < end;
}

function MiniAccountCard({ user, type }) {
  const [err, setErr] = useState(false);
  const slots = type === 'teacher' ? (user.availability || []).length : (user.studentAvailability || user.availability || []).length;
  const initial = (user?.name || '?').charAt(0).toUpperCase();
  return (
    <Link to="/admin/availability" className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all hover:scale-105 min-w-[70px] text-center ${
      type === 'teacher' ? 'border-indigo-200/60 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/8' : 'border-emerald-200/60 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/8'
    }`}>
      <div className="relative">
        {user?.avatarUrl && !err
          ? <img src={user.avatarUrl} alt={user.name} onError={() => setErr(true)} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20" />
          : <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/10 ${
              type === 'teacher' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
            }`}>{initial}</div>
        }
        {slots > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
            type === 'teacher' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'
          }`}>{slots}</span>
        )}
      </div>
      <p className={`text-[10px] font-semibold truncate max-w-[64px] ${
        type === 'teacher' ? 'text-indigo-800 dark:text-indigo-300' : 'text-emerald-800 dark:text-emerald-300'
      }`}>{user.name}</p>
    </Link>
  );
}

function AvailabilityWidget({ professors = [], students = [] }) {
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const topMatches = useMemo(() => {
    const matches = [];
    for (const d of [1,2,3,4,5,6,7]) {
      for (const t of TIME_SLOTS_24) {
        const profs = professors.filter(p => (p.availability || []).some(s => s.dayOfWeek === d && slotContains(s.startTime, s.endTime, t)));
        const studs = students.filter(s => (s.studentAvailability || s.availability || []).some(sl => sl.dayOfWeek === d && slotContains(sl.startTime, sl.endTime, t)));
        if (profs.length > 0 && studs.length > 0) {
          matches.push({ day: d, time: t, profs, studs });
          if (matches.length >= 3) break;
        }
      }
      if (matches.length >= 3) break;
    }
    return matches;
  }, [professors, students]);

  return (
    <div className="mb-6 rounded-2xl border border-amber-200/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/15 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/50 dark:border-amber-500/20">
        <div className="flex items-center gap-2">
          <IconMatch className="w-3.5 h-3.5 text-amber-500" />
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Disponibilités & Matches</h3>
          {topMatches.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
              ⚡ {topMatches.length} match{topMatches.length > 1 ? 's' : ''} cette semaine
            </span>
          )}
        </div>
        <Link to="/admin/availability" className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline">Voir tout →</Link>
      </div>
      <div className="p-4 space-y-3">
        {/* Top match slots */}
        {topMatches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topMatches.map((m, i) => (
              <Link key={i} to="/admin/availability"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200/70 dark:border-amber-500/30 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200/70 dark:hover:bg-amber-900/50 transition">
                <span>⚡</span>
                <span>{DAY_LABELS[m.day - 1]} {m.time}</span>
                <span className="text-amber-600/60 dark:text-amber-400/50">·</span>
                <span className="text-indigo-600 dark:text-indigo-400">{m.profs.length}P</span>
                <span className="text-emerald-600 dark:text-emerald-400">{m.studs.length}E</span>
              </Link>
            ))}
          </div>
        )}
        {topMatches.length === 0 && professors.length > 0 && students.length > 0 && (
          <p className="text-xs text-amber-700/70 dark:text-amber-400/60">Aucun créneau commun trouvé cette semaine — ajoutez des disponibilités.</p>
        )}
        {/* Mini rails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
              <IconTeacher className="w-3.5 h-3.5" /> Professeurs ({professors.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {professors.slice(0, 8).map(p => <MiniAccountCard key={p.id} user={p} type="teacher" />)}
              {professors.length > 8 && <Link to="/admin/availability" className="flex-shrink-0 flex items-center justify-center w-10 h-[72px] rounded-xl border border-indigo-200/60 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/8 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">+{professors.length - 8}</Link>}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
              <IconStudent className="w-3.5 h-3.5" /> Élèves ({students.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {students.slice(0, 8).map(s => <MiniAccountCard key={s.id} user={s} type="student" />)}
              {students.length > 8 && <Link to="/admin/availability" className="flex-shrink-0 flex items-center justify-center w-10 h-[72px] rounded-xl border border-emerald-200/60 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/8 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+{students.length - 8}</Link>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY_MEETING = 'adminDismissedMeetingIssues';
const STORAGE_KEY_PROF_ABSENT = 'adminDismissedProfessorAbsent';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [dismissedMeetingIssues, setDismissedMeetingIssues] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MEETING) || '[]');
    } catch {
      return [];
    }
  });
  const [dismissedProfessorAbsent, setDismissedProfessorAbsent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PROF_ABSENT) || '[]');
    } catch {
      return [];
    }
  });

  const [unifiedData, setUnifiedData] = useState({ professors: [], students: [] });

  useEffect(() => {
    api.get('/admin/courses').then((r) => setCourses(r.data));
    api.get('/admin/payments/due-soon').then((r) => setDueSoon(r.data)).catch(() => setDueSoon([]));
    api.get('/admin/unified-availability').then(r => setUnifiedData(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEETING, JSON.stringify(dismissedMeetingIssues));
  }, [dismissedMeetingIssues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROF_ABSENT, JSON.stringify(dismissedProfessorAbsent));
  }, [dismissedProfessorAbsent]);

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  const meetingIssues = courses.filter((c) => c.endReason === 'meeting_issue' && !dismissedMeetingIssues.includes(c.id));
  const professorAbsent = courses.filter((c) => shouldShowProfessorAbsent(c) && !dismissedProfessorAbsent.includes(c.id));

  const dismissMeetingIssue = (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedMeetingIssues((prev) => [...prev, courseId]);
  };

  const dismissAllMeetingIssues = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = courses.filter((c) => c.endReason === 'meeting_issue').map((c) => c.id);
    setDismissedMeetingIssues((prev) => [...new Set([...prev, ...ids])]);
  };

  const dismissProfessorAbsent = (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedProfessorAbsent((prev) => [...prev, courseId]);
  };

  const dismissAllProfessorAbsent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = courses.filter((c) => shouldShowProfessorAbsent(c)).map((c) => c.id);
    setDismissedProfessorAbsent((prev) => [...new Set([...prev, ...ids])]);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.admin.title')}</h1>

      {/* Professional Statistics (Professor-focused) */}
      <div className="mb-8">
        <ProfessorStatistics />
      </div>

      {/* Availability & Matches Widget */}
      <AvailabilityWidget professors={unifiedData.professors} students={unifiedData.students} />

      {professorAbsent.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-orange-200 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-300 animate-fade-in shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                {t('dashboard.admin.professorAbsentAlert')} ({professorAbsent.length})
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400/90 mt-0.5">{t('dashboard.admin.professorAbsentDesc')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismissAllProfessorAbsent}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-200/50 dark:hover:bg-orange-900/40 transition"
                title={t('dashboard.admin.dismissAll')}
              >
                {t('dashboard.admin.dismissAll')}
              </button>
              <Link
                to="/admin/courses"
                className="px-4 py-2 rounded-xl bg-orange-500/20 dark:bg-orange-500/30 text-orange-800 dark:text-orange-200 font-medium text-sm hover:bg-orange-500/30 transition"
              >
                {t('dashboard.admin.viewAll')}
              </Link>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {professorAbsent.slice(0, 4).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-200/60 dark:border-orange-500/30"
              >
                {formatProfessorName(c.professor?.name)} — {formatStudentName(c.student?.name, t('dashboard.admin.student'))} ({c.date} {c.time})
                <button
                  type="button"
                  onClick={(e) => dismissProfessorAbsent(e, c.id)}
                  className="ml-0.5 p-0.5 rounded hover:bg-orange-200/50 dark:hover:bg-orange-800/50 transition"
                  title={t('dashboard.admin.dismiss')}
                  aria-label={t('dashboard.admin.dismiss')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {meetingIssues.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 animate-fade-in shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {t('dashboard.admin.meetingIssuesAlert')} ({meetingIssues.length})
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400/90 mt-0.5">{t('dashboard.admin.meetingIssuesDesc')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={dismissAllMeetingIssues}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-200/50 dark:hover:bg-red-900/40 transition"
                title={t('dashboard.admin.dismissAll')}
              >
                {t('dashboard.admin.dismissAll')}
              </button>
              <Link
                to="/admin/courses"
                className="px-4 py-2 rounded-xl bg-red-500/20 dark:bg-red-500/30 text-red-800 dark:text-red-200 font-medium text-sm hover:bg-red-500/30 transition"
              >
                {t('dashboard.admin.viewAll')}
              </Link>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {meetingIssues.slice(0, 4).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200/60 dark:border-red-500/30"
              >
                {formatProfessorName(c.professor?.name)} — {formatStudentName(c.student?.name, t('dashboard.admin.student'))}
                <button
                  type="button"
                  onClick={(e) => dismissMeetingIssue(e, c.id)}
                  className="ml-0.5 p-0.5 rounded hover:bg-red-200/50 dark:hover:bg-red-800/50 transition"
                  title={t('dashboard.admin.dismiss')}
                  aria-label={t('dashboard.admin.dismiss')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <Link
          to="/admin/payments"
          className="mb-6 block p-4 rounded-2xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-300 animate-fade-in shadow-sm hover:shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {t('dashboard.adminPayments.dueSoon')} ({dueSoon.length})
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400/90 mt-0.5">{t('dashboard.adminPayments.dueSoonDesc')}</p>
            </div>
            <span className="px-4 py-2 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 font-medium text-sm">
              {t('dashboard.admin.viewAll')}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {dueSoon.slice(0, 4).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-500/30"
              >
                {p.student?.name} — {new Date(p.nextPaymentDue).toLocaleDateString()}
              </span>
            ))}
          </div>
        </Link>
      )}

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft overflow-hidden transition-colors duration-500">
        <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 flex justify-between items-center">
          <h2 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.admin.recentCourses')}</h2>
          <Link to="/admin/courses" className="text-sm text-pink-primary dark:text-pink-400 hover:underline font-medium">
            {t('dashboard.admin.viewAll')}
          </Link>
        </div>
        <div className="overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professor')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.student')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.time')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.started')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 10).map((c) => {
                const showProfessorAbsent = shouldShowProfessorAbsent(c);
                return (
                <tr key={c.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.professor?.name}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.student?.name}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.date}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{formatTimeAMPM(c.time)}</td>
                  <td className="p-3">
                    {showProfessorAbsent ? (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">{t('dashboard.admin.endReasonProfessorAbsent')}</span>
                    ) : c.sessionEnded ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        {c.sessionEndedAt
                          ? `${t('dashboard.admin.endedAt')} ${formatDateToAMPM(c.sessionEndedAt)}`
                          : t('dashboard.admin.ended')}
                        {c.endReason && (
                          <span className="block text-xs mt-0.5 opacity-90">
                            {c.endReason === 'completed' && t('dashboard.admin.endReasonCompleted')}
                            {c.endReason === 'student_absent' && t('dashboard.admin.endReasonStudentAbsent')}
                            {c.endReason === 'meeting_issue' && t('dashboard.admin.endReasonMeetingIssue')}
                          </span>
                        )}
                      </span>
                    ) : c.isStarted ? (
                      <span className="text-green-600 dark:text-green-400">{t('dashboard.admin.yes')}</span>
                    ) : (
                      <span className="text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.admin.no')}</span>
                    )}
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
