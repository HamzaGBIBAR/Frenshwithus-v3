import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { formatTimeAMPM, formatDateToAMPM, shouldShowProfessorAbsent } from '../../utils/format';

export default function ProfessorDashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/professor/courses').then((r) => setCourses(r.data));
  }, []);

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.admin.title')}</h1>
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft mb-6 card-hover transition-colors duration-500">
        <h2 className="text-text/60 dark:text-[#f5f5f5]/60 text-sm font-medium">{t('dashboard.admin.upcomingCourses')}</h2>
        <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{upcoming.length}</p>
      </div>
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft overflow-hidden transition-colors duration-500">
        <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 flex justify-between items-center">
          <h2 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.professor.myCourses')}</h2>
          <Link to="/professor/courses" className="text-sm text-pink-primary dark:text-pink-400 hover:underline font-medium">
            {t('dashboard.professor.manageCourses')}
          </Link>
        </div>
        <div className="overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.student')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.time')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.started')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 10).map((c) => (
                <tr key={c.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.student?.name}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.date}</td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{formatTimeAMPM(c.time)}</td>
                  <td className="p-3">
                    {shouldShowProfessorAbsent(c) ? (
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
