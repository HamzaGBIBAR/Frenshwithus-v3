import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

export default function AdminMessages() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all'); // all, professor-student

  useEffect(() => {
    api.get('/admin/messages').then((r) => setMessages(r.data));
  }, []);

  const filtered = messages.filter((m) => {
    if (filter === 'all') return true;
    const isProf = m.sender?.role === 'PROFESSOR' || m.receiver?.role === 'PROFESSOR';
    const isStudent = m.sender?.role === 'STUDENT' || m.receiver?.role === 'STUDENT';
    return isProf && isStudent;
  });

  const sorted = [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">
        {t('dashboard.adminMessages.title')}
      </h1>
      <p className="text-text/70 dark:text-[#f5f5f5]/70 text-sm mb-6">
        {t('dashboard.adminMessages.subtitle')}
      </p>

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-transparent text-text dark:text-[#f5f5f5]"
        >
          <option value="all">{t('dashboard.adminMessages.all')}</option>
          <option value="professor-student">{t('dashboard.adminMessages.professorStudent')}</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft overflow-hidden transition-colors duration-500">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="sticky top-0 bg-pink-soft/30 dark:bg-white/5 z-10">
              <tr className="text-left">
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminMessages.from')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminMessages.to')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminMessages.message')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                  <td className="p-3 text-text dark:text-[#f5f5f5]">
                    <span className="font-medium">{m.sender?.name}</span>
                    <span className="ml-1 text-xs text-text/50 dark:text-[#f5f5f5]/50">
                      ({m.sender?.role?.toLowerCase()})
                    </span>
                  </td>
                  <td className="p-3 text-text dark:text-[#f5f5f5]">
                    <span className="font-medium">{m.receiver?.name}</span>
                    <span className="ml-1 text-xs text-text/50 dark:text-[#f5f5f5]/50">
                      ({m.receiver?.role?.toLowerCase()})
                    </span>
                  </td>
                  <td className="p-3 text-text dark:text-[#f5f5f5] max-w-xs truncate">
                    {m.content}
                  </td>
                  <td className="p-3 text-text/70 dark:text-[#f5f5f5]/70 text-xs">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="p-8 text-center text-text/50 dark:text-[#f5f5f5]/50">
            {t('dashboard.adminMessages.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
