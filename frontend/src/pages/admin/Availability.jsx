import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import COUNTRIES, { convertTimeBetweenTimezones, getTimezoneByCountry } from '../../utils/countries';
const REF_TZ = 'UTC';
import { formatTimeAMPM, getEndTime } from '../../utils/format';
import AdminStudentScheduleMatrix from '../../components/AdminStudentScheduleMatrix';
import UnifiedAvailabilityCalendar from '../../components/UnifiedAvailabilityCalendar';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOROCCO_TZ = 'Africa/Casablanca';

/** Format name for display: first letter uppercase, rest lowercase. */
function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return '—';
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '—';
}

/** Avatar for planning grid: profile photo prominent, then optional pack, name, and age. */
function PlanningAvatar({ user, size = 28, showName = true, showAge = true, alwaysShowAgeSlot = false, ageLabel = 'Age', packLabel = null, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const rawName = user?.name?.trim() || '';
  const initial = rawName ? rawName.charAt(0).toUpperCase() : '?';
  const displayName = formatDisplayName(user?.name);
  const hasAge = showAge && user?.age != null && Number.isFinite(Number(user.age));
  const showAgeSlot = showAge && (alwaysShowAgeSlot || hasAge);
  const ageValue = hasAge ? String(user.age) : '—';
  const title = showAge ? `${displayName}, ${ageLabel}: ${ageValue}` : displayName;
  const textSize = size <= 20 ? 'text-[10px]' : size <= 24 ? 'text-xs' : 'text-[11px]';
  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`} title={title}>
      <span
        className="shrink-0 rounded-full overflow-hidden bg-pink-soft/40 dark:bg-white/20 flex items-center justify-center font-semibold text-pink-800 dark:text-pink-200 ring-2 ring-white/50 dark:ring-white/20"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      >
        {user?.avatarUrl && !imgError ? (
          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          initial
        )}
      </span>
      <span className="inline-flex flex-col min-w-0 gap-0">
        {packLabel && (
          <span className="shrink-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            {packLabel}
          </span>
        )}
        {showName && (
          <span className="inline-flex items-center gap-1 min-w-0 flex-wrap">
            <span className={`truncate font-medium text-text dark:text-[#f5f5f5] ${textSize} max-w-[80px] sm:max-w-none`}>{displayName}</span>
            {showAgeSlot && (
              <>
                <span className="shrink-0 text-[10px] text-text/50 dark:text-[#f5f5f5]/50" aria-hidden>·</span>
                <span className={`shrink-0 text-text/80 dark:text-[#f5f5f5]/90 tabular-nums ${textSize}`} aria-label={`${ageLabel}: ${ageValue}`}>
                  {ageLabel}: {ageValue}
                </span>
              </>
            )}
          </span>
        )}
      </span>
    </span>
  );
}

function dateStrFromDayOfWeek(dayOfWeek) {
  const w = getWeekDates();
  return w?.[dayOfWeek - 1]?.dateStr || '';
}

/** Current week: Monday as first day. For each dayOfWeek 1..7 returns { dateStr, dayNum, year, isToday }. */
function getWeekDates() {
  const tz = MOROCCO_TZ;
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = fmt.formatToParts(new Date());
  const map = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  const yyyy = Number(map.year);
  const mm = Number(map.month);
  const dd = Number(map.day);
  const todayStr = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

  // Compute Morocco day-of-week for "today" (Mon=1..Sun=7) using UTC representation.
  const moroccoTodayUtcNoon = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
  const jsDow = moroccoTodayUtcNoon.getUTCDay(); // 0=Sun..6=Sat
  const dayOfWeek = jsDow === 0 ? 7 : jsDow;
  const toMonday = dayOfWeek === 7 ? -6 : 1 - dayOfWeek;
  const monday = new Date(moroccoTodayUtcNoon);
  monday.setUTCDate(monday.getUTCDate() + toMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const dayNum = d.getUTCDate();
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return { dateStr, dayNum, year: y, isToday: dateStr === todayStr };
  });
}

