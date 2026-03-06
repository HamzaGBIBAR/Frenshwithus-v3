import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import COUNTRIES, { convertTimeBetweenTimezones, getTimezoneByCountry } from '../../utils/countries';
import { formatTimeAMPM } from '../../utils/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOROCCO_TZ = 'Africa/Casablanca';

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

  // Weekly calendar: 24h in Référence Maroc (UTC) — use ref* when present so grid matches "Référence Maroc"
  const hourSlots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
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
        <div className="p-4 overflow-auto max-h-[480px]">
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <thead className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-pink-soft/50 dark:border-white/10 shadow-sm">
              <tr>
                <th className="text-left py-2.5 px-2 font-semibold text-text/80 dark:text-[#f5f5f5]/90 w-14 shrink-0">
                  <span className="block">{t('dashboard.adminAvailability.time')}</span>
                  <span className="block text-[10px] font-normal text-amber-600 dark:text-amber-400 mt-0.5">{t('dashboard.adminAvailability.slotMoroccoRef')}</span>
                </th>
                {dayLabels.map((d, i) => (
                  <th key={i} className="py-2.5 px-2 font-semibold text-text dark:text-[#f5f5f5] text-center min-w-[72px]">{d}</th>
                ))}
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
                    <td className="py-2 px-2 text-text/70 dark:text-[#f5f5f5]/70 font-mono text-xs w-14 shrink-0 align-middle">{timeStr}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
                      const { profs, studs } = getWeeklyCell(dayOfWeek, timeStr);
                      const hasBoth = profs.length > 0 && studs.length > 0;
                      return (
                        <td key={dayOfWeek} className="py-1.5 px-2 align-middle min-w-[72px]">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {profs.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-pink-100 dark:bg-pink-500/30 text-pink-800 dark:text-pink-200 border border-pink-200/50 dark:border-pink-400/30" title={profs.map((p) => p.name).join(', ')}>
                                {profs.length}P
                              </span>
                            )}
                            {studs.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-400/30" title={studs.map((s) => s.name).join(', ')}>
                                {studs.length}E
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
            P = {t('dashboard.adminAvailability.professorAvailability').toLowerCase()}, E = {t('dashboard.adminAvailability.studentAvailability').toLowerCase()}. {t('dashboard.adminAvailability.weeklyCalendarHint')}.
          </p>
        </div>
      </section>

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
