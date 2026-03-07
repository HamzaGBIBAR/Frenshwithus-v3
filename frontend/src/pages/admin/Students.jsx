import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import COUNTRIES, { getTimezoneByCountry, TIMEZONE_OPTIONS } from '../../utils/countries';

const getCountryName = (code) => COUNTRIES.find((c) => c.code === code)?.name || code || '—';

const formatMin = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

export default function Students() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', professorId: '', country: '', timezone: '' });
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const load = () => {
    api.get('/admin/students').then((r) => setStudents(r.data));
    api.get('/admin/professors').then((r) => setProfessors(r.data));
  };

  const loadStats = () => {
    api.get('/admin/statistics')
      .then((r) => setStats(r.data))
      .catch(() => setStats([]))
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const openStudentSessions = async (student) => {
    setSelectedStudent(student);
    setSessionsLoading(true);
    try {
      const r = await api.get(`/admin/students/${student.id}/sessions`);
      setSessions(r.data);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const closeSessionsModal = () => {
    setSelectedStudent(null);
    setSessions([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/students', {
        name: form.name,
        email: form.email,
        password: form.password,
        country: form.country || undefined,
        timezone: form.timezone || undefined,
      });
      setForm({ name: '', email: '', password: '', professorId: '', country: '', timezone: '' });
      load();
      loadStats();
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
      setForm({ name: '', email: '', password: '', professorId: '', country: '', timezone: '' });
      load();
      loadStats();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminStudents.errorDefault'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('dashboard.adminStudents.deleteConfirm'))) return;
    await api.delete(`/admin/students/${id}`);
    load();
    loadStats();
  };

  const assignProfessor = async (studentId, professorId) => {
    await api.put(`/admin/students/${studentId}/assign`, { professorId: professorId || null });
    load();
    loadStats();
  };

  const startEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      password: '',
      professorId: s.professorId || '',
      country: s.country || '',
      timezone: s.timezone || (s.country ? getTimezoneByCountry(s.country) : '') || '',
    });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-2">{t('dashboard.adminStudents.title')}</h1>
      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-6">{t('dashboard.adminStats.subtitle')}</p>

      {/* Statistiques des élèves */}
      {statsLoading ? (
        <div className="flex justify-center py-8 mb-6">
          <div className="w-10 h-10 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
              <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">{t('dashboard.adminStats.totalStudents')}</p>
              <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{stats.length}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
              <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">{t('dashboard.adminStats.totalLessonsAll')}</p>
              <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{stats.reduce((s, x) => s + x.totalLessons, 0)}</p>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
              <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">{t('dashboard.adminStats.totalTimeAll')}</p>
              <p className="text-2xl font-bold text-pink-primary dark:text-pink-400 mt-1">{formatMin(stats.reduce((s, x) => s + x.totalMinutes, 0))}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden responsive-table-wrap mb-6">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
                  <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.studentName')}</th>
                  <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.country')}</th>
                  <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.totalCourses')}</th>
                  <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.attendedLessons')}</th>
                  <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.totalTime')}</th>
                  <th className="p-3 font-medium text-text dark:text-[#f5f5f5]"></th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                    <td className="p-3 text-text dark:text-[#f5f5f5] font-medium">{s.name}</td>
                    <td className="p-3 text-text dark:text-[#f5f5f5]">{getCountryName(s.country)}</td>
                    <td className="p-3 text-text dark:text-[#f5f5f5]">{s.totalCourses}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {s.totalLessons}
                      </span>
                    </td>
                    <td className="p-3 text-text dark:text-[#f5f5f5] font-mono text-xs">{formatMin(s.totalMinutes)}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openStudentSessions(s)}
                        className="text-pink-primary dark:text-pink-400 hover:underline text-sm font-medium"
                      >
                        {t('dashboard.adminStats.viewSessions')}
                      </button>
                    </td>
                  </tr>
                ))}
                {stats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.adminStats.noStudents')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <form
        onSubmit={editing ? handleUpdate : handleCreate}
        className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft mb-6 transition-colors duration-500"
      >
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">{editing ? t('dashboard.adminStudents.editStudent') : t('dashboard.adminStudents.createStudent')}</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <select
            value={form.country}
            onChange={(e) => {
              const code = e.target.value;
              setForm((f) => ({
                ...f,
                country: code,
                timezone: code ? getTimezoneByCountry(code) : f.timezone,
              }));
            }}
            className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
          >
            <option value="">{t('dashboard.adminStudents.selectCountry')}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
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
        {editing && (
          <div className="mt-4">
            <label className="block text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('dashboard.adminStudents.assignProfessor')}</label>
            <select
              value={form.professorId}
              onChange={(e) => setForm((f) => ({ ...f, professorId: e.target.value }))}
              className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
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
              onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', professorId: '', country: '', timezone: '' }); }}
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
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.country')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStudents.timezone')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professor')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5] w-32">{t('dashboard.adminStudents.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                <td className="p-3 text-text dark:text-[#f5f5f5]">{s.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{s.email}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">
                  {COUNTRIES.find((c) => c.code === s.country)?.name || <span className="text-text/40 dark:text-[#f5f5f5]/40">—</span>}
                </td>
                <td className="p-3 text-text dark:text-[#f5f5f5] text-xs">{s.timezone || (s.country ? getTimezoneByCountry(s.country) : '') || '—'}</td>
                <td className="p-3">
                  <select
                    value={s.professorId || ''}
                    onChange={(e) => assignProfessor(s.id, e.target.value || null)}
                    className="text-sm border border-pink-soft dark:border-white/20 rounded-lg px-2 py-1 focus:ring-1 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  >
                    <option value="">{t('dashboard.adminStudents.none')}</option>
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-pink-primary dark:text-pink-300 hover:underline font-medium">{t('dashboard.adminStudents.edit')}</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 dark:text-red-300 hover:underline">{t('dashboard.adminStudents.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal détail des séances d'un élève */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-xl animate-fade-in">
            <div className="p-5 border-b border-pink-soft/30 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">{selectedStudent.name}</h3>
                <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                  {getCountryName(selectedStudent.country)} — {selectedStudent.totalLessons} {t('dashboard.adminStats.lessonsAttended')} — {formatMin(selectedStudent.totalMinutes)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSessionsModal}
                className="p-2 rounded-xl hover:bg-pink-soft/30 dark:hover:bg-white/10 transition"
              >
                <svg className="w-5 h-5 text-text dark:text-[#f5f5f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-text/50 dark:text-[#f5f5f5]/50 py-8">{t('dashboard.adminStats.noSessions')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-pink-soft/20 dark:bg-white/5 text-left">
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.time')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professor')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.planned')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.actual')}</th>
                      <th className="p-2.5 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.adminStats.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.courseId} className="border-t border-pink-soft/20 dark:border-white/5">
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.date}</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.time}</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.professor?.name || '—'}</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5]">{s.durationMin} min</td>
                        <td className="p-2.5 text-text dark:text-[#f5f5f5] font-mono">{s.attended ? `${s.actualMin} min` : '—'}</td>
                        <td className="p-2.5">
                          {s.attended ? (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {t('dashboard.adminStats.present')}
                            </span>
                          ) : s.endReason === 'professor_absent' ? (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              {t('dashboard.admin.endReasonProfessorAbsent')}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-[#f5f5f5]/60">
                              {t('dashboard.adminStats.pending')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
