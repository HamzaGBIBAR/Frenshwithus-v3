import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { getDialCode, getCountryName } from '../../utils/countryDialCodes';
import COUNTRIES from '../../utils/countries';

const getResidenceCountryName = (code) => COUNTRIES.find((c) => c.code === code)?.name || code || '—';

const PACK_LABELS = { decouverte: 'Découverte', individuel: 'Individuel', groups: 'Groupes', preparation: 'Préparation' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Reservations() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/reservations')
      .then((r) => setList(r.data))
      .catch(() => setError(t('dashboard.adminReservations.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const packLabel = (pack) => (pack ? (PACK_LABELS[pack] || pack) : '—');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-1">
        {t('dashboard.adminReservations.title')}
      </h1>
      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-6">
        {t('dashboard.adminReservations.subtitle')}
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.admin.loading') || 'Chargement…'}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-pink-soft/30 dark:border-white/10 bg-white/80 dark:bg-[#1a1a1a]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-pink-soft/30 dark:border-white/10">
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.date')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.firstName')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.lastName')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.email')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.phone')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.country')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.age')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.pack')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.audience')}</th>
                <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.createAccount')}</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-text/60 dark:text-[#f5f5f5]/60">
                    {t('dashboard.adminReservations.empty')}
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-pink-soft/20 dark:border-white/5 hover:bg-pink-soft/10 dark:hover:bg-white/5"
                  >
                    <td className="p-3 text-text/80 dark:text-[#f5f5f5]/80 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="p-3">{r.firstName || '—'}</td>
                    <td className="p-3">{r.lastName || '—'}</td>
                    <td className="p-3">
                      <a href={`mailto:${r.email}`} className="text-pink-primary dark:text-pink-400 hover:underline">
                        {r.email || '—'}
                      </a>
                    </td>
                    <td className="p-3">
                      {r.phoneCountry && r.phoneNumber
                        ? `${getDialCode(r.phoneCountry)} ${r.phoneNumber}`
                        : '—'}
                      {r.phoneCountry && !getCountryName(r.phoneCountry).startsWith(r.phoneCountry) && (
                        <span className="text-text/50 dark:text-[#f5f5f5]/50 ml-1" title={getCountryName(r.phoneCountry)}>
                          ({getCountryName(r.phoneCountry)})
                        </span>
                      )}
                    </td>
                    <td className="p-3">{r.country ? getResidenceCountryName(r.country) : '—'}</td>
                    <td className="p-3">{r.age ?? '—'}</td>
                    <td className="p-3">{packLabel(r.pack)}</td>
                    <td className="p-3">{r.audience === 'adults' ? t('dashboard.adminReservations.audienceAdults') : r.audience === 'children' ? t('dashboard.adminReservations.audienceChildren') : '—'}</td>
                    <td className="p-3">
                      <Link
                        to={`/admin/students?createFrom=${encodeURIComponent(r.email || '')}&name=${encodeURIComponent([r.firstName, r.lastName].filter(Boolean).join(' '))}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 text-xs font-medium hover:bg-pink-primary/30 dark:hover:bg-pink-400/30"
                      >
                        {t('dashboard.adminReservations.createAccount')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
