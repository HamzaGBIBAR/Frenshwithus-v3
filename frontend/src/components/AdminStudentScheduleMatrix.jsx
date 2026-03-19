import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const STATUS_META = {
  green: { label: 'Perfect match', bg: 'bg-emerald-100/80 dark:bg-emerald-500/15', ring: 'ring-emerald-500/30', dot: 'bg-emerald-500' },
  orange: { label: 'Partial overlap', bg: 'bg-amber-100/80 dark:bg-amber-500/15', ring: 'ring-amber-500/30', dot: 'bg-amber-500' },
  red: { label: 'No match', bg: 'bg-red-100/60 dark:bg-red-500/10', ring: 'ring-red-500/20', dot: 'bg-red-500' },
};

function Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  const base =
    variant === 'secondary'
      ? 'px-3 py-1.5 rounded-lg border border-pink-soft/50 dark:border-white/20 text-sm text-text dark:text-[#f5f5f5]'
      : 'px-3 py-1.5 rounded-lg bg-pink-500 dark:bg-pink-400 text-white text-sm font-medium hover:bg-pink-600 dark:hover:bg-pink-500 transition disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${className}`}>
      {children}
    </button>
  );
}

function StatusPill({ status, exact }) {
  const meta = STATUS_META[status] || STATUS_META.red;
  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium ${meta.bg} ring-1 ${meta.ring}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
      <span>
        {status === 'green' ? 'Green' : status === 'orange' ? 'Orange' : 'Red'}
        {exact ? <span className="ml-1 text-[10px] font-semibold text-pink-primary">★</span> : null}
      </span>
    </span>
  );
}

