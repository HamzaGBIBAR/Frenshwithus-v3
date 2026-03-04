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

const tooltipStyle = () => ({
  backgroundColor: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#ffffff',
  border: '1px solid rgba(231,84,128,0.25)',
  borderRadius: '12px',
  padding: '10px 14px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
});

export default function AdminDashboardCharts() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/analytics/dashboard')
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

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
      className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg transition-all duration-500 hover:shadow-[0_8px_24px_rgba(231,84,128,0.15)] dark:hover:shadow-[0_8px_24px_rgba(231,84,128,0.1)] hover:-translate-y-0.5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm font-medium">{label}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 tabular-nums">{value}</p>
        {icon}
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children }) => (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-5 transition-all duration-500 hover:shadow-[0_8px_24px_rgba(231,84,128,0.12)] dark:hover:shadow-[0_8px_24px_rgba(231,84,128,0.08)] animate-fade-in overflow-hidden">
      <div className="mb-4">
        <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{title}</h3>
        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold text-text dark:text-[#f5f5f5] mb-4">{t('dashboard.admin.analytics')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <KpiCard
            label={t('dashboard.adminStats.totalStudents')}
            value={kpis.totalStudents}
            icon={<span className="text-2xl">👥</span>}
            delay={0}
          />
          <KpiCard
            label={t('dashboard.admin.totalProfessors')}
            value={kpis.totalProfessors}
            icon={<span className="text-2xl">👨‍🏫</span>}
            delay={50}
          />
          <KpiCard
            label={t('dashboard.admin.totalRevenue')}
            value={`€${kpis.totalRevenue.toFixed(0)}`}
            icon={<span className="text-2xl">💰</span>}
            delay={100}
          />
          <KpiCard
            label={t('dashboard.admin.upcomingCourses')}
            value={kpis.upcomingCourses ?? 0}
            icon={<span className="text-2xl">📅</span>}
            delay={125}
          />
          <KpiCard
            label={t('dashboard.admin.totalLessons')}
            value={kpis.totalLessons}
            icon={<span className="text-2xl">📚</span>}
            delay={150}
          />
          <KpiCard
            label={t('dashboard.admin.unpaidPayments')}
            value={kpis.unpaidCount}
            icon={<span className="text-2xl">⚠️</span>}
            delay={200}
          />
          <KpiCard
            label={t('dashboard.admin.paymentsDueSoon')}
            value={kpis.dueSoonCount}
            icon={<span className="text-2xl">⏰</span>}
            delay={250}
          />
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

      {/* Revenue & Lessons - 2 columns */}
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
