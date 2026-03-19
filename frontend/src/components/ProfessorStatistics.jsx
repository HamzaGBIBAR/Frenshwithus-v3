import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/axios';

const CHART_HEIGHT = 220;
const isDark = () => document.documentElement.classList.contains('dark');
const tooltipStyle = () => ({
  backgroundColor: isDark() ? '#1a1a1a' : '#ffffff',
  border: '1px solid rgba(231,84,128,0.25)',
  borderRadius: '12px',
  padding: '10px 14px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  color: isDark() ? '#f5f5f5' : '#1a1a1a',
});
const axisStyle = () => ({
  tick: { fill: isDark() ? 'rgba(245,245,245,0.7)' : 'rgba(26,26,26,0.8)', fontSize: 10 },
  axisLine: { stroke: isDark() ? 'rgba(245,245,245,0.3)' : 'rgba(26,26,26,0.2)' },
  tickLine: { stroke: isDark() ? 'rgba(245,245,245,0.2)' : 'rgba(26,26,26,0.15)' },
});
const gridStroke = () => (isDark() ? 'rgba(245,245,245,0.15)' : 'rgba(231,84,128,0.15)');

const StatCard = ({ label, value, icon, colorClass, delay = 0 }) => (
  <div
    className="group relative bg-white dark:bg-[#221a1e] p-5 rounded-2xl border border-pink-soft/40 dark:border-pink-500/25 shadow-pink-soft dark:shadow-lg overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(231,84,128,0.18)] dark:hover:shadow-[0_12px_32px_rgba(231,84,128,0.15)] hover:-translate-y-1 hover:border-pink-primary/40 dark:hover:border-pink-400/40 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-primary/5 to-transparent dark:from-pink-400/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-text/60 dark:text-[#f5f5f5]/60 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold tabular-nums mt-2 ${colorClass}`}>{value}</p>
      </div>
      <div className="shrink-0">{icon}</div>
    </div>
  </div>
);

