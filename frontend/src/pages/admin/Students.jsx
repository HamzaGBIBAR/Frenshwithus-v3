import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Students() {
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
      setError(err.response?.data?.error || 'Failed');
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
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
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
      <h1 className="text-2xl font-semibold text-text mb-6">Students</h1>

      <form
        onSubmit={editing ? handleUpdate : handleCreate}
        className="bg-white p-6 rounded-2xl border border-pink-soft/50 shadow-pink-soft mb-6"
      >
        <h2 className="font-medium text-text mb-4">{editing ? 'Edit Student' : 'Create Student'}</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
            required
          />
          <input
            type="password"
            placeholder={editing ? 'New password (leave blank to keep)' : 'Password'}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
            required={!editing}
          />
        </div>
        {editing && (
          <div className="mt-4">
            <label className="block text-sm text-text/70 mb-1">Assign to Professor</label>
            <select
              value={form.professorId}
              onChange={(e) => setForm((f) => ({ ...f, professorId: e.target.value }))}
              className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary"
            >
              <option value="">None</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
            {editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', professorId: '' }); }}
              className="px-5 py-2.5 border border-pink-soft rounded-xl hover:bg-pink-soft/40 transition text-text"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pink-soft/30 text-left">
              <th className="p-3 font-medium text-text">Name</th>
              <th className="p-3 font-medium text-text">Email</th>
              <th className="p-3 font-medium text-text">Professor</th>
              <th className="p-3 font-medium text-text w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-pink-soft/30 hover:bg-pink-soft/20 transition">
                <td className="p-3 text-text">{s.name}</td>
                <td className="p-3 text-text">{s.email}</td>
                <td className="p-3">
                  <select
                    value={s.professorId || ''}
                    onChange={(e) => assignProfessor(s.id, e.target.value || null)}
                    className="text-sm border border-pink-soft rounded-lg px-2 py-1 focus:ring-1 focus:ring-pink-primary"
                  >
                    <option value="">None</option>
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-pink-primary hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