export default function AdminAvailability() {
  const { t } = useTranslation();
  const days = t('calendar.days', { returnObjects: true });
  const dayLabels = Array.isArray(days) ? days : DAYS;
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [durationMin, setDurationMin] = useState(60);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
  const [createSlot, setCreateSlot] = useState(null);
  const [createCourseForm, setCreateCourseForm] = useState({ professorId: '', studentId: '', date: '', time: '', durationMin: '60' });
  const [createCourseError, setCreateCourseError] = useState('');
  const [createCourseLoading, setCreateCourseLoading] = useState(false);
  const [createdCourse, setCreatedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // New Unified Calendar State
  const [activeTab, setActiveTab] = useState('UNIFIED'); // 'UNIFIED' | 'PER_STUDENT'
  const [unifiedData, setUnifiedData] = useState({ professors: [], students: [] });
  const [unifiedLoading, setUnifiedLoading] = useState(false);
  const [filterProf, setFilterProf] = useState('ALL');
  const [filterStudent, setFilterStudent] = useState('ALL');

  const loadUnified = useCallback(async () => {
    setUnifiedLoading(true);
    try {
      const { data } = await api.get('/admin/unified-availability');
      setUnifiedData(data);
    } catch (err) {
      console.error('Failed to load unified availability', err);
    } finally {
      setUnifiedLoading(false);
    }
  }, []);

  const load = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    Promise.all([
      api.get('/admin/students/availability').then((r) => setStudents(r.data)).catch((err) => {
        setStudents([]);
        setLoadError((e) => e || err.response?.data?.error || t('dashboard.adminAvailability.loadError'));
      }),
      api.get('/admin/professors/availability').then((r) => setProfessors(r.data)).catch((err) => {
        setProfessors([]);
        setLoadError((e) => e || err.response?.data?.error || t('dashboard.adminAvailability.loadError'));
      }),
      loadUnified()
    ]).finally(() => {
      setLoading(false);
      setScheduleRefreshKey((k) => k + 1);
    });
  }, [t, loadUnified]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    // Admin always enters and sends availability in Morocco time (Africa/Casablanca)
    await api.post(`/admin/students/${selectedStudent}/availability`, { ...form });
    setForm({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
    load();
  };

  const handleDeleteSlot = async (studentId, slotId) => {
    await api.delete(`/admin/students/${studentId}/availability/${slotId}`);
    load();
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent) || null;
  const selectedStudentCountry = selectedStudentData?.country || null;
  const selectedStudentCountryName = useMemo(() => {
    const found = COUNTRIES.find((c) => c.code === selectedStudentCountry);
    return found?.name || selectedStudentCountry;
  }, [selectedStudentCountry]);
  const selectedStudentTz = useMemo(
    () => selectedStudentData?.timezone || (selectedStudentCountry ? getTimezoneByCountry(selectedStudentCountry) : null),
    [selectedStudentData?.timezone, selectedStudentCountry]
  );

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return '';
    return `${timeStr} (${formatTimeAMPM(timeStr)})`;
  };

  const getStudentCountryName = (countryCode) => {
    if (!countryCode) return '-';
    const found = COUNTRIES.find((c) => c.code === countryCode);
    return found?.name || countryCode;
  };

  const getStudentLocalSlot = (slot, studentTz) => {
    if (!studentTz) return null;
    const dateStr = dateStrFromDayOfWeek(slot.dayOfWeek);
    const localStart = convertTimeBetweenTimezones(dateStr, slot.startTime, MOROCCO_TZ, studentTz);
    const localEnd = convertTimeBetweenTimezones(dateStr, slot.endTime, MOROCCO_TZ, studentTz);
    if (!localStart || !localEnd) return null;
    return { localStart, localEnd };
  };

  const formatBasicSlot = (slot) => {
    const day = dayLabels[slot.dayOfWeek - 1] || '-';
    return `${day} ${formatSlotTime(slot.startTime)} - ${formatSlotTime(slot.endTime)}`;
  };

  const formatProfessorSlotLocal = (slot) => {
    if (slot.localStartTime != null && slot.localEndTime != null) {
      const day = dayLabels[(slot.localDayOfWeek ?? slot.dayOfWeek) - 1] || '-';
      return `${day} ${formatSlotTime(slot.localStartTime)} - ${formatSlotTime(slot.localEndTime)}`;
    }
    return formatBasicSlot(slot);
  };

  // Reference = UTC (Morocco as UTC+0): use ref* when backend sends them for correct 17:00–06:00 display
  const formatReferenceSlot = (slot) => {
    if (slot.refStartTime != null && slot.refEndTime != null) {
      const startDay = dayLabels[(slot.refDayOfWeek ?? slot.dayOfWeek) - 1] || '-';
      const endDay = slot.refEndDayOfWeek != null ? (dayLabels[slot.refEndDayOfWeek - 1] || '-') : startDay;
      const range = startDay === endDay ? startDay : `${startDay} → ${endDay}`;
      return `${range} ${formatSlotTime(slot.refStartTime)} - ${formatSlotTime(slot.refEndTime)}`;
    }
    return `${dayLabels[slot.dayOfWeek - 1] || '-'} ${formatSlotTime(slot.startTime)} - ${formatSlotTime(slot.endTime)}`;
  };

  const formatStudentLocalSlot = (slot, studentTz) => {
    if (slot.localStartTime != null && slot.localEndTime != null) {
      const day = dayLabels[(slot.localDayOfWeek ?? slot.dayOfWeek) - 1] || '-';
      return `${day} ${formatSlotTime(slot.localStartTime)} - ${formatSlotTime(slot.localEndTime)}`;
    }
    const day = dayLabels[slot.dayOfWeek - 1] || '-';
    const local = getStudentLocalSlot(slot, studentTz);
    if (!local) return `${day} ${formatSlotTime(slot.startTime)} - ${formatSlotTime(slot.endTime)}`;

    const startDayLabel = dayLabels[local.localStart.dayOfWeek - 1] || '-';
    const endDayLabel = dayLabels[local.localEnd.dayOfWeek - 1] || '-';
    const dayRange = startDayLabel === endDayLabel ? startDayLabel : `${startDayLabel} → ${endDayLabel}`;
    return `${dayRange} ${formatSlotTime(local.localStart.time)} - ${formatSlotTime(local.localEnd.time)}`;
  };

  // Weekly calendar: 24h in Référence Maroc — order 1, 2, …, 23, 00 (display as plain hour numbers)
  const hourSlots = [
    ...Array.from({ length: 23 }, (_, i) => `${String(i + 1).padStart(2, '0')}:00`),
    '00:00'
  ];

  // For unified calendar time slots
  const allTimeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const hourLabel = (timeStr) => (timeStr === '00:00' ? '00' : String(parseInt(timeStr, 10)));
  const slotContains = (start, end, timeStr) => {
    if (!start || !end || !timeStr) return false;
    if (start <= end) return timeStr >= start && timeStr < end;
    return timeStr >= start || timeStr < end; // slot crosses midnight
  };
  const slotMatchesCell = (slot, dayOfWeek, timeStr) => {
    const dow = slot.refDayOfWeek ?? slot.dayOfWeek;
    const start = slot.refStartTime ?? slot.startTime;
    const end = slot.refEndTime ?? slot.endTime;
    const endDow = slot.refEndDayOfWeek ?? null;
    if (!start || !end) return false;
    if (endDow == null) return dow === dayOfWeek && slotContains(start, end, timeStr);
    if (dow === dayOfWeek) return timeStr >= start;
    if (endDow === dayOfWeek) return timeStr < end;
    return false;
  };
  const getWeeklyCell = (dayOfWeek, timeStr) => {
    const profs = professors.filter((p) =>
      (p.availability || []).some((s) => slotMatchesCell(s, dayOfWeek, timeStr))
    );
    const studs = students.filter((s) =>
      (s.studentAvailability || []).some((slot) => slotMatchesCell(slot, dayOfWeek, timeStr))
    );
    return { profs, studs };
  };

  const weekDates = getWeekDates();

  const formatNames = (list, max = 2) => {
    if (!list?.length) return '';
    const names = list.slice(0, max).map((x) => x.name).join(', ');
    return list.length > max ? `${names} +${list.length - max}` : names;
  };

  const openCreateCourseModal = (dayOfWeek, timeStr, profs, studs) => {
    if (!profs?.length || !studs?.length) return;
    const dateUtc = dateStrFromDayOfWeek(dayOfWeek);
    const morocco = convertTimeBetweenTimezones(dateUtc, timeStr, REF_TZ, MOROCCO_TZ);
    setCreateSlot({ dayOfWeek, timeStr, date: dateUtc, profs, studs });
    setCreateCourseForm({
      professorId: profs[0]?.id || '',
      studentId: studs[0]?.id || '',
      date: morocco?.date || dateUtc,
      time: morocco?.time || timeStr,
      durationMin: '60',
    });
    setCreateCourseError('');
    setCreatedCourse(null);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!createSlot) return;
    setCreateCourseError('');
    setCreateCourseLoading(true);
    try {
      const { data } = await api.post('/admin/courses', {
        professorId: createCourseForm.professorId,
        studentId: createCourseForm.studentId,
        date: createCourseForm.date,
        time: createCourseForm.time,
        durationMin: createCourseForm.durationMin || 60,
      });
      setCreatedCourse(data);
      load();
    } catch (err) {
      setCreateCourseError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    } finally {
      setCreateCourseLoading(false);
    }
  };

  const handleQuickCreateCourse = async (course) => {
    if (!course?.professorId || !course?.studentId || !course?.date || !course?.time) return;
    if (createCourseLoading) return;

    setCreateCourseError('');
    setCreateCourseLoading(true);
    try {
      const { data } = await api.post('/admin/courses', {
        professorId: course.professorId,
        studentId: course.studentId,
        date: course.date,
        time: course.time,
        durationMin: course.durationMin || durationMin,
      });
      setCreateSlot({ dayOfWeek: 1, timeStr: course.time, date: course.date, profs: [], studs: [] });
      setCreatedCourse(data);
      load();
    } catch (err) {
      setCreateCourseError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    } finally {
      setCreateCourseLoading(false);
    }
  };

  const handleUnifiedOverlapClick = ({ dayOfWeek, time, professors, students }) => {
    const dStr = dateStrFromDayOfWeek(dayOfWeek);
    setCreateSlot({
      dayOfWeek,
      timeStr: time,
      date: dStr,
      profs: professors,
      studs: students,
    });
    setCreateCourseForm({
      professorId: professors[0]?.id || '',
      studentId: students[0]?.id || '',
      date: dStr,
      time,
      durationMin: String(durationMin)
    });
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-2">
          {t('dashboard.adminAvailability.title')}
        </h1>
        <p className="text-text/70 dark:text-[#f5f5f5]/70 text-sm">
          {t('dashboard.adminAvailability.subtitle')}
        </p>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
          <button
            type="button"
            onClick={() => load()}
            className="shrink-0 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/70 text-sm font-medium transition"
          >
            {t('dashboard.adminAvailability.retry') || 'Réessayer'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10">
          <span className="w-5 h-5 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text/70 dark:text-[#f5f5f5]/70">{t('dashboard.adminAvailability.loading') || 'Chargement…'}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-pink-soft/50 dark:border-white/10 mb-6">
        <button
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${activeTab === 'UNIFIED' ? 'text-pink-primary dark:text-pink-400' : 'text-text/60 hover:text-text dark:text-[#f5f5f5]/60 hover:dark:text-[#f5f5f5]'}`}
          onClick={() => setActiveTab('UNIFIED')}
        >
          Calendrier Global
          {activeTab === 'UNIFIED' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-primary dark:bg-pink-400 rounded-t-full" />}
        </button>
        <button
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${activeTab === 'PER_STUDENT' ? 'text-pink-primary dark:text-pink-400' : 'text-text/60 hover:text-text dark:text-[#f5f5f5]/60 hover:dark:text-[#f5f5f5]'}`}
          onClick={() => setActiveTab('PER_STUDENT')}
        >
          Vue par étudiant
          {activeTab === 'PER_STUDENT' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-primary dark:bg-pink-400 rounded-t-full" />}
        </button>
      </div>

      {/* View Content */}
      {activeTab === 'UNIFIED' && (
        <section className="animate-fade-in">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
             <div className="min-w-[240px]">
               <h2 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">Aperçu global de la semaine</h2>
               <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-1">
                 Les blocs couleur ambre/doré indiquent une heure où <strong>au moins un prof et un étudiant</strong> sont disponibles. Cliquez pour créer un cours.
               </p>
             </div>
             
             {/* Filters */}
             <div className="flex items-center gap-4 bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-pink-soft/50 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2">
                   <label className="text-xs text-text/60 dark:text-[#f5f5f5]/60 font-semibold uppercase tracking-wider">Prof</label>
                   <select 
                     value={filterProf} 
                     onChange={e => setFilterProf(e.target.value)}
                     className="px-2 py-1.5 rounded-lg border border-pink-soft/50 dark:border-white/20 bg-transparent text-sm text-text dark:text-[#f5f5f5] max-w-[150px]"
                   >
                     <option value="ALL">Tous</option>
                     {unifiedData.professors.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                   </select>
                </div>
                <div className="w-px h-6 bg-pink-soft/50 dark:bg-white/10" />
                <div className="flex items-center gap-2">
                   <label className="text-xs text-text/60 dark:text-[#f5f5f5]/60 font-semibold uppercase tracking-wider">Élève</label>
                   <select 
                     value={filterStudent} 
                     onChange={e => setFilterStudent(e.target.value)}
                     className="px-2 py-1.5 rounded-lg border border-pink-soft/50 dark:border-white/20 bg-transparent text-sm text-text dark:text-[#f5f5f5] max-w-[150px]"
                   >
                     <option value="ALL">Tous</option>
                     {unifiedData.students.map(s => (
                       <option key={s.id} value={s.id}>{s.name}</option>
                     ))}
                   </select>
                </div>
             </div>
          </div>
          
          <UnifiedAvailabilityCalendar 
             professors={unifiedData.professors}
             students={unifiedData.students}
             dayLabels={dayLabels}
             timeSlots={allTimeSlots}
             filterProf={filterProf}
             filterStudent={filterStudent}
             onOverlapClick={handleUnifiedOverlapClick}
          />
        </section>
      )}

      {activeTab === 'PER_STUDENT' && (
        <section className="mb-8 animate-fade-in space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div className="min-w-[240px]">
              <h2 className="text-lg font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.adminAvailability.weeklyCalendar') || 'Schedule'}</h2>
              <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-1">
                Intelligent matching across timezones (Morocco reference).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-text/60 dark:text-[#f5f5f5]/60 font-semibold">Duration</label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5]"
              >
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
          </div>

          <AdminStudentScheduleMatrix
            selectedStudentId={selectedStudent}
            weekStart={weekDates?.[0]?.dateStr || null}
            weekDates={weekDates}
            dayLabels={dayLabels}
            durationMin={durationMin}
            scheduleRefreshKey={scheduleRefreshKey}
            onCreateCourse={handleQuickCreateCourse}
            studentProfile={selectedStudentData}
          />

          {/* Modal: créer un cours */}
          {createSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => { setCreateSlot(null); setCreatedCourse(null); }}>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-xl max-w-lg w-full p-5 my-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                {createdCourse ? (
                  <div className="flex flex-col items-center text-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text dark:text-[#f5f5f5] text-lg">Cours créé avec succès</h3>
                      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-1">
                        {createdCourse.professor?.name} → {createdCourse.student?.name} · {createdCourse.date} à {createdCourse.time}
                      </p>
                    </div>

                    <div className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
                        </svg>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Salle vidéo JaaS (8x8) — générée automatiquement</span>
                      </div>
                      <p className="text-[11px] text-blue-600/80 dark:text-blue-300/80 mb-3">
                        Le professeur et l'élève accèdent à cette salle depuis leur tableau de bord. Aucun lien à partager manuellement.
                      </p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={`${window.location.origin}/live?courseId=${createdCourse.id}`}
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-[#111] text-xs text-text dark:text-[#f5f5f5] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/live?courseId=${createdCourse.id}`)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-700/50 transition"
                        >
                          Copier
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setCreateSlot(null); setCreatedCourse(null); }}
                      className="w-full px-4 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.adminCourses.createCourse')}</h3>
                        <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">
                          {dayLabels[createSlot.dayOfWeek - 1]} {createSlot.timeStr} — {t('dashboard.adminAvailability.slotMoroccoRef')}
                        </p>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/60 dark:border-blue-700/50">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
                        </svg>
                        Vidéo JaaS auto
                      </span>
                    </div>

                    <form onSubmit={handleCreateCourse} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.admin.professor')}</label>
                          <select
                            className="w-full rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] px-3 py-2 text-sm text-text dark:text-[#f5f5f5]"
                            value={createCourseForm.professorId}
                            onChange={(e) => setCreateCourseForm((f) => ({ ...f, professorId: e.target.value }))}
                            required
                          >
                            {createSlot.profs.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.admin.student')}</label>
                          <select
                            className="w-full rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] px-3 py-2 text-sm text-text dark:text-[#f5f5f5]"
                            value={createCourseForm.studentId}
                            onChange={(e) => setCreateCourseForm((f) => ({ ...f, studentId: e.target.value }))}
                            required
                          >
                            {createSlot.studs.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[11px] text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.adminCourses.dateTimeMoroccoHint')}</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.admin.date')}</label>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] px-3 py-2 text-sm text-text dark:text-[#f5f5f5]"
                            value={createCourseForm.date}
                            onChange={(e) => setCreateCourseForm((f) => ({ ...f, date: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminCourses.time')}</label>
                          <input
                            type="time"
                            className="w-full rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] px-3 py-2 text-sm text-text dark:text-[#f5f5f5]"
                            value={createCourseForm.time}
                            onChange={(e) => setCreateCourseForm((f) => ({ ...f, time: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminCourses.duration')}</label>
                          <select
                            className="w-full rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] px-3 py-2 text-sm text-text dark:text-[#f5f5f5]"
                            value={createCourseForm.durationMin}
                            onChange={(e) => setCreateCourseForm((f) => ({ ...f, durationMin: e.target.value }))}
                          >
                            {[30, 45, 60, 90, 120].map((m) => (
                              <option key={m} value={m}>{m} min</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminCourses.endTime')}</label>
                          <div className="w-full px-3 py-2 rounded-lg bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10 text-sm text-text dark:text-[#f5f5f5]">
                            {createCourseForm.time ? `${formatTimeAMPM(createCourseForm.time)} – ${formatTimeAMPM(getEndTime(createCourseForm.time, createCourseForm.durationMin))}` : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/40">
                        <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                          La salle vidéo est générée automatiquement via <strong>Jitsi JaaS (8x8)</strong>. Le professeur et l'élève la rejoignent depuis leur tableau de bord — aucun lien à copier-coller.
                        </p>
                      </div>

                      {createCourseError && <p className="text-sm text-red-600 dark:text-red-400">{createCourseError}</p>}
                      <div className="flex gap-2 pt-1">
                        <button type="button" className="px-4 py-2 rounded-lg border border-pink-soft/50 dark:border-white/20 text-sm text-text dark:text-[#f5f5f5]" onClick={() => { setCreateSlot(null); setCreatedCourse(null); }}>
                          {t('dashboard.adminStudents.cancel')}
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-pink-500 dark:bg-pink-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-pink-600 transition" disabled={createCourseLoading}>
                          {createCourseLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Création…
                            </span>
                          ) : t('dashboard.adminCourses.create')}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
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
                  <div className="rounded-xl border border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5 px-3 py-2.5">
                    <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">
                      {t('dashboard.adminAvailability.studentCountry')}:
                      <span className="ml-1 font-medium text-text dark:text-[#f5f5f5]">{selectedStudentCountryName || '-'}</span>
                    </p>
                    <p className="text-[11px] text-text/50 dark:text-[#f5f5f5]/50 mt-0.5">
                      {t('dashboard.adminAvailability.timezone')}: {selectedStudentTz || '-'}
                    </p>
                  </div>
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
                  <p className="text-[11px] text-text/50 dark:text-[#f5f5f5]/50 -mt-1">
                    {t('dashboard.adminAvailability.slotInputHint')}
                  </p>
                  <div className="space-y-2">
                    <span className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                      {t('dashboard.adminAvailability.currentSlots')}:
                    </span>
                    <div className="space-y-2">
                      {(selectedStudentData?.studentAvailability || []).map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-400/30 animate-fade-in"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold">{t('dashboard.adminAvailability.slotLocalLabel')}: {formatStudentLocalSlot(slot, selectedStudentTz)}</p>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-100/80 mt-0.5">
                              {t('dashboard.adminAvailability.slotMoroccoRef')}: {formatReferenceSlot(slot)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(selectedStudent, slot.id)}
                            className="text-red-600 dark:text-red-400 hover:underline text-xs shrink-0"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
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
              <div className="p-4 border-t border-pink-soft/50 dark:border-white/10 space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide">
                <h3 className="text-sm font-semibold text-text dark:text-[#f5f5f5]">
                  {t('dashboard.adminAvailability.allStudentsAvailability')}
                </h3>
                {students.length === 0 ? (
                  <p className="text-sm text-text/60 dark:text-[#f5f5f5]/70">
                    {t('dashboard.adminAvailability.noStudents')}
                  </p>
                ) : (
                  students.map((student, idx) => {
                    const studentTz = student?.timezone || (student?.country ? getTimezoneByCountry(student.country) : null);
                    const slots = student?.studentAvailability || [];
                    return (
                      <div
                        key={student.id}
                        className="p-3 rounded-xl border border-pink-soft/40 dark:border-white/10 bg-pink-soft/15 dark:bg-white/5 hover:bg-pink-soft/25 dark:hover:bg-white/10 transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-sm font-semibold text-text dark:text-[#f5f5f5] truncate">{student.name}</p>
                          <span className="text-[11px] text-text/50 dark:text-[#f5f5f5]/60 shrink-0">
                            {getStudentCountryName(student.country)}
                          </span>
                        </div>
                        <p className="text-[11px] text-text/50 dark:text-[#f5f5f5]/60 mb-2">
                          {t('dashboard.adminAvailability.timezone')}: {studentTz || '-'}
                        </p>
                        {slots.length === 0 ? (
                          <p className="text-xs text-text/50 dark:text-[#f5f5f5]/60 italic">
                            {t('dashboard.adminAvailability.noSlots')}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {slots.map((slot) => (
                              <div key={`${student.id}-${slot.id}`} className="rounded-lg bg-emerald-100/70 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-400/25 px-2.5 py-2">
                                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                                  {t('dashboard.adminAvailability.slotLocalLabel')}: {formatStudentLocalSlot(slot, studentTz)}
                                </p>
                                <p className="text-[10px] text-emerald-700/85 dark:text-emerald-100/80 mt-0.5">
                                  {t('dashboard.adminAvailability.slotMoroccoRef')}: {formatReferenceSlot(slot)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-all duration-500 hover:shadow-pink-soft/80 dark:hover:shadow-[0_8px_30px_rgba(244,114,182,0.08)]">
              <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
                <h2 className="font-semibold text-text dark:text-[#f5f5f5] flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-pink-primary dark:bg-pink-400" />
                  {t('dashboard.adminAvailability.professorAvailability')}
                </h2>
                <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70 mt-1.5">
                  {t('dashboard.adminAvailability.professorSlotsMoroccoHint')}
                </p>
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
                    <div className="space-y-2">
                      {(p.availability || []).map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-lg bg-pink-soft/40 dark:bg-pink-500/15 border border-pink-soft/50 dark:border-pink-400/25 px-2.5 py-2"
                        >
                          <p className="text-[11px] font-semibold text-pink-dark dark:text-pink-300">
                            {t('dashboard.adminAvailability.professorSlotLocalLabel')}: {formatProfessorSlotLocal(slot)}
                          </p>
                          <p className="text-[10px] text-pink-dark/80 dark:text-pink-300/80 mt-0.5">
                            {t('dashboard.adminAvailability.slotMoroccoRefProfessor')}: {slot.refStartTime != null && slot.refEndTime != null ? formatReferenceSlot(slot) : `${dayLabels[slot.dayOfWeek - 1] || '-'} ${formatSlotTime(slot.startTime)} - ${formatSlotTime(slot.endTime)}`}
                          </p>
                        </div>
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
        </section>
      )}
    </div>
  );
}
