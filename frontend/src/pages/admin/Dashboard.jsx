import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { formatTimeAMPM, formatDateToAMPM, formatProfessorName, formatStudentName } from '../../utils/format';
import AdminDashboardCharts from '../../components/AdminDashboardCharts';

const STORAGE_KEY = 'adminDismissedMeetingIssues';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [dismissedMeetingIssues, setDismissedMeetingIssues] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api.get('/admin/courses').then((r) => setCourses(r.data));
    api.get('/admin/payments/due-soon').then((r) => setDueSoon(r.data)).catch(() => setDueSoon([]));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedMeetingIssues));
  }, [dismissedMeetingIssues]);

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  const meetingIssues = courses.filter((c) => c.endReason === 'meeting_issue' && !dismissedMeetingIssues.includes(c.id));
  const professorAbsent = courses.filter((c) => c.endReason === 'professor_absent');

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

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.admin.title')}</h1>

      {/* Analytics Charts */}
      <div className="mb-8">
        <AdminDashboardCharts />
      </div>

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
            <Link
              to="/admin/courses"
              className="px-4 py-2 rounded-xl bg-orange-500/20 dark:bg-orange-500/30 text-orange-800 dark:text-orange-200 font-medium text-sm hover:bg-orange-500/30 transition"
            >
              {t('dashboard.admin.viewAll')}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {professorAbsent.slice(0, 4).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-200/60 dark:border-orange-500/30"
              >
                {formatProfessorName(c.professor?.name)} — {formatStudentName(c.student?.name, t('dashboard.admin.student'))} ({c.date} {c.time})
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
              {courses.slice(0, 10).map((c) => (
                <tr key={c.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.professor?.name}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.student?.name}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.date}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{formatTimeAMPM(c.time)}</td>
                  <td className="p-3">
                    {c.endReason === 'professor_absent' ? (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
