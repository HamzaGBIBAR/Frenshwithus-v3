import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

export default function BlockedIps() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api
      .get('/admin/blocked-ips')
      .then((r) => setList(r.data || []))
      .catch(() => setError(t('dashboard.blockedIps.errorList')));
  };

  useEffect(() => {
    load();
  }, []);

  const unblock = async (id) => {
    if (!window.confirm(t('dashboard.blockedIps.unblockConfirm'))) return;
    setError('');
    try {
      await api.delete(`/admin/blocked-ips/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.blockedIps.errorUnblock'));
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-2">{t('dashboard.blockedIps.title')}</h1>
      <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-6">{t('dashboard.blockedIps.subtitle')}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-pink-soft/50 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-[#1a1a1a]/50">
        {list.length === 0 ? (
          <p className="p-6 text-text/70 dark:text-[#f5f5f5]/70 text-center">{t('dashboard.blockedIps.empty')}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/30 dark:bg-white/5">
                <th className="p-3 text-left font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.blockedIps.ip')}</th>
                <th className="p-3 text-left font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.blockedIps.blockedAt')}</th>
                <th className="p-3 text-right font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.blockedIps.unblock')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-b border-pink-soft/30 dark:border-white/5 last:border-0">
                  <td className="p-3 font-mono text-sm text-text dark:text-[#f5f5f5]">{row.ip}</td>
                  <td className="p-3 text-sm text-text/80 dark:text-[#f5f5f5]/80">
                    {new Date(row.blockedAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => unblock(row.id)}
                      className="px-3 py-1.5 rounded-lg bg-pink-500/20 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 text-sm font-medium hover:bg-pink-500/30 dark:hover:bg-pink-500/40 transition"
                    >
                      {t('dashboard.blockedIps.unblock')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
