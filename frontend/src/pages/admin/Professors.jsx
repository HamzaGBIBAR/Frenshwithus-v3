import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import ProfessorProfileModal from '../../components/ProfessorProfileModal';
import COUNTRIES, { TIMEZONE_OPTIONS } from '../../utils/countries';

export default function Professors() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', country: '', timezone: '' });
  const [error, setError] = useState('');
  const [viewingProfile, setViewingProfile] = useState(null);

  const load = () => api.get('/admin/professors').then((r) => setList(r.data));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/professors', {
        name: form.name,
        email: form.email,
        password: form.password,
        age: form.age ? parseInt(form.age, 10) : undefined,
        country: form.country || undefined,
        timezone: form.timezone || undefined,
      });
      setForm({ name: '', email: '', password: '', age: '', country: '', timezone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminStudents.errorDefault'));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/admin/professors/${editing.id}`, { ...form, age: form.age ? parseInt(form.age, 10) : null });
      setEditing(null);
      setForm({ name: '', email: '', password: '', age: '', country: '', timezone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminStudents.errorDefault'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('dashboard.adminProfessors.deleteConfirm'))) return;
    await api.delete(`/admin/professors/${id}`);
    load();
  };

  const startEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      email: p.email,
      password: '',
      age: p.age != null ? String(p.age) : '',
      country: p.country || '',
      timezone: p.timezone || '',
    });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.adminProfessors.title')}</h1>

      <form
        onSubmit={editing ? handleUpdate : handleCreate}
        className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft mb-6 transition-colors duration-500"
      >
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">
          {editing ? t('dashboard.adminProfessors.editProfessor') : t('dashboard.adminProfessors.createProfessor')}
        </h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-4">
          <input
            placeholder={t('dashboard.adminStudents.name')}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            required
          />
          <input
            type="email"
            placeholder={t('dashboard.adminStudents.email')}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            required
          />
          <input
            type="password"
            placeholder={editing ? t('dashboard.adminStudents.passwordPlaceholder') : t('dashboard.adminStudents.password')}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            required={!editing}
          />
          <input
            type="number"
            min={1}
            max={120}
            placeholder={t('dashboard.adminReservations.age')}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('dashboard.adminStudents.country')}</label>
            <select
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            >
              <option value="">—</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('dashboard.adminStudents.timezone')}</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            >
              <option value="">—</option>
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow">
            {editing ? t('dashboard.adminStudents.update') : t('dashboard.adminStudents.create')}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '' }); }}
              className="px-5 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl hover:bg-pink-soft/40 dark:hover:bg-white/10 transition text-text dark:text-[#f5f5f5]"
            >
              {t('dashboard.adminStudents.cancel')}
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft overflow-hidden transition-colors duration-500 responsive-table-wrap">
        <table className="w-full text-sm min-w-[280px]">
          <thead>
            <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.name')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.email')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminReservations.age')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.timezone')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5] w-24">{t('dashboard.adminStudents.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                <td className="p-3 text-text dark:text-[#f5f5f5]">{p.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{p.email}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{p.age != null ? p.age : '—'}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5] text-xs">{p.timezone || (p.country ? COUNTRIES.find((c) => c.code === p.country)?.tz : '—') || '—'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-pink-primary dark:text-pink-300 hover:underline font-medium">{t('dashboard.adminStudents.edit')}</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 dark:text-red-300 hover:underline">{t('dashboard.adminStudents.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewingProfile && <ProfessorProfileModal professorId={viewingProfile} onClose={() => setViewingProfile(null)} />}
    </div>
  );
}