export default function AdminStudentScheduleMatrix({
  selectedStudentId,
  weekStart,
  weekDates,
  dayLabels,
  durationMin,
  scheduleRefreshKey,
  onCreateCourse,
  studentProfile,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedStudentId || !weekStart) return;
      setLoading(true);
      setError('');
      setData(null);
      try {
        const r = await api.get('/admin/matches/student-schedule', {
          params: { studentId: selectedStudentId, weekStart, durationMin },
        });
        if (!cancelled) setData(r.data || null);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || 'Failed to load schedule');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, weekStart, durationMin, scheduleRefreshKey]);

  const professors = data?.professors || [];
  const gridByTeacher = data?.gridByTeacher || {};
  const timeSlots = data?.timeSlots || [];
  const topMatches = data?.topMatches || [];

  const dayDateMap = useMemo(() => {
    const map = {};
    for (let i = 0; i < (weekDates || []).length; i += 1) {
      const entry = weekDates[i];
      map[i + 1] = entry?.dateStr;
    }
    return map;
  }, [weekDates]);

  if (!selectedStudentId) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-4">
        <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70">{t('dashboard.adminAvailability.selectStudent')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected student profile (image + age) */}
      {studentProfile ? (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 rounded-full overflow-hidden bg-pink-soft/20 ring-2 ring-white/50 dark:ring-white/10"
              style={{ width: 48, height: 48 }}
            >
              {studentProfile.avatarUrl ? (
                <img src={studentProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pink-primary dark:text-pink-400 font-bold">
                  {(studentProfile.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text dark:text-[#f5f5f5] truncate">
                {studentProfile.name || 'Student'}
              </p>
              <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">
                Age: <span className="font-semibold text-text dark:text-[#f5f5f5]">{studentProfile.age ?? '—'}</span>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-xs font-semibold ring-1 ring-emerald-500/20">
            Green = perfect match
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-100/70 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 text-xs font-semibold ring-1 ring-amber-500/20">
            Orange = partial overlap
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-100/60 dark:bg-red-500/10 text-red-800 dark:text-red-200 text-xs font-semibold ring-1 ring-red-500/15">
            Red = no match
          </span>
        </div>
        <div className="text-xs text-text/60 dark:text-[#f5f5f5]/60">
          Duration: <span className="font-semibold text-text dark:text-[#f5f5f5]">{durationMin} min</span>
        </div>
      </div>

      {/* Suggestions */}
      <section className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden">
        <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
          <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.adminAvailability.topMatches', 'Top available matches')}</h3>
          <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-1">
            Pick one and the course will be created automatically in Morocco time.
          </p>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text/70 dark:text-[#f5f5f5]/70">Loading…</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : topMatches.length === 0 ? (
            <div className="text-sm text-text/60 dark:text-[#f5f5f5]/60">No suggested slots found.</div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {topMatches.map((m) => (
                <div key={`${m.professorId}-${m.dayOfWeekMorocco}-${m.time}`} className="rounded-xl border border-pink-soft/40 dark:border-white/10 bg-pink-soft/15 dark:bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text dark:text-[#f5f5f5] truncate">{m.professorName}</p>
                      <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-1">
                        {dayLabels?.[m.dayOfWeekMorocco - 1] || ''} · {m.time} — {dayDateMap[m.dayOfWeekMorocco] || m.course?.date}
                      </p>
                      <div className="mt-2">
                        <StatusPill status={m.status} exact={m.exact} />
                      </div>
                      <p className="text-[11px] text-text/50 dark:text-[#f5f5f5]/50 mt-2">
                        Frequency: <span className="font-semibold">{m.frequencyDays}</span> day(s) with green matches in this week.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button
                        onClick={() => onCreateCourse?.(m.course)}
                        disabled={m.status !== 'green' || m.course == null}
                      >
                        {m.status === 'green' ? 'Create Course' : 'Unavailable'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Matrix */}
      <section className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden">
        <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
          <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.adminAvailability.scheduleMatrixTitle', 'Schedule matrix')}</h3>
          <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-1">
            One-week calendar: rows = Morocco time slots, columns = (day x teachers). Minimal vertical scrolling.
          </p>
        </div>

        <div className="p-4 overflow-x-auto">
          {loading && !data ? (
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text/70 dark:text-[#f5f5f5]/70">Building grid…</span>
            </div>
          ) : (
            <>
              {(() => {
                const weekDays = Array.from({ length: 7 }, (_, i) => i + 1);
                const columns = weekDays.flatMap((dayOfWeek) =>
                  professors.map((p) => ({
                    dayOfWeek,
                    dateStr: dayDateMap[dayOfWeek] || '',
                    professor: p,
                  }))
                );

                // Rough estimate: Time col (4rem) + per cell col width.
                const minWidth = 200 + columns.length * 92;

                return (
                  <div style={{ minWidth }}>
                    <table className="w-full text-sm border-collapse table-fixed">
                      <thead>
                        <tr className="bg-pink-soft/15 dark:bg-white/5">
                          <th
                            className="sticky left-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-pink-soft/50 dark:border-white/10 px-2 py-2 w-16 text-left text-xs font-semibold text-text/70 dark:text-[#f5f5f5]/70"
                          >
                            Time
                          </th>
                          {weekDays.map((dayOfWeek) => (
                            <th
                              key={`day-${dayOfWeek}`}
                              colSpan={professors.length}
                              className="border-b border-pink-soft/50 dark:border-white/10 px-2 py-2 text-left"
                            >
                              <div className="font-semibold text-text dark:text-[#f5f5f5] text-xs">
                                {dayLabels?.[dayOfWeek - 1] || ''}
                                <span className="ml-2 font-normal text-[10px] text-text/50 dark:text-[#f5f5f5]/50">
                                  {dayDateMap[dayOfWeek] || ''}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-white/20 dark:bg-black/10">
                          <th className="sticky left-0 z-10 bg-white dark:bg-[#1a1a1a] px-2 py-1.5" />
                          {columns.map((c, idx) => (
                            <th
                              key={`${c.dayOfWeek}-${c.professor.id}-${idx}`}
                              className="border-b border-pink-soft/50 dark:border-white/10 px-2 py-1.5 text-left"
                              style={{ width: 92 }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text dark:text-[#f5f5f5] truncate max-w-[80px]">{c.professor.name}</span>
                                {c.professor.assigned ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 font-semibold">
                                    Assigned
                                  </span>
                                ) : null}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((timeStr) => (
                          <tr key={timeStr} className="border-b border-pink-soft/20 dark:border-white/5 hover:bg-pink-soft/10 dark:hover:bg-white/5">
                            <td className="sticky left-0 bg-white dark:bg-[#1a1a1a] z-10 px-2 py-1.5 text-xs text-text/70 dark:text-[#f5f5f5]/70 font-mono">
                              {timeStr}
                            </td>
                            {columns.map((c, idx) => {
                              const p = c.professor;
                              const dayOfWeek = c.dayOfWeek;
                              const dateStr = c.dateStr;
                              const cell = gridByTeacher?.[p.id]?.[dayOfWeek]?.[timeStr];
                              const status = cell?.status || 'red';
                              const exact = !!cell?.exact;
                              const busy = !!cell?.busy;
                              const meta = STATUS_META[status] || STATUS_META.red;
                              const canCreate = status === 'green' && !busy;

                              return (
                                <td
                                  key={`${timeStr}-${p.id}-${dayOfWeek}-${idx}`}
                                  className={`px-2 py-1.5 align-top ${canCreate ? 'cursor-pointer' : ''}`}
                                  onClick={(e) => {
                                    if (e?.target?.closest?.('button')) return;
                                    if (!canCreate) return;
                                    onCreateCourse?.({
                                      professorId: p.id,
                                      studentId: selectedStudentId,
                                      date: dateStr,
                                      time: timeStr,
                                      durationMin,
                                    });
                                  }}
                                >
                                  <div className={`min-h-[56px] rounded-lg ${meta.bg} ring-1 ${meta.ring} p-2 flex flex-col gap-2`} style={{ width: 92 }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} title={meta.label} />
                                      {exact ? (
                                        <span className="text-[10px] font-semibold text-pink-primary" title="Exact overlap">
                                          ★
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-semibold text-text/80 dark:text-[#f5f5f5]/80">
                                        {status === 'green' ? '✓' : status === 'orange' ? '~' : '×'}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={!canCreate}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                                          canCreate
                                            ? 'bg-pink-500 text-white hover:bg-pink-600'
                                            : 'bg-white/20 text-text/40 dark:text-[#f5f5f5]/30 cursor-not-allowed'
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCreateCourse?.({
                                            professorId: p.id,
                                            studentId: selectedStudentId,
                                            date: dateStr,
                                            time: timeStr,
                                            durationMin,
                                          });
                                        }}
                                      >
                                        Create
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

