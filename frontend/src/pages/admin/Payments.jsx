import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: '', amount: 0 });

  const load = () => {
    api.get('/admin/payments').then((r) => setPayments(r.data));
    api.get('/admin/students').then((r) => setStudents(r.data));
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

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">Payments</h1>

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-2xl border border-pink-soft/50 shadow-pink-soft mb-6 flex flex-wrap gap-4 items-end"
      >
        <div>
          <label className="block text-sm text-text/70 mb-1">Student</label>
          <select
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary"
            required
          >
            <option value="">Select</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-text/70 mb-1">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount || ''}
            onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl w-24 focus:ring-2 focus:ring-pink-primary"
            required
          />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
          Add Payment
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pink-soft/30 text-left">
              <th className="p-3 font-medium text-text">Student</th>
              <th className="p-3 font-medium text-text">Amount</th>
              <th className="p-3 font-medium text-text">Status</th>
              <th className="p-3 font-medium text-text">Date</th>
              <th className="p-3 font-medium text-text w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-pink-soft/30 hover:bg-pink-soft/20 transition">
                <td className="p-3 text-text">{p.student?.name}</td>
                <td className="p-3 text-text">${p.amount.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 text-text">{new Date(p.date).toLocaleDateString()}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleStatus(p.id, p.status)}
                    className="text-pink-primary hover:underline font-medium"
                  >
                    Mark {p.status === 'paid' ? 'unpaid' : 'paid'}
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
