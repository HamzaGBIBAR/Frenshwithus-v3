import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

export default function Students() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', professorId: '' });
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/students').then((r) => setStudents(r.data));
    api.get('/admin/professors').then((r) => setProfessors(r.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/students', { name: form.name, email: form.email, password: form.password });
      setForm({ name: '', email: '', password: '', professorId: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminStudents.errorDefault'));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/admin/students/${editing.id}`, form);
      setEditing(null);
      setForm({ name: '', email: '', password: '', professorId: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminStudents.errorDefault'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('dashboard.adminStudents.deleteConfirm'))) return;
    await api.delete(`/admin/students/${id}`);
    load();
  };

  const assignProfessor = async (studentId, professorId) => {
    await api.put(`/admin/students/${studentId}/assign`, { professorId: professorId || null });
    load();
  };

  const startEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, password: '', professorId: s.professorId || '' });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.adminStudents.title')}</h1>

      <form
        onSubmit={editing ? handleUpdate : handleCreate}
        className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft mb-6 transition-colors duration-500"
      >
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">{editing ? t('dashboard.adminStudents.editStudent') : t('dashboard.adminStudents.createStudent')}</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            placeholder={t('dashboard.adminStudents.name')}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
            required
          />
          <input
            type="email"
            placeholder={t('dashboard.adminStudents.email')}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
            required
          />
          <input
            type="password"
            placeholder={editing ? t('dashboard.adminStudents.passwordPlaceholder') : t('dashboard.adminStudents.password')}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
            required={!editing}
          />
        </div>
        {editing && (
          <div className="mt-4">
            <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('dashboard.adminStudents.assignProfessor')}</label>
            <select
              value={form.professorId}
              onChange={(e) => setForm((f) => ({ ...f, professorId: e.target.value }))}
              className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-transparent text-text dark:text-[#f5f5f5]"
            >
              <option value="">{t('dashboard.adminStudents.none')}</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow">
            {editing ? t('dashboard.adminStudents.update') : t('dashboard.adminStudents.create')}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', professorId: '' }); }}
              className="px-5 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl hover:bg-pink-soft/40 dark:hover:bg-white/10 transition text-text dark:text-[#f5f5f5]"
            >
              {t('dashboard.adminStudents.cancel')}
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft overflow-hidden transition-colors duration-500 responsive-table-wrap">
        <table className="w-full text-sm min-w-[320px]">
          <thead>
            <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.name')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.email')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professor')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5] w-32">{t('dashboard.adminStudents.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                <td className="p-3 text-text dark:text-[#f5f5f5]">{s.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{s.email}</td>
                <td className="p-3">
                  <select
                    value={s.professorId || ''}
                    onChange={(e) => assignProfessor(s.id, e.target.value || null)}
                    className="text-sm border border-pink-soft dark:border-white/20 rounded-lg px-2 py-1 focus:ring-1 focus:ring-pink-primary bg-transparent text-text dark:text-[#f5f5f5]"
                  >
                    <option value="">{t('dashboard.adminStudents.none')}</option>
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-pink-primary dark:text-pink-400 hover:underline font-medium">{t('dashboard.adminStudents.edit')}</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 dark:text-red-400 hover:underline">{t('dashboard.adminStudents.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
