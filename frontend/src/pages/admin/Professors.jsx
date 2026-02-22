import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Professors() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/admin/professors').then((r) => setList(r.data));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/professors', form);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/admin/professors/${editing.id}`, form);
      setEditing(null);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this professor?')) return;
    await api.delete(`/admin/professors/${id}`);
    load();
  };

  const startEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, email: p.email, password: '' });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">Professors</h1>

      <form
        onSubmit={editing ? handleUpdate : handleCreate}
        className="bg-white p-6 rounded-2xl border border-pink-soft/50 shadow-pink-soft mb-6"
      >
        <h2 className="font-medium text-text mb-4">
          {editing ? 'Edit Professor' : 'Create Professor'}
        </h2>
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
        <div className="mt-4 flex gap-2">
          <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
            {editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '' }); }}
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
              <th className="p-3 font-medium text-text w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-pink-soft/30 hover:bg-pink-soft/20 transition">
                <td className="p-3 text-text">{p.name}</td>
                <td className="p-3 text-text">{p.email}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-pink-primary hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
