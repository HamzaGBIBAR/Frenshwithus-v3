import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import COUNTRIES from '../../utils/countries';

export default function Statistics() {
  const { t } = useTranslation();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/statistics')
      .then((r) => setStats(r.data))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, []);

  const openStudentSessions = async (student) => {
    setSelectedStudent(student);
    setSessionsLoading(true);
    try {
      const r = await api.get(`/admin/students/${student.id}/sessions`);
      setSessions(r.data);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setSessions([]);
  };

  const formatMin = (min) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const getCountryName = (code) => COUNTRIES.find((c) => c.code === code)?.name || code || '—';

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-12 h-12 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-2">{t('dashboard.adminStats.title')}</h1>
      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-6">{t('dashboard.adminStats.subtitle')}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
          <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">{t('dashboard.adminStats.totalStudents')}</p>
          <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{stats.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
          <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">{t('dashboard.adminStats.totalLessonsAll')}</p>
          <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{stats.reduce((s, x) => s + x.totalLessons, 0)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
          <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">{t('dashboard.adminStats.totalTimeAll')}</p>
          <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{formatMin(stats.reduce((s, x) => s + x.totalMinutes, 0))}</p>
        </div>
      </div>

      {/* Students table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden responsive-table-wrap">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.studentName')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.country')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.totalCourses')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.attendedLessons')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.totalTime')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]"></th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                <td className="p-3 text-text dark:text-[#f5f5f5] font-medium">{s.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{getCountryName(s.country)}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{s.totalCourses}</td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    {s.totalLessons}
                  </span>
                </td>
                <td className="p-3 text-text dark:text-[#f5f5f5] font-mono text-xs">{formatMin(s.totalMinutes)}</td>
                <td className="p-3">
                  <button
                    onClick={() => openStudentSessions(s)}
                    className="text-pink-primary dark:text-pink-400 hover:underline text-sm font-medium"
                  >
                    {t('dashboard.adminStats.viewSessions')}
                  </button>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.adminStats.noStudents')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Session history modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-xl animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-pink-soft/30 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">{selectedStudent.name}</h3>
                <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                  {getCountryName(selectedStudent.country)} — {selectedStudent.totalLessons} {t('dashboard.adminStats.lessonsAttended')} — {formatMin(selectedStudent.totalMinutes)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-pink-soft/30 dark:hover:bg-white/10 transition"
              >
                <svg className="w-5 h-5 text-text dark:text-[#f5f5f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sessions table */}
            <div className="flex-1 overflow-auto p-4">
              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-text/50 dark:text-[#f5f5f5]/50 py-8">{t('dashboard.adminStats.noSessions')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-pink-soft/20 dark:bg-white/5 text-left">
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.time')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professor')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.planned')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.actual')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.courseId} className="border-t border-pink-soft/20 dark:border-white/5">
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.date}</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.time}</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.professor?.name || '—'}</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.durationMin} min</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5] font-mono">{s.attended ? `${s.actualMin} min` : '—'}</td>
                        <td className="p-2.5">
                          {s.attended ? (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {t('dashboard.adminStats.present')}
                            </span>
                          ) : s.endReason === 'professor_absent' ? (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              {t('dashboard.admin.endReasonProfessorAbsent')}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#f5f5f5]/60">
                              {t('dashboard.adminStats.pending')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
