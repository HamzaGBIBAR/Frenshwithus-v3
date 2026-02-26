import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [revenue, setRevenue] = useState(0);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/admin/revenue').then((r) => setRevenue(r.data.total));
    api.get('/admin/courses').then((r) => setCourses(r.data));
  }, []);

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.admin.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft card-hover transition-colors duration-500">
          <h2 className="text-text/60 dark:text-[#f5f5f5]/60 text-sm font-medium">{t('dashboard.admin.totalRevenue')}</h2>
          <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">${revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft card-hover transition-colors duration-500">
          <h2 className="text-text/60 dark:text-[#f5f5f5]/60 text-sm font-medium">{t('dashboard.admin.upcomingCourses')}</h2>
          <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{upcoming.length}</p>
        </div>
      </div>
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
                  <td className="p-3 text-text dark:text-[#f5f5f5]">{c.time}</td>
                  <td className="p-3">{c.isStarted ? <span className="text-green-600 dark:text-green-400">{t('dashboard.admin.yes')}</span> : <span className="text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.admin.no')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
