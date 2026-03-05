import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/axios';
import COUNTRIES from '../utils/countries';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonth = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return `${MONTH_NAMES[mo - 1]} ${y}`;
};

const CHART_COLORS = {
  new: '#22c55e',
  cancelled: '#ef4444',
  active: '#3b82f6',
  revenue: '#E75480',
  lessons: '#8b5cf6',
};

const COLORS_PIE = ['#E75480', '#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b'];

const KpiIcons = {
  students: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-primary/20 to-pink-400/10 dark:from-pink-400/25 dark:to-pink-500/10">
      <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </div>
  ),
  professors: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-500/10 dark:from-violet-400/25 dark:to-purple-500/10">
      <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    </div>
  ),
  revenue: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-yellow-500/10 dark:from-amber-400/25 dark:to-yellow-500/10">
      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  upcoming: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/10 dark:from-blue-400/25 dark:to-cyan-500/10">
      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  ),
  lessons: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-green-500/10 dark:from-emerald-400/25 dark:to-green-500/10">
      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    </div>
  ),
  unpaid: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500/20 to-rose-500/10 dark:from-red-400/25 dark:to-rose-500/10">
      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  ),
  dueSoon: (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/10 dark:from-orange-400/25 dark:to-amber-500/10">
      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
};

const tooltipStyle = () => ({
  backgroundColor: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#ffffff',
  border: '1px solid rgba(231,84,128,0.25)',
  borderRadius: '12px',
  padding: '10px 14px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
});

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [null, ...Array.from({ length: currentYear - 2022 }, (_, i) => currentYear - i)];

