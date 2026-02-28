import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

export default function Courses() {
  const { t } = useTranslation();
  const DAYS = t('calendar.days', { returnObjects: true });
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [professorsWithAvailability, setProfessorsWithAvailability] = useState([]);
  const [studentsWithAvailability, setStudentsWithAvailability] = useState([]);
  const [form, setForm] = useState({ professorId: '', studentId: '', date: '', time: '', meetingLink: '' });
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/courses').then((r) => setCourses(r.data));
    api.get('/admin/professors').then((r) => setProfessors(r.data));
    api.get('/admin/students').then((r) => setStudents(r.data));
    api.get('/admin/professors/availability').then((r) => setProfessorsWithAvailability(r.data)).catch(() => setProfessorsWithAvailability([]));
    api.get('/admin/students/availability').then((r) => setStudentsWithAvailability(r.data)).catch(() => setStudentsWithAvailability([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/courses', form);
      setForm({ professorId: '', studentId: '', date: '', time: '', meetingLink: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('dashboard.adminCourses.deleteConfirm'))) return;
    await api.delete(`/admin/courses/${id}`);
    load();
  };

  const getProfessorAvailability = (profId) => {
    const p = professorsWithAvailability.find((x) => x.id === profId);
    return p?.availability || [];
  };

  const getStudentAvailability = (studentId) => {
    const s = studentsWithAvailability.find((x) => x.id === studentId);
    return s?.studentAvailability || [];
  };

  /** Generate a unique Jitsi Meet room URL. Same link = same video room for professor and student. */
  const generateJitsiRoomLink = () => {
    const base = 'https://meet.jit.si';
    const datePart = form.date || 'cours';
    const timePart = (form.time || '').replace(':', '-') || '00-00';
    const slug = `frenchwithus-${datePart}-${timePart}-${Math.random().toString(36).slice(2, 6)}`;
    const url = `${base}/${slug}`;
    setForm((f) => ({ ...f, meetingLink: url }));
  };

  const formatSlot = (slot) => {
    const day = DAYS[slot.dayOfWeek - 1] || '-';
    return `${day} ${slot.startTime}-${slot.endTime}`;
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.adminCourses.title')}</h1>

      {/* Create course - Admin creates and assigns professor */}
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg mb-6 transition-colors duration-500">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">{t('dashboard.adminCourses.createCourse')}</h2>
        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-4">
          {t('dashboard.adminCourses.createDesc')}
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.admin.professor')}</label>
              <select
                value={form.professorId}
                onChange={(e) => setForm((f) => ({ ...f, professorId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                required
              >
                <option value="">{t('dashboard.adminCourses.selectProfessor')}</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {form.professorId && (
                <div className="mt-2 flex flex-wrap gap-1.5 animate-fade-in">
                  {getProfessorAvailability(form.professorId).length > 0 ? (
                    getProfessorAvailability(form.professorId).map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-soft/60 dark:bg-pink-500/20 text-pink-dark dark:text-pink-300 border border-pink-soft/50 dark:border-pink-400/30 animate-fade-in transition-transform duration-200 hover:scale-105"
                      >
                        {formatSlot(s)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50 italic">{t('dashboard.adminCourses.noAvailability')}</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.admin.student')}</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                required
              >
                <option value="">{t('dashboard.adminCourses.selectStudent')}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {form.studentId && (
                <div className="mt-2 flex flex-wrap gap-1.5 animate-fade-in">
                  {getStudentAvailability(form.studentId).length > 0 ? (
                    getStudentAvailability(form.studentId).map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-400/30 animate-fade-in transition-transform duration-200 hover:scale-105"
                      >
                        {formatSlot(s)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50 italic">{t('dashboard.adminCourses.noAvailability')}</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.admin.date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">Heure</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminCourses.meetingLink')}</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  placeholder="https://meet.jit.si/francais-a1-2026"
                  value={form.meetingLink}
                  onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
                  className="flex-1 min-w-[200px] px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                />
                <button
                  type="button"
                  onClick={generateJitsiRoomLink}
                  className="px-4 py-2.5 rounded-xl border border-pink-primary dark:border-pink-400 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 transition whitespace-nowrap"
                >
                  {t('dashboard.adminCourses.generateJitsiRoom')}
                </button>
              </div>
              <p className="mt-1 text-xs text-text/50 dark:text-[#f5f5f5]/50">
                {t('dashboard.adminCourses.meetingLinkHelp')}
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow"
          >
            {t('dashboard.adminCourses.create')}
          </button>
        </form>
      </div>

      {/* Courses list */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-colors duration-500 responsive-table-wrap">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="bg-pink-soft/30 dark:bg-white/5 text-left">
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.professor')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.student')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.date')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.time')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.started')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.admin.link')}</th>
              <th className="p-3 font-medium text-text dark:text-[#f5f5f5]"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-pink-soft/30 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5 transition">
                <td className="p-3 text-text dark:text-[#f5f5f5]">{c.professor?.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{c.student?.name}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{c.date}</td>
                <td className="p-3 text-text dark:text-[#f5f5f5]">{c.time}</td>
                <td className="p-3">
                  {c.isStarted ? (
                    c.sessionEnded ? (
                      <span className="text-amber-600 dark:text-amber-400">{t('dashboard.admin.ended')}</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">{t('dashboard.admin.yes')}</span>
                    )
                  ) : (
                    <span className="text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.admin.no')}</span>
                  )}
                </td>
                <td className="p-3">
                  {c.meetingLink ? (
                    <a href={c.meetingLink} target="_blank" rel="noreferrer" className="text-pink-primary dark:text-pink-300 hover:underline truncate max-w-[150px] block">
                      {t('dashboard.admin.link')}
                    </a>
                  ) : '-'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-600 dark:text-red-300 hover:underline text-sm"
                  >
                    {t('dashboard.adminCourses.delete')}
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
