import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminAvailability() {
  const { t } = useTranslation();
  const days = t('calendar.days', { returnObjects: true });
  const dayLabels = Array.isArray(days) ? days : DAYS;
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });

  const load = () => {
    api.get('/admin/students/availability').then((r) => setStudents(r.data));
    api.get('/admin/professors/availability').then((r) => setProfessors(r.data)).catch(() => setProfessors([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    await api.post(`/admin/students/${selectedStudent}/availability`, form);
    setForm({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
    load();
  };

  const handleDeleteSlot = async (studentId, slotId) => {
    await api.delete(`/admin/students/${studentId}/availability/${slotId}`);
    load();
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent) || null;
  const formatSlot = (slot) => {
    const day = dayLabels[slot.dayOfWeek - 1] || '-';
    return `${day} ${slot.startTime}-${slot.endTime}`;
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">
        {t('dashboard.adminAvailability.title')}
      </h1>
      <p className="text-text/70 dark:text-[#f5f5f5]/70 text-sm mb-6">
        {t('dashboard.adminAvailability.subtitle')}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student availability */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-all duration-500 hover:shadow-pink-soft/80 dark:hover:shadow-[0_8px_30px_rgba(244,114,182,0.08)]">
          <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
            <h2 className="font-semibold text-text dark:text-[#f5f5f5] flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-pink-primary dark:bg-pink-400" />
              {t('dashboard.adminAvailability.studentAvailability')}
            </h2>
          </div>
          <div className="p-4 border-b border-pink-soft/50 dark:border-white/10">
            <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-2">
              {t('dashboard.admin.student')}
            </label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
            >
              <option value="">{t('dashboard.adminAvailability.selectStudent')}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {selectedStudent && (
            <div className="p-4 space-y-4">
              <form onSubmit={handleAddSlot} className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminAvailability.day')}</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: +e.target.value }))}
                    className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  >
                    {dayLabels.map((d, i) => (
                      <option key={i} value={i + 1}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminAvailability.from')}</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminAvailability.to')}</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow text-sm font-medium"
                >
                  {t('dashboard.adminAvailability.add')}
                </button>
              </form>
              <div className="space-y-2">
                <span className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                  {t('dashboard.adminAvailability.currentSlots')}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(selectedStudentData?.studentAvailability || []).map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-400/30 transition-transform duration-200 hover:scale-105 animate-fade-in"
                    >
                      {formatSlot(slot)}
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(selectedStudent, slot.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(!selectedStudentData?.studentAvailability?.length) && (
                    <span className="text-sm text-text/60 dark:text-[#f5f5f5]/80">
                      {t('dashboard.adminAvailability.noSlots')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Professor availability (announcement / view) */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-all duration-500 hover:shadow-pink-soft/80 dark:hover:shadow-[0_8px_30px_rgba(244,114,182,0.08)]">
          <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
            <h2 className="font-semibold text-text dark:text-[#f5f5f5] flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-pink-primary dark:bg-pink-400" />
              {t('dashboard.adminAvailability.professorAvailability')}
            </h2>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto space-y-4 scrollbar-hide">
            {professors.map((p) => (
              <div
                key={p.id}
                className="group p-4 rounded-xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/30 dark:border-white/10 hover:border-pink-soft/60 dark:hover:border-pink-400/20 transition-all duration-300 animate-fade-in"
              >
                <div className="font-semibold text-text dark:text-[#f5f5f5] mb-3 flex items-center gap-2">
                  <span className="text-pink-primary dark:text-pink-400">{p.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(p.availability || []).map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-soft/60 dark:bg-pink-500/20 text-pink-dark dark:text-pink-300 border border-pink-soft/50 dark:border-pink-400/30 transition-transform duration-200 hover:scale-105 animate-fade-in"
                    >
                      {formatSlot(slot)}
                    </span>
                  ))}
                  {(!p.availability?.length) && (
                    <span className="text-xs text-text/50 dark:text-[#f5f5f5]/60 italic">
                      {t('dashboard.adminAvailability.noSlots')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