export default function AdminDashboardCharts() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    setLoading(true);
    const params = selectedYear ? { year: selectedYear } : {};
    api
      .get('/admin/analytics/dashboard', { params })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { kpis, subscriptionTrends, revenueByMonth, lessonsByMonth, studentsByCountry } = data;
  const chartData = subscriptionTrends.newStudentsByMonth.map((m, i) => ({
    ...m,
    monthLabel: formatMonth(m.month),
    new: subscriptionTrends.newStudentsByMonth[i]?.count ?? 0,
    cancelled: subscriptionTrends.cancellationsByMonth[i]?.count ?? 0,
    active: subscriptionTrends.activeByMonth[i]?.count ?? 0,
    revenue: revenueByMonth[i]?.total ?? 0,
    lessons: lessonsByMonth[i]?.count ?? 0,
  }));

  const pieData = studentsByCountry
    .slice(0, 5)
    .map((s) => ({
      name: COUNTRIES.find((c) => c.code === s.country)?.name || s.country || '—',
      value: s.count,
    }))
    .filter((d) => d.value > 0);

  const KpiCard = ({ label, value, icon, delay }) => (
    <div
      className="group relative bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/40 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-all duration-300 hover:shadow-[0_12px_32px_rgba(231,84,128,0.18)] dark:hover:shadow-[0_12px_32px_rgba(231,84,128,0.12)] hover:-translate-y-1 hover:border-pink-primary/30 dark:hover:border-pink-400/30 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-primary/5 to-transparent dark:from-pink-400/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-text/60 dark:text-[#f5f5f5]/60 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 tabular-nums mt-2">{value}</p>
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children }) => (
    <div className="group bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/40 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(231,84,128,0.15)] dark:hover:shadow-[0_12px_32px_rgba(231,84,128,0.1)] hover:border-pink-primary/20 dark:hover:border-pink-400/20 animate-fade-in overflow-hidden">
      <div className="mb-4 pb-3 border-b border-pink-soft/30 dark:border-white/10">
        <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{title}</h3>
        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-primary/20 to-pink-400/10 dark:from-pink-400/25 dark:to-pink-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.admin.analytics')}</h2>
            <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.admin.analyticsSub')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <KpiCard label={t('dashboard.adminStats.totalStudents')} value={kpis.totalStudents} icon={KpiIcons.students} delay={0} />
          <KpiCard label={t('dashboard.admin.totalProfessors')} value={kpis.totalProfessors} icon={KpiIcons.professors} delay={50} />
          <KpiCard label={t('dashboard.admin.totalRevenue')} value={`€${kpis.totalRevenue.toFixed(0)}`} icon={KpiIcons.revenue} delay={100} />
          <KpiCard label={t('dashboard.admin.upcomingCourses')} value={kpis.upcomingCourses ?? 0} icon={KpiIcons.upcoming} delay={125} />
          <KpiCard label={t('dashboard.admin.totalLessons')} value={kpis.totalLessons} icon={KpiIcons.lessons} delay={150} />
          <KpiCard label={t('dashboard.admin.unpaidPayments')} value={kpis.unpaidCount} icon={KpiIcons.unpaid} delay={200} />
          <KpiCard label={t('dashboard.admin.paymentsDueSoon')} value={kpis.dueSoonCount} icon={KpiIcons.dueSoon} delay={250} />
        </div>
      </div>

      {/* Subscription Trends */}
      <ChartCard
        title={t('dashboard.admin.subscriptionTrends')}
        subtitle={t('dashboard.admin.subscriptionTrendsSub')}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} animationDuration={800} animationEasing="ease-out">
            <CartesianGrid strokeDasharray="3 3" className="stroke-pink-soft/30 dark:stroke-white/10" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-text/60 dark:text-[#f5f5f5]/60"
            />
            <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} className="text-text/60 dark:text-[#f5f5f5]/60" />
            <Tooltip contentStyle={tooltipStyle()} labelStyle={{ color: 'inherit' }} formatter={(value) => [value, '']} labelFormatter={(label) => label} />
            <Legend
              wrapperStyle={{ paddingTop: '8px' }}
              formatter={(value) => (
                <span className="text-sm text-text dark:text-[#f5f5f5]">
                  {value === 'new' && t('dashboard.admin.newSubscriptions')}
                  {value === 'cancelled' && t('dashboard.admin.cancelled')}
                  {value === 'active' && t('dashboard.admin.active')}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="new"
              stroke={CHART_COLORS.new}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.new, r: 4 }}
              activeDot={{ r: 6 }}
              name="new"
            />
            <Line
              type="monotone"
              dataKey="cancelled"
              stroke={CHART_COLORS.cancelled}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.cancelled, r: 4 }}
              activeDot={{ r: 6 }}
              name="cancelled"
            />
            <Line
              type="monotone"
              dataKey="active"
              stroke={CHART_COLORS.active}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.active, r: 4 }}
              activeDot={{ r: 6 }}
              name="active"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Revenue & Lessons - year filter + 2 columns */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text/70 dark:text-[#f5f5f5]/70 font-medium">{t('dashboard.admin.filterByYear')}</span>
            <select
              value={selectedYear ?? ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="rounded-xl border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-pink-primary/40 dark:focus:ring-pink-400/40 focus:border-pink-primary dark:focus:border-pink-400 outline-none transition-all min-h-touch"
              aria-label={t('dashboard.admin.filterByYear')}
            >
              <option value="">{t('dashboard.admin.lastMonths')}</option>
              {YEAR_OPTIONS.filter(Boolean).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={t('dashboard.admin.revenueTrends')}
          subtitle={t('dashboard.admin.revenueTrendsSub')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} animationDuration={800} animationEasing="ease-out">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E75480" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#E75480" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-pink-soft/30 dark:stroke-white/10" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-text/60 dark:text-[#f5f5f5]/60"
              />
              <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} className="text-text/60 dark:text-[#f5f5f5]/60" />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`€${Number(value).toFixed(0)}`, '']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLORS.revenue}
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t('dashboard.admin.lessonsCompleted')}
          subtitle={t('dashboard.admin.lessonsCompletedSub')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} animationDuration={800} animationEasing="ease-out">
              <CartesianGrid strokeDasharray="3 3" className="stroke-pink-soft/30 dark:stroke-white/10" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: 'currentColor', fontSize: 11 }}
                className="text-text/60 dark:text-[#f5f5f5]/60"
              />
              <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} className="text-text/60 dark:text-[#f5f5f5]/60" />
              <Tooltip contentStyle={tooltipStyle()} />
              <Bar dataKey="lessons" fill={CHART_COLORS.lessons} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        </div>
      </div>

      {/* Students by Country */}
      {pieData.length > 0 && (
        <ChartCard
          title={t('dashboard.admin.studentsByCountry')}
          subtitle={t('dashboard.admin.studentsByCountrySub')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart animationDuration={800} animationEasing="ease-out">
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'currentColor', strokeOpacity: 0.5 }}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [value, t('dashboard.adminStats.totalStudents')]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
