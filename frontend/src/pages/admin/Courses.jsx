import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTimeAMPM, formatDateToAMPM, getEndTime, formatTimeRange, shouldShowProfessorAbsent } from '../../utils/format';
import api from '../../api/axios';

/* ─── Status helpers ─────────────────────────────────────── */
function getCourseStatus(c) {
  if (shouldShowProfessorAbsent(c)) return 'professor_absent';
  if (c.endReason === 'meeting_issue') return 'meeting_issue';
  if (c.sessionEnded) return 'completed';
  if (c.isStarted) return 'in_progress';
  const start = new Date(`${c.date}T${c.time}`);
  if (start <= new Date()) return 'past_not_started';
  return 'upcoming';
}

const STATUS_META = {
  upcoming:         { label: 'À venir',       bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500',                      strip: 'bg-blue-500' },
  in_progress:      { label: 'En cours',       bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500 animate-pulse',        strip: 'bg-green-500' },
  completed:        { label: 'Terminé',        bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500',                     strip: 'bg-amber-500' },
  professor_absent: { label: 'Prof absent',    bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-300',dot: 'bg-orange-500 animate-pulse',       strip: 'bg-orange-500' },
  meeting_issue:    { label: 'Prob. vidéo',    bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-300',      dot: 'bg-red-500',                       strip: 'bg-red-500' },
  past_not_started: { label: 'Non démarré',    bg: 'bg-gray-100 dark:bg-white/10',       text: 'text-gray-600 dark:text-gray-400',    dot: 'bg-gray-400',                      strip: 'bg-gray-400' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ user, size = 32 }) {
  const [err, setErr] = useState(false);
  const initial = (user?.name || '?').charAt(0).toUpperCase();
  if (user?.avatarUrl && !err) {
    return <img src={user.avatarUrl} alt={user.name} onError={() => setErr(true)} style={{ width: size, height: size }} className="rounded-full object-cover ring-2 ring-white/10 shrink-0" />;
  }
  return (
    <div style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="rounded-full flex items-center justify-center font-bold ring-2 ring-white/10 shrink-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 text-pink-200">
      {initial}
    </div>
  );
}

/* ─── Course Card ─────────────────────────────────────────── */
function CourseCard({ course, onDelete, onRelaunch, t }) {
  const status = getCourseStatus(course);
  const meta = STATUS_META[status] || STATUS_META.upcoming;
  const canRelaunch = status === 'meeting_issue' || status === 'professor_absent';
  const liveUrl = `/live?courseId=${course.id}`;

  return (
    <div className="group relative flex items-stretch gap-0 rounded-2xl border border-pink-soft/30 dark:border-white/8 bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5">
      {/* Status strip */}
      <div className={`w-1 shrink-0 ${meta.strip}`} />

      {/* Main content */}
      <div className="flex flex-1 flex-wrap items-center gap-4 px-4 py-3 min-w-0">
        {/* Prof → Student */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar user={course.professor} size={32} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text dark:text-[#f5f5f5] truncate">{course.professor?.name || '—'}</p>
            <p className="text-[10px] text-text/40 dark:text-[#f5f5f5]/40 truncate">Professeur</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-text/20 dark:text-[#f5f5f5]/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar user={course.student} size={32} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text dark:text-[#f5f5f5] truncate">{course.student?.name || '—'}</p>
            <p className="text-[10px] text-text/40 dark:text-[#f5f5f5]/40 truncate">Élève{course.student?.age ? ` · ${course.student.age} ans` : ''}</p>
          </div>
        </div>

        {/* Date / Time */}
        <div className="flex flex-col items-center text-center ml-auto shrink-0">
          <span className="text-sm font-semibold text-text dark:text-[#f5f5f5] tabular-nums">{course.date}</span>
          <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50 tabular-nums">{formatTimeRange(course.time, course.durationMin || 60)}</span>
          <span className="text-[10px] text-text/30 dark:text-[#f5f5f5]/30">{course.durationMin || 60} min</span>
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusBadge status={status} />
          {course.sessionEnded && course.sessionEndedAt && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Fin: {formatDateToAMPM(course.sessionEndedAt)}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-l border-pink-soft/20 dark:border-white/6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={liveUrl} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-800/40 transition border border-blue-200/60 dark:border-blue-700/40">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
          </svg>
          Rejoindre
        </a>
        {canRelaunch && (
          <button onClick={() => onRelaunch(course)}
            className="px-2.5 py-1.5 rounded-xl bg-pink-soft/60 dark:bg-pink-500/20 text-pink-dark dark:text-pink-300 text-xs font-medium hover:bg-pink-soft dark:hover:bg-pink-500/30 transition">
            {t('dashboard.admin.relaunch')}
          </button>
        )}
        <button onClick={() => onDelete(course.id)}
          className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition">
          {t('dashboard.adminCourses.delete')}
        </button>
      </div>
    </div>
  );
}

/* ─── Group courses by day ───────────────────────────────── */
function groupByDay(courses) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const groups = { today: [], tomorrow: [], upcoming: [], past: [] };
  const seen = new Set();
  courses.forEach(c => {
    if (c.date === today) groups.today.push(c);
    else if (c.date === tomorrow) groups.tomorrow.push(c);
    else if (c.date > today) groups.upcoming.push(c);
    else groups.past.push(c);
  });
  // Sort
  ['today', 'tomorrow', 'upcoming'].forEach(k => groups[k].sort((a, b) => a.time.localeCompare(b.time)));
  groups.past.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  return groups;
}

const EMPTY_FORM = { professorId: '', studentId: '', date: '', time: '', durationMin: '60' };

export default function Courses() {
  const { t } = useTranslation();

  /* ── Data ── */
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [profsAvail, setProfsAvail] = useState([]);
  const [studsAvail, setStudsAvail] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Form ── */
  const [form, setForm] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createdCourse, setCreatedCourse] = useState(null);

  /* ── Relaunch ── */
  const [relaunchCourse, setRelaunchCourse] = useState(null);
  const [relaunchLoading, setRelaunchLoading] = useState(false);

  /* ── Auto-generate ── */
  const [autoGenWeekStart, setAutoGenWeekStart] = useState(() => {
    const d = new Date(); const day = d.getDay();
    const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
    d.setDate(d.getDate() + diff); return d.toISOString().slice(0, 10);
  });
  const [autoGenDuration, setAutoGenDuration] = useState(60);
  const [autoGenResult, setAutoGenResult] = useState(null);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenPreview, setAutoGenPreview] = useState(null);

  /* ── Filters ── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/courses').then(r => setCourses(r.data)),
      api.get('/admin/professors').then(r => setProfessors(r.data)),
      api.get('/admin/students').then(r => setStudents(r.data)),
      api.get('/admin/professors/availability').then(r => setProfsAvail(r.data)).catch(() => setProfsAvail([])),
      api.get('/admin/students/availability').then(r => setStudsAvail(r.data)).catch(() => setStudsAvail([])),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const counts = { upcoming: 0, in_progress: 0, completed: 0, professor_absent: 0, meeting_issue: 0, past_not_started: 0 };
    courses.forEach(c => { const s = getCourseStatus(c); counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [courses]);

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    let list = courses;
    if (statusFilter !== 'all') list = list.filter(c => getCourseStatus(c) === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.professor?.name?.toLowerCase().includes(q) || c.student?.name?.toLowerCase().includes(q) || c.date?.includes(q));
    }
    return list;
  }, [courses, search, statusFilter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  /* ── Availability helpers ── */
  const getProfSlots = (id) => profsAvail.find(x => x.id === id)?.availability || [];
  const getStudSlots = (id) => studsAvail.find(x => x.id === id)?.studentAvailability || [];
  const DAYS = t('calendar.days', { returnObjects: true });
  const formatSlot = s => `${(Array.isArray(DAYS) ? DAYS : [])[s.dayOfWeek - 1] || '-'} ${s.startTime}–${s.endTime}`;

  /* ── Compatibility detection ── */
  const compatibility = useMemo(() => {
    if (!form.professorId || !form.studentId) return null;
    const ps = getProfSlots(form.professorId);
    const ss = getStudSlots(form.studentId);
    const matches = [];
    ps.forEach(p => {
      ss.forEach(s => {
        if (p.dayOfWeek === s.dayOfWeek) {
          const overlapStart = p.startTime > s.startTime ? p.startTime : s.startTime;
          const overlapEnd = p.endTime < s.endTime ? p.endTime : s.endTime;
          if (overlapStart < overlapEnd) {
            matches.push({ dayOfWeek: p.dayOfWeek, start: overlapStart, end: overlapEnd });
          }
        }
      });
    });
    return matches;
  }, [form.professorId, form.studentId, profsAvail, studsAvail]);

  /* ── Create course ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setCreateLoading(true);
    try {
      const { data } = await api.post('/admin/courses', form);
      setCreatedCourse(data); setForm(EMPTY_FORM); load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    } finally { setCreateLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('dashboard.adminCourses.deleteConfirm'))) return;
    await api.delete(`/admin/courses/${id}`); load();
  };

  const openRelaunch = (c) => {
    setRelaunchCourse(c);
    setForm({ professorId: c.professorId, studentId: c.studentId, date: '', time: '', durationMin: String(c.durationMin || 60) });
    setError('');
  };

  const handleRelaunch = async (e) => {
    e.preventDefault();
    setError(''); setRelaunchLoading(true);
    try {
      await api.post('/admin/courses', form);
      setRelaunchCourse(null); setForm(EMPTY_FORM); load();
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    } finally { setRelaunchLoading(false); }
  };

  const handleAutoGenPreview = async () => {
    setAutoGenLoading(true); setAutoGenResult(null); setAutoGenPreview(null);
    try {
      const r = await api.get('/admin/courses/auto-generate/preview', { params: { weekStart: autoGenWeekStart, durationMin: autoGenDuration } });
      setAutoGenPreview(r.data);
    } catch (err) {
      setAutoGenPreview({ suggested: 0, slots: [], error: err.response?.data?.error || err.message });
    } finally { setAutoGenLoading(false); }
  };

  const handleAutoGenerate = async () => {
    setAutoGenLoading(true); setAutoGenResult(null); setAutoGenPreview(null);
    try {
      const r = await api.post('/admin/courses/auto-generate', { weekStart: autoGenWeekStart, durationMin: autoGenDuration });
      setAutoGenResult(r.data); load();
    } catch (err) {
      setAutoGenResult({ created: 0, courses: [], error: err.response?.data?.error || err.message });
    } finally { setAutoGenLoading(false); }
  };

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.adminCourses.title')}</h1>
        <button type="button" onClick={() => { setFormOpen(o => !o); setCreatedCourse(null); setError(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-primary dark:bg-pink-400 text-white text-sm font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formOpen ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {formOpen ? 'Fermer' : t('dashboard.adminCourses.createCourse')}
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'upcoming', label: 'À venir', color: 'text-blue-600 dark:text-blue-400' },
          { key: 'in_progress', label: 'En cours', color: 'text-green-600 dark:text-green-400' },
          { key: 'completed', label: 'Terminés', color: 'text-amber-600 dark:text-amber-400' },
          { key: 'professor_absent', label: 'Prof absent', color: 'text-orange-600 dark:text-orange-400' },
          { key: 'meeting_issue', label: 'Vidéo issue', color: 'text-red-600 dark:text-red-400' },
          { key: 'past_not_started', label: 'Non démarrés', color: 'text-gray-500 dark:text-gray-400' },
        ].map(({ key, label, color }) => (
          <button key={key} type="button" onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`p-3 rounded-2xl border text-left transition-all ${statusFilter === key ? 'border-pink-primary/50 dark:border-pink-400/50 bg-pink-soft/40 dark:bg-pink-400/10 shadow-sm' : 'border-pink-soft/40 dark:border-white/10 bg-white dark:bg-[#1a1a1a] hover:border-pink-soft dark:hover:border-white/20'}`}>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{stats[key] ?? 0}</p>
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Auto-generate ── */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-pink-soft/30 dark:border-white/10 bg-pink-soft/10 dark:bg-white/3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-text dark:text-[#f5f5f5] text-sm">{t('dashboard.adminCourses.autoGenerateTitle')}</h2>
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.adminCourses.autoGenerateDesc')}</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.weekStart')}</label>
              <input type="date" value={autoGenWeekStart} onChange={e => setAutoGenWeekStart(e.target.value)}
                className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.duration')} (min)</label>
              <select value={autoGenDuration} onChange={e => setAutoGenDuration(Number(e.target.value))}
                className="px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm">
                {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAutoGenPreview} disabled={autoGenLoading}
                className="px-4 py-2 border border-pink-soft dark:border-white/20 rounded-xl hover:bg-pink-soft/40 dark:hover:bg-white/10 transition text-text dark:text-[#f5f5f5] text-sm disabled:opacity-50">
                {autoGenLoading ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />{t('dashboard.adminCourses.preview')}</span> : t('dashboard.adminCourses.preview')}
              </button>
              <button onClick={handleAutoGenerate} disabled={autoGenLoading}
                className="px-4 py-2 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow text-sm disabled:opacity-50">
                {autoGenLoading ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('dashboard.adminCourses.autoGenerate')}</span> : t('dashboard.adminCourses.autoGenerate')}
              </button>
            </div>
          </div>
          {autoGenPreview && !autoGenResult && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/40">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{autoGenPreview.error ? autoGenPreview.error : t('dashboard.adminCourses.previewResult', { count: autoGenPreview.suggested })}</p>
              {autoGenPreview.slots?.slice(0, 8).map((s, i) => (
                <p key={i} className="text-xs text-blue-700 dark:text-blue-300/80 mt-1">
                  · {s.date} {s.time} — {professors.find(p => p.id === s.professorId)?.name} / {students.find(st => st.id === s.studentId)?.name}
                </p>
              ))}
            </div>
          )}
          {autoGenResult && (
            <div className={`mt-4 p-4 rounded-xl border ${autoGenResult.error ? 'bg-red-50 dark:bg-red-900/20 border-red-200' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200'}`}>
              <p className={`text-sm font-medium ${autoGenResult.error ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                {autoGenResult.error ? autoGenResult.error : t('dashboard.adminCourses.autoGenCreated', { count: autoGenResult.created })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Create form ── */}
      {formOpen && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-pink-soft/30 dark:border-white/10 bg-pink-soft/10 dark:bg-white/3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-400/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-text dark:text-[#f5f5f5] text-sm">{t('dashboard.adminCourses.createCourse')}</h2>
                <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.adminCourses.createDesc')}</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/60 dark:border-blue-700/50">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
              </svg>
              Jitsi auto
            </span>
          </div>

          <div className="p-5">
            {createdCourse ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-text dark:text-[#f5f5f5]">Cours créé avec succès</p>
                  <p className="text-sm text-text/60 mt-0.5">{createdCourse.professor?.name} → {createdCourse.student?.name} · {createdCourse.date} à {createdCourse.time}</p>
                </div>
                <div className="w-full max-w-md rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/40 p-3 text-left">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">Lien Jitsi</p>
                  <div className="flex gap-2">
                    <input readOnly value={`${window.location.origin}/live?courseId=${createdCourse.id}`} className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-[#111] text-xs text-text dark:text-[#f5f5f5] font-mono" />
                    <button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/live?courseId=${createdCourse.id}`)} className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 transition">Copier</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setCreatedCourse(null); setFormOpen(false); }} className="px-4 py-2 rounded-xl border border-pink-soft/50 dark:border-white/20 text-sm text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 transition">Fermer</button>
                  <button type="button" onClick={() => setCreatedCourse(null)} className="px-4 py-2 rounded-xl bg-pink-primary dark:bg-pink-400 text-white text-sm font-medium hover:bg-pink-dark transition">Créer un autre</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Professor */}
                  <div>
                    <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.admin.professor')} <span className="text-red-400">*</span></label>
                    <select value={form.professorId} onChange={e => setForm(f => ({ ...f, professorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" required>
                      <option value="">{t('dashboard.adminCourses.selectProfessor')}</option>
                      {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {form.professorId && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getProfSlots(form.professorId).length > 0
                          ? getProfSlots(form.professorId).map(s => (
                            <button key={s.id} type="button"
                              onClick={() => { /* Pre-fill time if slot has a time */ }}
                              className="px-2 py-0.5 rounded-md text-[11px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-400/25 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition">
                              {formatSlot(s)}
                            </button>
                          ))
                          : <span className="text-[11px] text-text/40 dark:text-[#f5f5f5]/40 italic">{t('dashboard.adminCourses.noAvailability')}</span>
                        }
                      </div>
                    )}
                  </div>

                  {/* Student */}
                  <div>
                    <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.admin.student')} <span className="text-red-400">*</span></label>
                    <select value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                      className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" required>
                      <option value="">{t('dashboard.adminCourses.selectStudent')}</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {form.studentId && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getStudSlots(form.studentId).length > 0
                          ? getStudSlots(form.studentId).map(s => (
                            <span key={s.id} className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-400/25">
                              {formatSlot(s)}
                            </span>
                          ))
                          : <span className="text-[11px] text-text/40 dark:text-[#f5f5f5]/40 italic">{t('dashboard.adminCourses.noAvailability')}</span>
                        }
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.admin.date')} <span className="text-red-400">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" required />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.time')} <span className="text-red-400">*</span></label>
                    <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" required />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.duration')}</label>
                    <select value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))}
                      className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm">
                      {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                    </select>
                  </div>

                  {/* End time preview */}
                  <div>
                    <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.endTime')}</label>
                    <div className="w-full px-3 py-2 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10 text-sm text-text dark:text-[#f5f5f5]">
                      {form.time ? `${formatTimeAMPM(form.time)} – ${formatTimeAMPM(getEndTime(form.time, form.durationMin))}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Compatibility banner */}
                {compatibility !== null && (
                  <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border animate-fade-in ${
                    compatibility.length > 0
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30'
                  }`}>
                    <span className="text-lg shrink-0">{compatibility.length > 0 ? '✅' : '⚠️'}</span>
                    <div>
                      {compatibility.length > 0 ? (
                        <>
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Créneaux communs trouvés !</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {compatibility.slice(0, 4).map((m, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">
                                {(Array.isArray(DAYS) ? DAYS : [])[m.dayOfWeek - 1] || `J${m.dayOfWeek}`} {m.start}–{m.end}
                              </span>
                            ))}
                            {compatibility.length > 4 && <span className="px-2 py-1 rounded-lg text-xs text-emerald-600/70">+{compatibility.length - 4}</span>}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Aucun créneau commun</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400/80">Ces deux personnes n'ont pas de disponibilités qui se chevauchent. Vous pouvez quand même créer le cours.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.adminCourses.dateTimeMoroccoHint')}</p>

                {/* Jitsi info */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/40">
                  <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">La salle vidéo est générée automatiquement via <strong>Jitsi JaaS (8x8)</strong>. Prof et élève la rejoignent depuis leur tableau de bord.</p>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 rounded-xl border border-pink-soft/50 dark:border-white/20 text-sm text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 transition">Annuler</button>
                  <button type="submit" disabled={createLoading} className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-pink-primary dark:bg-pink-400 text-white text-sm font-medium hover:bg-pink-dark disabled:opacity-50 transition btn-glow">
                    {createLoading ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Création…</span> : t('dashboard.adminCourses.create')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Course Cards by day ── */}
      <div className="space-y-1">
        {/* Search + filter */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-4 flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 dark:text-[#f5f5f5]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Rechercher prof, élève, date…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-pink-soft/50 dark:border-white/20 bg-transparent text-text dark:text-[#f5f5f5] text-sm placeholder-text/40 dark:placeholder-[#f5f5f5]/40 focus:outline-none focus:ring-2 focus:ring-pink-primary/40" />
          </div>
          {statusFilter !== 'all' && (
            <button type="button" onClick={() => setStatusFilter('all')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-soft/40 dark:bg-white/10 text-text dark:text-[#f5f5f5] text-sm hover:bg-pink-soft/70 transition">
              <span>{STATUS_META[statusFilter]?.label}</span>
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50 ml-auto">{filtered.length} cours</span>
        </div>

        {/* Day groups */}
        {[
          { key: 'today', label: "📅 Aujourd'hui" },
          { key: 'tomorrow', label: '📆 Demain' },
          { key: 'upcoming', label: '🗓️ Cette semaine & au-delà' },
          { key: 'past', label: '📁 Passés' },
        ].map(({ key, label }) => {
          const list = grouped[key] || [];
          if (list.length === 0) return null;
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm font-semibold text-text/70 dark:text-[#f5f5f5]/70">{label}</span>
                <span className="text-xs text-text/40 dark:text-[#f5f5f5]/40 bg-pink-soft/30 dark:bg-white/8 px-2 py-0.5 rounded-full">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map(c => (
                  <CourseCard key={c.id} course={c} onDelete={handleDelete} onRelaunch={openRelaunch} t={t} />
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-pink-soft/30 dark:bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-text/20 dark:text-[#f5f5f5]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-text/50 dark:text-[#f5f5f5]/50">
              {search || statusFilter !== 'all' ? 'Aucun cours correspond aux filtres' : "Aucun cours pour l'instant"}
            </p>
          </div>
        )}
      </div>

      {/* ── Relaunch modal ── */}
      {relaunchCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-xl p-6 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.admin.relaunchCourse')}</h3>
                <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">{relaunchCourse.professor?.name} → {relaunchCourse.student?.name}</p>
              </div>
              <button type="button" onClick={() => { setRelaunchCourse(null); setForm(EMPTY_FORM); }} className="w-8 h-8 rounded-full bg-pink-soft/50 dark:bg-white/10 flex items-center justify-center text-text/60 hover:bg-pink-soft transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRelaunch} className="space-y-4">
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.admin.date')} <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.time')} <span className="text-red-400">*</span></label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.duration')}</label>
                  <select value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: e.target.value }))} className="w-full px-3 py-2 border border-pink-soft dark:border-white/20 rounded-xl bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] text-sm">
                    {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1.5">{t('dashboard.adminCourses.endTime')}</label>
                  <div className="w-full px-3 py-2 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10 text-sm text-text dark:text-[#f5f5f5]">
                    {form.time ? `${formatTimeAMPM(form.time)} – ${formatTimeAMPM(getEndTime(form.time, form.durationMin))}` : '—'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.adminCourses.dateTimeMoroccoHint')}</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setRelaunchCourse(null); setForm(EMPTY_FORM); }} className="flex-1 px-4 py-2.5 rounded-xl border border-pink-soft dark:border-white/20 text-text dark:text-[#f5f5f5] text-sm font-medium hover:bg-pink-soft/30 transition">{t('dashboard.livePage.cancel')}</button>
                <button type="submit" disabled={relaunchLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white text-sm font-medium hover:bg-pink-dark disabled:opacity-50 transition">
                  {relaunchLoading ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Création…</span> : t('dashboard.adminCourses.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
