import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const inputBase =
  'px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary dark:focus:ring-pink-400 dark:focus:border-pink-400 bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] transition-all duration-200';

export default function AdminMessages() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [nameSearch, setNameSearch] = useState('');
  const [dateFilterType, setDateFilterType] = useState('none');
  const [dateDay, setDateDay] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateYear, setDateYear] = useState('');
  const [dateHour, setDateHour] = useState('');

  useEffect(() => {
    setError(null);
    setLoading(true);
    api
      .get('/admin/messages')
      .then((r) => setMessages(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setError('dashboard.adminMessages.loadError'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (messages || []).filter((m) => {
    if (!m) return false;
    if (filter !== 'all') {
      const isProf = m.sender?.role === 'PROFESSOR' || m.receiver?.role === 'PROFESSOR';
      const isStudent = m.sender?.role === 'STUDENT' || m.receiver?.role === 'STUDENT';
      if (!(isProf && isStudent)) return false;
    }
    const q = (nameSearch || '').trim().toLowerCase();
    if (q) {
      const senderName = String(m.sender?.name ?? '').trim().toLowerCase();
      if (!senderName.includes(q)) return false;
    }
    if (dateFilterType !== 'none' && m.createdAt) {
      const d = new Date(m.createdAt);
      if (Number.isNaN(d.getTime())) return true;
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = d.getHours();
      if (dateFilterType === 'year' && dateYear) {
        if (String(y) !== String(dateYear).trim()) return false;
      } else if (dateFilterType === 'month' && dateMonth) {
        if (`${y}-${mo}` !== dateMonth) return false;
      } else if (dateFilterType === 'day' && dateDay) {
        if (`${y}-${mo}-${day}` !== dateDay) return false;
      } else if (dateFilterType === 'hour' && dateDay && dateHour !== '') {
        const targetH = parseInt(dateHour, 10);
        if (Number.isNaN(targetH) || targetH < 0 || targetH > 23) return true;
        if (`${y}-${mo}-${day}` !== dateDay || h !== targetH) return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-2">
        {t('dashboard.adminMessages.title')}
      </h1>
      <p className="text-text/70 dark:text-[#f5f5f5]/90 text-sm mb-6">
        {t('dashboard.adminMessages.subtitle')}
      </p>

      {/* Filter card – animated, professional */}
      <div className="mb-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 bg-white/80 dark:bg-[#1a1a1a]/90 shadow-pink-soft dark:shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden">
        <div className="px-4 py-3 border-b border-pink-soft/30 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
          <h2 className="text-sm font-semibold text-text dark:text-[#f5f5f5] flex items-center gap-2">
            <svg className="w-4 h-4 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('dashboard.adminMessages.filtersTitle')}
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-text/60 dark:text-[#f5f5f5]/60 uppercase tracking-wide">
              {t('dashboard.adminMessages.filterBySender')}
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={inputBase}
              aria-label={t('dashboard.adminMessages.all')}
            >
              <option value="all">{t('dashboard.adminMessages.all')}</option>
              <option value="professor-student">{t('dashboard.adminMessages.professorStudent')}</option>
            </select>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder={t('dashboard.adminMessages.filterByName')}
              className={`${inputBase} min-w-[180px] placeholder:text-text/50 dark:placeholder:text-[#f5f5f5]/60`}
              aria-label={t('dashboard.adminMessages.filterByName')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-pink-soft/30 dark:border-white/10">
            <label className="text-xs font-medium text-text/60 dark:text-[#f5f5f5]/60 uppercase tracking-wide">
              {t('dashboard.adminMessages.filterByDate')}
            </label>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className={inputBase}
              aria-label={t('dashboard.adminMessages.filterByDate')}
            >
              <option value="none">{t('dashboard.adminMessages.dateFilterNone')}</option>
              <option value="year">{t('dashboard.adminMessages.dateFilterYear')}</option>
              <option value="month">{t('dashboard.adminMessages.dateFilterMonth')}</option>
              <option value="day">{t('dashboard.adminMessages.dateFilterDay')}</option>
              <option value="hour">{t('dashboard.adminMessages.dateFilterHour')}</option>
            </select>
            {dateFilterType === 'year' && (
              <div className="animate-fade-in">
                <input
                  type="number"
                  min={2020}
                  max={2030}
                  value={dateYear}
                  onChange={(e) => setDateYear(e.target.value)}
                  placeholder={t('dashboard.adminMessages.yearPlaceholder')}
                  className={`${inputBase} w-24`}
                  aria-label={t('dashboard.adminMessages.yearPlaceholder')}
                />
              </div>
            )}
            {dateFilterType === 'month' && (
              <div className="animate-fade-in">
                <input
                  type="month"
                  value={dateMonth}
                  onChange={(e) => setDateMonth(e.target.value)}
                  className={inputBase}
                  aria-label={t('dashboard.adminMessages.dateFilterMonth')}
                />
              </div>
            )}
            {dateFilterType === 'day' && (
              <div className="animate-fade-in">
                <input
                  type="date"
                  value={dateDay}
                  onChange={(e) => setDateDay(e.target.value)}
                  className={inputBase}
                  aria-label={t('dashboard.adminMessages.dateFilterDay')}
                />
              </div>
            )}
            {dateFilterType === 'hour' && (
              <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                <input
                  type="date"
                  value={dateDay}
                  onChange={(e) => setDateDay(e.target.value)}
                  className={inputBase}
                  aria-label={t('dashboard.adminMessages.dateFilterDay')}
                />
                <select
                  value={dateHour}
                  onChange={(e) => setDateHour(e.target.value)}
                  className={inputBase}
                  aria-label={t('dashboard.adminMessages.hourPlaceholder')}
                >
                  <option value="">{t('dashboard.adminMessages.hourPlaceholder')}</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
          {t(error)}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
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
              {sorted.map((m, idx) => (
                <tr key={m?.id ?? `msg-${idx}`} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
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
                  <td className="p-3 text-text dark:text-[#f5f5f5] max-w-xs">
                    {m?.content?.trim() ? (
                      <span className="block truncate" title={m.content}>{m.content.trim()}</span>
                    ) : null}
                    {m?.attachmentUrl ? (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 mt-0.5 text-pink-600 dark:text-pink-400 hover:underline truncate max-w-full"
                        title={m.attachmentName || t('dashboard.adminMessages.attachmentLabel')}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {m.attachmentName?.trim() || t('dashboard.adminMessages.attachmentLabel')}
                      </a>
                    ) : null}
                    {!m?.content?.trim() && !m?.attachmentUrl && '—'}
                  </td>
                  <td className="p-3 text-text/70 dark:text-[#f5f5f5]/70 text-xs">
                    {m?.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="p-8 text-center text-text/60 dark:text-[#f5f5f5]/80">
            {t('dashboard.adminMessages.empty')}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
