import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const formatNextDue = (dateStr, t) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span className="text-red-600 dark:text-red-400 font-medium">{t('dashboard.adminPayments.overdue')}</span>;
  if (diff === 0) return <span className="text-amber-600 dark:text-amber-400 font-medium">{t('dashboard.adminPayments.dueToday')}</span>;
  if (diff <= 7) return <span className="text-amber-600 dark:text-amber-400">{t('dashboard.adminPayments.dueIn', { days: diff })}</span>;
  return d.toLocaleDateString();
};

export default function Payments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [form, setForm] = useState({ studentId: '', amount: 0 });

  const load = () => {
    api.get('/admin/payments').then((r) => setPayments(r.data));
    api.get('/admin/students').then((r) => setStudents(r.data));
    api.get('/admin/payments/due-soon').then((r) => setDueSoon(r.data)).catch(() => setDueSoon([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/admin/payments', { ...form, status: 'unpaid' });
    setForm({ studentId: '', amount: 0 });
    load();
  };

  const toggleStatus = async (id, current) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';
    await api.put(`/admin/payments/${id}/status`, { status: next });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('dashboard.adminPayments.deleteConfirm'))) return;
    await api.delete(`/admin/payments/${id}`);
    load();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.adminPayments.title')}</h1>

      {dueSoon.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 animate-fade-in shadow-sm">
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {t('dashboard.adminPayments.dueSoon')} ({dueSoon.length})
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/90 mt-0.5">{t('dashboard.adminPayments.dueSoonDesc')}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {dueSoon.slice(0, 5).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-500/30 animate-fade-in"
              >
                {p.student?.name} — {new Date(p.nextPaymentDue).toLocaleDateString()}
              </span>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg mb-6 flex flex-wrap gap-4 items-end transition-all duration-500 hover:shadow-pink-soft/80"
      >
        <div>
          <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('dashboard.adminPayments.student')}</label>
          <select
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            required
          >
            <option value="">{t('dashboard.adminCourses.select')}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('dashboard.adminPayments.amount')} ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount || ''}
            onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl w-24 focus:ring-2 focus:ring-pink-primary"
            required
          />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow">
          {t('dashboard.adminPayments.addPayment')}
        </button>
      </form>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-all duration-500 responsive-table-wrap hover:shadow-pink-soft/80">
        <table className="w-full text-sm min-w-[320px]">
          <thead>
            <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminPayments.student')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminPayments.amount')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminPayments.status')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminPayments.nextDue')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5] w-24">{t('dashboard.adminStudents.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                <td className="p-3 text-text dark:text-[#f5f5f5]">{p.student?.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">${p.amount.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'}`}>
                    {p.status === 'paid' ? t('dashboard.adminPayments.paid') : t('dashboard.adminPayments.unpaid')}
                  </span>
                </td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{new Date(p.date).toLocaleDateString()}</td>
                <td className="p-3">{formatNextDue(p.nextPaymentDue, t)}</td>
                <td className="p-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleStatus(p.id, p.status)}
                    className="text-pink-primary dark:text-pink-300 hover:underline font-medium"
                  >
                    {p.status === 'paid' ? t('dashboard.adminPayments.markUnpaid') : t('dashboard.adminPayments.markPaid')}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 dark:text-red-300 hover:underline font-medium"
                  >
                    {t('dashboard.adminStudents.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
