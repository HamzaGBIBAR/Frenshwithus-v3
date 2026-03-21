import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import COUNTRIES, { convertTimeBetweenTimezones, getTimezoneByCountry } from '../../utils/countries';
import { formatTimeAMPM, getEndTime } from '../../utils/format';
import AvailabilityMatchBoard from '../../components/AvailabilityMatchBoard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOROCCO_TZ = 'Africa/Casablanca';

function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return '—';
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '—';
}

function getWeekDates() {
  const tz = MOROCCO_TZ;
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(new Date());
  const map = {};
  for (const p of parts) { if (p.type !== 'literal') map[p.type] = p.value; }
  const yyyy = Number(map.year); const mm = Number(map.month); const dd = Number(map.day);
  const todayStr = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const moroccoTodayUtcNoon = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
  const jsDow = moroccoTodayUtcNoon.getUTCDay();
  const dayOfWeek = jsDow === 0 ? 7 : jsDow;
  const toMonday = dayOfWeek === 7 ? -6 : 1 - dayOfWeek;
  const monday = new Date(moroccoTodayUtcNoon);
  monday.setUTCDate(monday.getUTCDate() + toMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const y = d.getUTCFullYear(); const m = d.getUTCMonth() + 1; const dayNum = d.getUTCDate();
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return { dateStr, dayNum, year: y, isToday: dateStr === todayStr };
  });
}