export default function ProfessorStatistics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get('/admin/analytics/teachers')
      .then((r) => setData(r.data))
      .catch((err) => setError(err?.response?.data?.error || err?.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-red-700 dark:text-red-300 font-medium">{t('dashboard.admin.loadError', 'Erreur de chargement')}</p>
        <p className="text-sm text-red-600 dark:text-red-400/90 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary = {}, topByLessons = [], topByUpcoming = [], needsAttention = [] } = data;
  const s = summary;
  const pieData = [
    { name: t('dashboard.admin.teachersWithAvailability'), value: s.withAvailability ?? 0, fill: '#3b82f6' },
    { name: t('dashboard.admin.teachersWithoutAvailability'), value: s.withoutAvailability ?? 0, fill: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 dark:from-violet-400/25 dark:to-purple-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professorStatsTitle', 'Statistiques professeurs')}</h2>
          <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.admin.professorStatsSub', 'Vue d\'ensemble et indicateurs clés pour la gestion des enseignants')}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label={t('dashboard.admin.teachersTotal')}
          value={s.total ?? 0}
          icon={
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-500/10 dark:from-violet-400/25 dark:to-purple-500/10">
              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          }
          colorClass="text-violet-600 dark:text-violet-400"
          delay={0}
        />
        <StatCard
          label={t('dashboard.admin.teachersAbsent')}
          value={s.absent ?? 0}
          icon={
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/10 dark:from-orange-400/25 dark:to-amber-500/10">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          colorClass="text-orange-600 dark:text-orange-400"
          delay={50}
        />
        <StatCard
          label={t('dashboard.admin.teachersActiveWeek')}
          value={s.activeThisWeek ?? 0}
          icon={
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-green-500/10 dark:from-emerald-400/25 dark:to-green-500/10">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          colorClass="text-emerald-600 dark:text-emerald-400"
          delay={100}
        />
        <StatCard
          label={t('dashboard.admin.teachersWithAvailability')}
          value={s.withAvailability ?? 0}
          icon={
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/10 dark:from-blue-400/25 dark:to-cyan-500/10">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          }
          colorClass="text-blue-600 dark:text-blue-400"
          delay={125}
        />
        <StatCard
          label={t('dashboard.admin.teachersWithoutAvailability')}
          value={s.withoutAvailability ?? 0}
          icon={
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-yellow-500/10 dark:from-amber-400/25 dark:to-yellow-500/10">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          }
          colorClass="text-amber-600 dark:text-amber-400"
          delay={150}
        />
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart: Top by completed lessons */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/40 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.admin.topByLessons', 'Top par cours terminés')}</h3>
            <Link to="/admin/professors" className="text-sm text-pink-primary dark:text-pink-400 hover:underline font-medium">
              {t('dashboard.admin.viewAll')}
            </Link>
          </div>
          {topByLessons.length === 0 ? (
            <p className="text-sm text-text/50 dark:text-[#f5f5f5]/50 py-8 text-center">{t('dashboard.admin.noDataYet', 'Pas encore de données')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
              <BarChart data={topByLessons.map((p) => ({ name: p.name.split(' ')[0], value: p.completedLessons, fullName: p.name }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke()} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle().tick} axisLine={axisStyle().axisLine} tickLine={axisStyle().tickLine} />
                <YAxis tick={axisStyle().tick} axisLine={axisStyle().axisLine} tickLine={axisStyle().tickLine} allowDecimals={false} domain={[0, (max) => Math.max(max || 0, 1)]} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(v, n, p) => [v, p?.payload?.fullName || '']} />
                <Bar dataKey="value" fill="#E75480" radius={[4, 4, 0, 0]} name={t('dashboard.admin.lessons', 'cours')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart: Top by upcoming courses */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/40 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.admin.topByUpcoming', 'Charge à venir')}</h3>
            <Link to="/admin/courses" className="text-sm text-pink-primary dark:text-pink-400 hover:underline font-medium">
              {t('dashboard.admin.viewAll')}
            </Link>
          </div>
          {topByUpcoming.length === 0 ? (
            <p className="text-sm text-text/50 dark:text-[#f5f5f5]/50 py-8 text-center">{t('dashboard.admin.noDataYet', 'Pas encore de données')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
              <BarChart data={topByUpcoming.map((p) => ({ name: p.name.split(' ')[0], value: p.upcomingCount, fullName: p.name }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke()} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle().tick} axisLine={axisStyle().axisLine} tickLine={axisStyle().tickLine} />
                <YAxis tick={axisStyle().tick} axisLine={axisStyle().axisLine} tickLine={axisStyle().tickLine} allowDecimals={false} domain={[0, (max) => Math.max(max || 0, 1)]} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(v, n, p) => [v, p?.payload?.fullName || '']} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={t('dashboard.admin.upcoming', 'à venir')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: Availability distribution */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/40 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-5">
          <h3 className="font-semibold text-text dark:text-[#f5f5f5] mb-4">{t('dashboard.admin.availabilityDist', 'Répartition disponibilités')}</h3>
          {(s.withAvailability ?? 0) + (s.withoutAvailability ?? 0) === 0 ? (
            <p className="text-sm text-text/50 dark:text-[#f5f5f5]/50 py-8 text-center">{t('dashboard.admin.noDataYet', 'Pas encore de données')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeOpacity: 0.5 }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(v) => [v, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-500/40 p-5">
          <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {t('dashboard.admin.needsAttention', 'À surveiller')}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400/90 mb-4">{t('dashboard.admin.needsAttentionDesc', 'Professeurs sans créneaux ou ayant eu des absences')}</p>
          <div className="flex flex-wrap gap-2">
            {needsAttention.map((p) => (
              <Link
                key={p.id}
                to="/admin/professors"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-500/30 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 transition text-sm font-medium"
              >
                {p.name}
                {!p.hasAvailability && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/60">{t('dashboard.admin.noSlots', 'Sans créneaux')}</span>}
                {p.absentCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-200/60 dark:bg-orange-800/60">{t('dashboard.admin.absentCount', 'Absent')} ({p.absentCount})</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
