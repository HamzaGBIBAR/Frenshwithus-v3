import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import COUNTRIES, { convertTimeBetweenTimezones, getTimezoneByCountry } from '../../utils/countries';
const REF_TZ = 'UTC';
import { formatTimeAMPM, getEndTime } from '../../utils/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOROCCO_TZ = 'Africa/Casablanca';

/** Small avatar for planning grid: profile picture or initial, name, and age. Age always shown with label (e.g. "Age: 12"). */
function PlanningAvatar({ user, size = 20, showName = true, showAge = true, alwaysShowAgeSlot = false, ageLabel = 'Age', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : '?';
  const hasAge = showAge && user?.age != null && Number.isFinite(Number(user.age));
  const showAgeSlot = showAge && (alwaysShowAgeSlot || hasAge);
  const ageValue = hasAge ? String(user.age) : '—';
  const title = showAge ? `${user?.name || ''}, ${ageLabel}: ${ageValue}` : user?.name;
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`} title={title}>
      <span
        className="shrink-0 rounded-full overflow-hidden bg-pink-soft/40 dark:bg-white/20 flex items-center justify-center text-[10px] font-semibold text-pink-800 dark:text-pink-200"
        style={{ width: size, height: size }}
      >
        {user?.avatarUrl && !imgError ? (
          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          initial
        )}
      </span>
      {showName && (
        <>
          <span className="truncate text-[11px] min-w-0">{user?.name || '—'}</span>
          {showAgeSlot && (
            <span className="shrink-0 text-[11px] text-text/80 dark:text-[#f5f5f5]/90 font-medium" aria-label={ageLabel}>
              {ageLabel}: {ageValue}
            </span>
          )}
        </>
      )}
    </span>
  );
}

function dateStrFromDayOfWeek(dayOfWeek) {
  const targetJsDay = dayOfWeek === 7 ? 0 : dayOfWeek; // 1..7 (Mon..Sun) -> JS day
  const d = new Date();
  const diff = (targetJsDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Current week: Monday as first day. For each dayOfWeek 1..7 returns { dateStr, dayNum, year, isToday }. */
function getWeekDates() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const day = today.getDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + toMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return { dateStr, dayNum: d.getDate(), year: yyyy, isToday: dateStr === todayStr };
  });
}

export default function AdminAvailability() {
  const { t } = useTranslation();
  const days = t('calendar.days', { returnObjects: true });
  const dayLabels = Array.isArray(days) ? days : DAYS;
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
  const [createSlot, setCreateSlot] = useState(null);
  const [createCourseForm, setCreateCourseForm] = useState({ professorId: '', studentId: '', date: '', time: '', durationMin: '60', meetingLink: '' });
  const [createCourseError, setCreateCourseError] = useState('');
  const [createCourseLoading, setCreateCourseLoading] = useState(false);

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
      meetingLink: '',
    });
    setCreateCourseError('');
  };

  const generateJitsiRoomLink = () => {
    const base = 'https://meet.jit.si';
    const datePart = createCourseForm.date || 'cours';
    const timePart = (createCourseForm.time || '').replace(':', '-') || '00-00';
    const slug = `frenchwithus-${datePart}-${timePart}-${Math.random().toString(36).slice(2, 6)}`;
    setCreateCourseForm((f) => ({ ...f, meetingLink: `${base}/${slug}` }));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!createSlot) return;
    setCreateCourseError('');
    setCreateCourseLoading(true);
    try {
      await api.post('/admin/courses', {
        professorId: createCourseForm.professorId,
        studentId: createCourseForm.studentId,
        date: createCourseForm.date,
        time: createCourseForm.time,
        meetingLink: createCourseForm.meetingLink || undefined,
        durationMin: createCourseForm.durationMin || 60,
      });
      setCreateSlot(null);
      load();
    } catch (err) {
      setCreateCourseError(err.response?.data?.error || t('dashboard.adminCourses.errorCreate'));
    } finally {
      setCreateCourseLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">
        {t('dashboard.adminAvailability.title')}
      </h1>
      <p className="text-text/70 dark:text-[#f5f5f5]/70 text-sm mb-6">
        {t('dashboard.adminAvailability.subtitle')}
      </p>

      {/* Weekly calendar: 24h, Morocco time — P = profs, E = students */}
      <section className="mb-8 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden">
        <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-text dark:text-[#f5f5f5] flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-pink-primary dark:bg-pink-400" />
              {t('dashboard.adminAvailability.weeklyCalendar')}
            </h2>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-400/30">
              {t('dashboard.adminAvailability.slotMoroccoRef')}
            </span>
          </div>
          <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-1">
            {t('dashboard.adminAvailability.weeklyCalendarHint')}
          </p>
        </div>
        <div className="p-4 overflow-x-auto overflow-y-auto max-h-[480px] max-w-full">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-pink-soft/50 dark:border-white/10 shadow-sm">
              <tr>
                <th className="text-left py-2.5 px-2 font-semibold text-text/80 dark:text-[#f5f5f5]/90 w-20 shrink-0">
                  <span className="block">{t('dashboard.adminAvailability.time')}</span>
                  <span className="block text-[10px] font-normal text-amber-600 dark:text-amber-400 mt-0.5">{t('dashboard.adminAvailability.slotMoroccoRef')}</span>
                </th>
                {dayLabels.map((d, i) => {
                  const w = weekDates[i];
                  const isToday = w?.isToday;
                  return (
                    <th
                      key={i}
                      className={`py-2.5 px-2 font-semibold text-center min-w-[72px] ${isToday ? 'bg-pink-500/20 dark:bg-pink-500/25 text-pink-dark dark:text-pink-200 ring-2 ring-inset ring-pink-400/50 dark:ring-pink-400/40' : 'text-text dark:text-[#f5f5f5]'}`}
                    >
                      <span className="block">{d}</span>
                      <span className="block text-xs font-normal mt-0.5">{w ? `${w.dayNum}` : ''}</span>
                      <span className="block text-[10px] font-normal opacity-80">{w ? w.year : ''}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hourSlots.map((timeStr) => {
                const hour = parseInt(timeStr, 10);
                const isNight = hour >= 0 && hour < 6;
                return (
                  <tr
                    key={timeStr}
                    className={`border-b border-pink-soft/20 dark:border-white/5 hover:bg-pink-soft/10 dark:hover:bg-white/5 ${isNight ? 'bg-pink-soft/5 dark:bg-white/[0.02]' : ''}`}
                  >
                    <td className="py-2 px-2 text-text/70 dark:text-[#f5f5f5]/70 font-mono text-xs w-20 shrink-0 align-middle" title={timeStr}>{hourLabel(timeStr)}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
                      const { profs, studs } = getWeeklyCell(dayOfWeek, timeStr);
                      const hasBoth = profs.length > 0 && studs.length > 0;
                      const isTodayCol = weekDates[dayOfWeek - 1]?.isToday;
                      return (
                        <td
                          key={dayOfWeek}
                          className={`py-1.5 px-2 align-middle min-w-[72px] ${isTodayCol ? 'bg-pink-500/10 dark:bg-pink-500/10' : ''} ${hasBoth ? 'cursor-pointer hover:bg-pink-soft/20 dark:hover:bg-pink-400/10' : ''}`}
                          onClick={() => hasBoth && openCreateCourseModal(dayOfWeek, timeStr, profs, studs)}
                          title={hasBoth ? t('dashboard.adminAvailability.clickToCreateCourse') : undefined}
                        >
                          <div className="flex flex-col gap-1 justify-center">
                            {profs.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-pink-100 dark:bg-pink-500/30 text-pink-800 dark:text-pink-200 border border-pink-200/50 dark:border-pink-400/30 flex-wrap">
                                <span className="shrink-0 font-semibold">P:</span>
                                {profs.slice(0, 3).map((p) => (
                                  <PlanningAvatar key={p.id} user={p} size={18} showName={true} showAge={true} ageLabel={t('dashboard.adminReservations.age')} className="max-w-[100px]" />
                                ))}
                                {profs.length > 3 && <span className="text-[10px] opacity-80">+{profs.length - 3}</span>}
                              </span>
                            )}
                            {studs.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-400/30 flex-wrap">
                                <span className="shrink-0 font-semibold">E:</span>
                                {studs.slice(0, 3).map((s) => (
                                  <PlanningAvatar key={s.id} user={s} size={18} showName={true} showAge={true} alwaysShowAgeSlot={true} ageLabel={t('dashboard.adminReservations.age')} className="max-w-[100px]" />
                                ))}
                                {studs.length > 3 && <span className="text-[10px] opacity-80">+{studs.length - 3}</span>}
                              </span>
                            )}
                            {profs.length === 0 && studs.length === 0 && (
                              <span className="text-[11px] text-text/40 dark:text-[#f5f5f5]/40">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11px] text-text/50 dark:text-[#f5f5f5]/50 mt-3 sticky bottom-0 bg-white dark:bg-[#1a1a1a] pt-2">
            P = {t('dashboard.adminAvailability.professorAvailability').toLowerCase()}, E = {t('dashboard.adminAvailability.studentAvailability').toLowerCase()}. {t('dashboard.adminAvailability.weeklyCalendarHint')}. {createSlot === null && t('dashboard.adminAvailability.clickToCreateCourseHint')}
          </p>
        </div>
      </section>

      {/* Modal: créer un cours (mêmes options que la section Cours) */}
      {createSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setCreateSlot(null)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-xl max-w-lg w-full p-5 my-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text dark:text-[#f5f5f5] mb-1">{t('dashboard.adminCourses.createCourse')}</h3>
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-4">
              {dayLabels[createSlot.dayOfWeek - 1]} {createSlot.timeStr} — {t('dashboard.adminAvailability.slotMoroccoRef')}
            </p>
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
              <div>
                <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.adminCourses.meetingLink')}</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    placeholder="https://meet.jit.si/francais-a1-2026"
                    className="flex-1 min-w-[180px] rounded-lg border border-pink-soft/50 dark:border-white/20 bg-white dark:bg-[#2a2a2a] px-3 py-2 text-sm text-text dark:text-[#f5f5f5]"
                    value={createCourseForm.meetingLink}
                    onChange={(e) => setCreateCourseForm((f) => ({ ...f, meetingLink: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={generateJitsiRoomLink}
                    className="px-3 py-2 rounded-lg border border-pink-primary dark:border-pink-400 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 text-sm whitespace-nowrap"
                  >
                    {t('dashboard.adminCourses.generateJitsiRoom')}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.adminCourses.meetingLinkHelp')}</p>
              </div>
              {createCourseError && <p className="text-sm text-red-600 dark:text-red-400">{createCourseError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-lg border border-pink-soft/50 dark:border-white/20 text-sm" onClick={() => setCreateSlot(null)}>
                  {t('dashboard.adminStudents.cancel')}
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-pink-500 dark:bg-pink-500 text-white text-sm font-medium disabled:opacity-50" disabled={createCourseLoading}>
                  {createCourseLoading ? '...' : t('dashboard.adminCourses.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        {/* Professor availability: teacher local time + Morocco reference (e.g. 9h Paris → 8h Maroc) */}
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
    </div>
  );
}