function StatChip({ label, value, color, icon, link }) {
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 hover:scale-[1.02] ${color}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

export default function AdminAvailability() {
  const { t } = useTranslation();
  const days = t('calendar.days', { returnObjects: true });
  const dayLabels = Array.isArray(days) ? days : DAYS;

  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCourse, setCreatedCourse] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    Promise.all([
      api.get('/admin/students/availability').then(r => setStudents(r.data)).catch(() => setStudents([])),
      api.get('/admin/professors/availability').then(r => setProfessors(r.data)).catch(() => setProfessors([])),
      api.get('/admin/courses').then(r => setCourses(r.data)).catch(() => setCourses([])),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Stats ── */
  const todayCourses = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return courses.filter(c => c.date === today).length;
  }, [courses]);

  const matchSlotsCount = useMemo(() => {
    const allSlots = new Set();
    professors.forEach(p => {
      (p.availability || []).forEach(ps => {
        students.forEach(s => {
          (s.studentAvailability || []).forEach(ss => {
            if (ps.dayOfWeek === ss.dayOfWeek && ps.startTime === ss.startTime) {
              allSlots.add(`${ps.dayOfWeek}-${ps.startTime}`);
            }
          });
        });
      });
    });
    return allSlots.size;
  }, [professors, students]);

  /* ── Student slot management ── */
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await api.post(`/admin/students/${selectedStudent}/availability`, { ...form });
      setForm({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlot = async (studentId, slotId) => {
    await api.delete(`/admin/students/${studentId}/availability/${slotId}`);
    load();
  };

  /* ── Quick create course from board ── */
  const handleCreateCourse = useCallback(async (courseData) => {
    if (createLoading) return;
    setCreateError('');
    setCreateLoading(true);
    try {
      const weekDates = getWeekDates();
      const dateStr = weekDates[(courseData.dayOfWeek || 1) - 1]?.dateStr || new Date().toISOString().slice(0, 10);
      const { data } = await api.post('/admin/courses', {
        professorId: courseData.professorId,
        studentId: courseData.studentId,
        date: courseData.date || dateStr,
        time: courseData.time,
        durationMin: courseData.durationMin || 60,
      });
      setCreatedCourse(data);
      load();
    } catch (err) {
      setCreateError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    } finally {
      setCreateLoading(false);
    }
  }, [createLoading, t, load]);

  const selectedStudentData = students.find(s => s.id === selectedStudent) || null;
  const selectedStudentCountry = selectedStudentData?.country || null;
  const selectedStudentCountryName = useMemo(() => {
    const found = COUNTRIES.find(c => c.code === selectedStudentCountry);
    return found?.name || selectedStudentCountry;
  }, [selectedStudentCountry]);
  const selectedStudentTz = useMemo(
    () => selectedStudentData?.timezone || (selectedStudentCountry ? getTimezoneByCountry(selectedStudentCountry) : null),
    [selectedStudentData?.timezone, selectedStudentCountry]
  );

  const formatSlotTime = (t) => t ? `${t} (${formatTimeAMPM(t)})` : '';

  const getStudentLocalSlot = (slot, tz) => {
    if (!tz) return null;
    const weekDates = getWeekDates();
    const dateStr = weekDates[slot.dayOfWeek - 1]?.dateStr || '';
    const localStart = convertTimeBetweenTimezones(dateStr, slot.startTime, MOROCCO_TZ, tz);
    const localEnd = convertTimeBetweenTimezones(dateStr, slot.endTime, MOROCCO_TZ, tz);
    if (!localStart || !localEnd) return null;
    return { localStart, localEnd };
  };

  const formatStudentLocalSlot = (slot, tz) => {
    if (slot.localStartTime != null) {
      const day = dayLabels[(slot.localDayOfWeek ?? slot.dayOfWeek) - 1] || '-';
      return `${day} ${formatSlotTime(slot.localStartTime)} – ${formatSlotTime(slot.localEndTime)}`;
    }
    const local = getStudentLocalSlot(slot, tz);
    if (!local) return `${dayLabels[slot.dayOfWeek - 1] || '-'} ${formatSlotTime(slot.startTime)} – ${formatSlotTime(slot.endTime)}`;
    const startDay = dayLabels[local.localStart.dayOfWeek - 1] || '-';
    const endDay = dayLabels[local.localEnd.dayOfWeek - 1] || '-';
    const range = startDay === endDay ? startDay : `${startDay} → ${endDay}`;
    return `${range} ${formatSlotTime(local.localStart.time)} – ${formatSlotTime(local.localEnd.time)}`;
  };

  const formatMoroccoSlot = (slot) => {
    const d = dayLabels[(slot.refDayOfWeek ?? slot.dayOfWeek) - 1] || '-';
    const s = slot.refStartTime ?? slot.startTime;
    const e = slot.refEndTime ?? slot.endTime;
    return `${d} ${formatSlotTime(s)} – ${formatSlotTime(e)}`;
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-1">
          {t('dashboard.adminAvailability.title')}
        </h1>
        <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm">
          Visualisez les créneaux de vos professeurs et élèves, détectez les matches et créez des cours Jitsi en un clic.
        </p>
      </div>

      {/* ── Error ── */}
      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
          <button onClick={load} className="shrink-0 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 text-sm font-medium transition hover:bg-red-200">
            Réessayer
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10">
          <span className="w-5 h-5 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text/70 dark:text-[#f5f5f5]/70">Chargement des disponibilités…</span>
        </div>
      )}

      {/* ── Hero Stats Bar ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip
            icon="👨‍🏫"
            label="Professeurs"
            value={professors.length}
            color="border-indigo-200/60 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
          />
          <StatChip
            icon="🎓"
            label="Élèves"
            value={students.length}
            color="border-emerald-200/60 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          />
          <StatChip
            icon="⚡"
            label="Créneaux communs"
            value={matchSlotsCount}
            color="border-amber-200/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200"
          />
          <StatChip
            icon="📅"
            label="Cours aujourd'hui"
            value={todayCourses}
            link="/admin/courses"
            color="border-pink-200/60 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-500/10 text-pink-800 dark:text-pink-200"
          />
        </div>
      )}

      {/* ── Course Created Toast ── */}
      {createdCourse && (
        <div className="p-4 rounded-2xl border border-green-200 dark:border-green-500/40 bg-green-50 dark:bg-green-900/20 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-green-800 dark:text-green-300">Cours créé avec succès !</p>
            <p className="text-sm text-green-700 dark:text-green-400/80 mt-0.5">
              {createdCourse.professor?.name} → {createdCourse.student?.name} · {createdCourse.date} à {createdCourse.time}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input readOnly value={`${window.location.origin}/live?courseId=${createdCourse.id}`} className="flex-1 min-w-0 px-2 py-1 rounded text-xs font-mono border border-green-200 dark:border-green-700 bg-white dark:bg-[#111] text-text dark:text-[#f5f5f5]" />
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/live?courseId=${createdCourse.id}`)} className="px-2 py-1 rounded bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 text-xs font-medium hover:bg-green-200 transition">
                Copier
              </button>
            </div>
          </div>
          <button onClick={() => setCreatedCourse(null)} className="shrink-0 text-green-600/50 hover:text-green-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {createError && (
        <div className="p-3 rounded-xl border border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">{createError}</div>
      )}

      {/* ── Match Board ── */}
      {!loading && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-400 to-pink-500" />
            <h2 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">Tableau de matches</h2>
            <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50">Les cellules dorées ⚡ = prof + élève disponibles simultanément — cliquez pour créer un cours Jitsi</span>
          </div>
          <AvailabilityMatchBoard
            professors={professors}
            students={students}
            dayLabels={dayLabels}
            onCreateCourse={handleCreateCourse}
          />
        </section>
      )}

      {/* ── Per-Student Slot Editor (accordion) ── */}
      {!loading && (
        <section className="rounded-2xl border border-pink-soft/50 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
          <button
            type="button"
            onClick={() => setEditorOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-pink-soft/10 dark:hover:bg-white/3 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-soft/40 dark:bg-pink-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-text dark:text-[#f5f5f5] text-sm">Modifier les créneaux d'un élève</p>
                <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">Ajouter ou supprimer des disponibilités par élève</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-text/40 dark:text-[#f5f5f5]/40 transition-transform duration-200 ${editorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {editorOpen && (
            <div className="border-t border-pink-soft/30 dark:border-white/10 p-5 space-y-5 animate-fade-in">
              {/* Student selector */}
              <div>
                <label className="block text-xs font-semibold text-text/60 dark:text-[#f5f5f5]/60 mb-2 uppercase tracking-wider">{t('dashboard.admin.student')}</label>
                <select
                  value={selectedStudent || ''}
                  onChange={e => setSelectedStudent(e.target.value || null)}
                  className="w-full max-w-sm px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                >
                  <option value="">{t('dashboard.adminAvailability.selectStudent')}</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedStudent && selectedStudentData && (
                <div className="space-y-4">
                  {/* Timezone info */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-soft/40 dark:bg-pink-500/15 text-xs text-pink-800 dark:text-pink-300 border border-pink-soft/60 dark:border-pink-400/30">
                      🌍 {selectedStudentCountryName || '-'}
                    </span>
                    {selectedStudentTz && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-400/20">
                        🕐 {selectedStudentTz}
                      </span>
                    )}
                  </div>

                  {/* Add slot form */}
                  <form onSubmit={handleAddSlot} className="flex flex-wrap gap-3 items-end bg-pink-soft/10 dark:bg-white/3 rounded-xl p-4 border border-pink-soft/30 dark:border-white/8">
                    <div>
                      <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminAvailability.day')}</label>
                      <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}
                        className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] text-sm">
                        {dayLabels.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminAvailability.from')}</label>
                      <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                        className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminAvailability.to')}</label>
                      <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                        className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-lg bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] text-sm" />
                    </div>
                    <button type="submit" className="px-4 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition text-sm font-medium">
                      {t('dashboard.adminAvailability.add')}
                    </button>
                  </form>
                  <p className="text-[11px] text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.adminAvailability.slotInputHint')}</p>

                  {/* Slots list */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text/70 dark:text-[#f5f5f5]/70">{t('dashboard.adminAvailability.currentSlots')} :</p>
                    {(selectedStudentData.studentAvailability || []).length === 0 ? (
                      <p className="text-sm text-text/40 dark:text-[#f5f5f5]/40 italic">{t('dashboard.adminAvailability.noSlots')}</p>
                    ) : (
                      <div className="space-y-2">
                        {(selectedStudentData.studentAvailability || []).map(slot => (
                          <div key={slot.id} className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-400/20">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{t('dashboard.adminAvailability.slotLocalLabel')}: {formatStudentLocalSlot(slot, selectedStudentTz)}</p>
                              <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">{t('dashboard.adminAvailability.slotMoroccoRef')}: {formatMoroccoSlot(slot)}</p>
                            </div>
                            <button onClick={() => handleDeleteSlot(selectedStudent, slot.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs shrink-0 hover:underline">× Suppr.</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
