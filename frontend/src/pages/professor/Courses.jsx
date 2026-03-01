import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAMPM } from '../../utils/format';
import { getCalendarStyle, getWeekCourseCardClass } from '../../utils/calendarStyles';

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]; // Mon=1, Sun=7

function getCourseStatus(course) {
  if (course.endReason === 'professor_absent') return 'professor_absent';
  const now = new Date();
  const d = new Date(`${course.date}T${course.time}`);
  const twoHours = 2 * 60 * 60 * 1000;
  const fifteenMin = 15 * 60 * 1000;

  if (course.sessionEnded) return 'completed';
  if (course.isStarted && d <= now && now - d < twoHours) return 'live';
  // Heure passée mais prof n'a pas démarré : garder "upcoming" pendant 15 min pour permettre de démarrer
  if (d < now && !course.isStarted) {
    if (now - d < fifteenMin) return 'upcoming';
    return 'professor_absent';
  }
  return 'upcoming';
}

const LOCALE_MAP = { fr: 'fr-FR', en: 'en-US', ar: 'ar-SA', zh: 'zh-CN' };

export default function ProfessorCourses() {
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language] || 'fr-FR';
  const DAYS = t('dashboard.professor.days', { returnObjects: true });
  const [courses, setCourses] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
  const [editingLink, setEditingLink] = useState(null);
  const [linkValue, setLinkValue] = useState('');
  const [recordingFor, setRecordingFor] = useState(null);
  const [recordingValue, setRecordingValue] = useState('');
  const [viewMode, setViewMode] = useState('mois');
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [dayViewDate, setDayViewDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [allProfsAvailability, setAllProfsAvailability] = useState([]);
  const [showOtherProfs, setShowOtherProfs] = useState(true);
  const [calendarStyle, setCalendarStyle] = useState(getCalendarStyle);
  const [now, setNow] = useState(() => new Date());
  const weekViewRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = () => setCalendarStyle(getCalendarStyle());
    window.addEventListener('storage', handler);
    window.addEventListener('calendarStyleChanged', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('calendarStyleChanged', handler);
    };
  }, []);

  const load = () => {
    api.get('/professor/courses').then((r) => setCourses(r.data));
    api.get('/professor/availability').then((r) => setAvailability(r.data));
    api.get('/professor/planning/availability-all').then((r) => setAllProfsAvailability(r.data)).catch(() => setAllProfsAvailability([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    await api.post('/professor/availability', form);
    setForm({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
    load();
  };

  const handleRemoveAvailability = async (id) => {
    await api.delete(`/professor/availability/${id}`);
    load();
  };

  const saveMeetingLink = async (id) => {
    await api.put(`/professor/courses/${id}/meeting-link`, { meetingLink: linkValue });
    setEditingLink(null);
    setLinkValue('');
    load();
  };

  const saveRecording = async (id) => {
    await api.put(`/professor/courses/${id}/recording`, { recordingLink: recordingValue });
    setRecordingFor(null);
    setRecordingValue('');
    load();
  };

  const openEditLink = (c) => {
    setEditingLink(c.id);
    setLinkValue(c.meetingLink || '');
  };

  const openRecording = (c) => {
    setRecordingFor(c.id);
    setRecordingValue(c.recordingLink || '');
  };

  const toDateStrLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = toDateStrLocal(new Date());

  // Convert dayOfWeek (1=Mon..7=Sun) to JS getDay() (0=Sun, 1=Mon..6=Sat)
  const toJsDay = (dow) => (dow === 7 ? 0 : dow);

  const availabilityEvents = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setMonth(rangeStart.getMonth() - 2);
    const rangeEnd = new Date();
    rangeEnd.setMonth(rangeEnd.getMonth() + 12); // 12 mois pour afficher la dispo au-delà de juin
    const evts = [];
    for (const prof of allProfsAvailability) {
      const isMe = prof.id === user?.id;
      const type = isMe ? 'my-availability' : 'other-availability';
      for (const slot of prof.availability || []) {
        const d = new Date(rangeStart.getTime());
        const end = new Date(rangeEnd.getTime());
        while (d <= end) {
          if (d.getDay() === toJsDay(slot.dayOfWeek)) {
            evts.push({
              id: `av-${prof.id}-${slot.id}-${toDateStrLocal(d)}`,
              date: toDateStrLocal(d),
              time: slot.startTime,
              title: isMe ? t('dashboard.professor.myAvailabilityShort') : `${prof.name}`,
              type,
            });
          }
          d.setDate(d.getDate() + 1);
        }
      }
    }
    return evts;
  }, [allProfsAvailability, user?.id]);

  const courseEvents = courses.map((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    const isPast = d < new Date();
    return {
      id: c.id,
      date: c.date,
      title: c.student?.name || t('dashboard.professor.course'),
      time: formatTimeAMPM(c.time),
      type: 'course',
      isPast,
    };
  });

  const filteredAvailabilityEvents = showOtherProfs ? availabilityEvents : availabilityEvents.filter((e) => e.type === 'my-availability');
  const calendarEvents = [...courseEvents, ...filteredAvailabilityEvents];

  const weekStartDate = new Date(weekStart + 'T12:00:00');
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const prevWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(toDateStrLocal(d));
  };

  const nextWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(toDateStrLocal(d));
  };

  const coursesInWeek = courses.filter((c) => {
    const cd = new Date(c.date + 'T12:00:00');
    return cd >= weekStartDate && cd <= weekEndDate;
  });

  const coursesThisWeek = coursesInWeek.length;
  const myAvailabilitySlots = availability.length;

  const coursesByDay = DAY_NUMBERS.map((_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStrLocal(d);
    const dayOfWeek = i + 1;
    let dayAvailability = allProfsAvailability.flatMap((prof) =>
      (prof.availability || [])
        .filter((s) => s.dayOfWeek === dayOfWeek)
        .map((s) => ({ ...s, professorId: prof.id, professorName: prof.name }))
    );
    if (!showOtherProfs) dayAvailability = dayAvailability.filter((s) => s.professorId === user?.id);
    return {
      day: DAYS[i],
      dateStr,
      isToday: dateStr === today,
      dayOfWeek,
      courses: coursesInWeek.filter((c) => c.date === dateStr).sort((a, b) => a.time.localeCompare(b.time)),
      availability: dayAvailability.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  });

  const dateFormatted = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Day view: selected date data
  const dayViewDateObj = new Date(dayViewDate + 'T12:00:00');
  const dayViewDayOfWeek = dayViewDateObj.getDay() === 0 ? 7 : dayViewDateObj.getDay();
  const coursesForDay = courses.filter((c) => c.date === dayViewDate).sort((a, b) => a.time.localeCompare(b.time));
  const availabilityForDay = allProfsAvailability.flatMap((prof) =>
    (prof.availability || [])
      .filter((s) => s.dayOfWeek === dayViewDayOfWeek)
      .map((s) => ({ ...s, professorId: prof.id, professorName: prof.name }))
  ).filter((s) => showOtherProfs || s.professorId === user?.id).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dayTimelineItems = [
    ...availabilityForDay.map((s) => ({ type: 'availability', sortTime: s.startTime, data: s })),
    ...coursesForDay.map((c) => ({ type: 'course', sortTime: c.time, data: c })),
  ].sort((a, b) => a.sortTime.localeCompare(b.sortTime));

  const renderCourseDayCard = (c, i) => {
    const status = getCourseStatus(c);
    const hasDarkBg = ['gradient', 'status'].includes(calendarStyle) || status === 'completed';
    const nameTextClass = hasDarkBg ? 'text-white' : 'text-text dark:text-[#f5f5f5]';
    return (
      <div
        key={c.id}
        className={`p-4 transition-all duration-300 hover:shadow-md animate-fade-in ${getWeekCourseCardClass(calendarStyle, status)}`}
        style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`flex items-center justify-center min-w-[4.5rem] h-12 px-2 rounded-xl shrink-0 font-mono font-bold text-sm shadow-sm whitespace-nowrap ${hasDarkBg ? 'bg-black/35 text-white' : 'bg-pink-soft/40 dark:bg-white/10 text-text dark:text-[#f5f5f5]'}`}>
              {formatTimeAMPM(c.time)}
            </span>
            <div>
              <span className={`font-semibold ${nameTextClass}`}>{c.student?.name}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-medium ${
                status === 'live' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                status === 'professor_absent' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                status === 'upcoming' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {status === 'live' ? t('dashboard.professor.live') : status === 'professor_absent' ? t('dashboard.admin.endReasonProfessorAbsent') : status === 'upcoming' ? t('dashboard.professor.upcoming') : t('dashboard.professor.completed')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {editingLink === c.id ? (
              <div className="flex gap-2 flex-1 min-w-[200px]">
                <input
                  type="url"
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-pink-soft dark:border-white/20 rounded-lg text-xs bg-transparent text-text dark:text-[#f5f5f5]"
                  autoFocus
                />
                <button onClick={() => saveMeetingLink(c.id)} className="text-green-600 dark:text-green-400 text-sm">✓</button>
                <button onClick={() => setEditingLink(null)} className="text-text/50 text-sm">✕</button>
              </div>
            ) : (
              <button onClick={() => openEditLink(c)} className="text-xs text-pink-primary dark:text-pink-400 hover:underline">
                {c.meetingLink ? t('dashboard.professor.editLink') : t('dashboard.professor.addLink')}
              </button>
            )}
            {recordingFor === c.id ? (
              <div className="flex gap-2 flex-1 min-w-[200px]">
                <input
                  type="url"
                  placeholder={t('dashboard.professor.recordingUrl')}
                  value={recordingValue}
                  onChange={(e) => setRecordingValue(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-pink-soft dark:border-white/20 rounded-lg text-xs bg-transparent text-text dark:text-[#f5f5f5]"
                  autoFocus
                />
                <button onClick={() => saveRecording(c.id)} className="text-green-600 dark:text-green-400 text-sm">✓</button>
                <button onClick={() => setRecordingFor(null)} className="text-text/50 text-sm">✕</button>
              </div>
            ) : (
              <button onClick={() => openRecording(c)} className="text-xs text-pink-primary dark:text-pink-400 hover:underline">
                {c.recordingLink ? t('dashboard.professor.editRecording') : t('dashboard.professor.addRecording')}
              </button>
            )}
            {(status === 'upcoming' || status === 'live') && (
              <Link
                to={`/live?courseId=${c.id}`}
                className="inline-block px-2 py-1 bg-pink-primary dark:bg-pink-400 text-white rounded-lg text-xs hover:bg-pink-dark dark:hover:bg-pink-500 transition"
              >
                {status === 'live' ? t('dashboard.student.join') : t('dashboard.professor.startCourse')}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const prevDay = () => {
    const d = new Date(dayViewDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setDayViewDate(toDateStrLocal(d));
  };
  const nextDay = () => {
    const d = new Date(dayViewDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setDayViewDate(toDateStrLocal(d));
  };
  const goToTodayDayView = () => setDayViewDate(today);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.professor.title')}</h1>
      </div>

      {/* Today's date & time - live clock for teachers */}
      <div className="mb-6 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-soft/50 to-pink-soft/20 dark:from-pink-500/15 dark:to-pink-500/5 border border-pink-soft/50 dark:border-pink-400/20 shadow-pink-soft dark:shadow-lg overflow-hidden animate-fade-in transition-all duration-500 hover:shadow-md hover:border-pink-soft/70 dark:hover:border-pink-400/30">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-pink-primary/15 dark:bg-pink-400/15 shrink-0">
          <svg className="w-7 h-7 text-pink-primary dark:text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-pink-primary dark:text-pink-400 mb-0.5">
            {t('calendar.today')}
          </p>
          <p className="text-lg font-semibold text-text dark:text-[#f5f5f5] capitalize">
            {dateFormatted}
          </p>
          <p className="text-lg font-mono font-bold text-pink-primary dark:text-pink-400 tabular-nums transition-all duration-300">
            {timeFormatted}
          </p>
        </div>
      </div>

      {/* Availability - Professors set their weekly availability */}
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg mb-6 transition-colors duration-500">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">{t('dashboard.professor.myAvailability')}</h2>
        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-4">
          {t('dashboard.professor.availabilityDesc')}
        </p>
        <form onSubmit={handleAddAvailability} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.professor.day')}</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: +e.target.value }))}
              className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-transparent text-text dark:text-[#f5f5f5]"
            >
              {DAY_NUMBERS.map((n) => (
                <option key={n} value={n}>{DAYS[n - 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.professor.from')}</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-transparent text-text dark:text-[#f5f5f5]"
            />
          </div>
          <div>
            <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.professor.to')}</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-transparent text-text dark:text-[#f5f5f5]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow"
          >
            {t('dashboard.professor.add')}
          </button>
        </form>
        {availability.length > 0 && (
          <ul className="mt-4 space-y-2">
            {availability.map((slot) => (
              <li
                key={slot.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10"
              >
                <span className="text-sm text-text dark:text-[#f5f5f5]">
                  {DAYS[slot.dayOfWeek - 1]} {slot.startTime} – {slot.endTime}
                </span>
                <button
                  onClick={() => handleRemoveAvailability(slot.id)}
                  className="text-pink-primary dark:text-pink-300 hover:underline text-sm"
                >
                  {t('dashboard.professor.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Résumé rapide */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pink-soft/40 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-pink-primary/15 dark:bg-pink-400/15">
            <svg className="w-6 h-6 text-pink-primary dark:text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.professor.coursesThisWeek', { count: coursesThisWeek })}</p>
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.professor.slotsAvailable', { count: myAvailabilitySlots })}</p>
          </div>
        </div>
        <button
          onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
            setWeekStart(toDateStrLocal(d));
            setViewMode('semaine');
            setTimeout(() => {
              weekViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className="px-4 py-3 rounded-xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 hover:bg-pink-soft/30 dark:hover:bg-white/10 transition text-sm font-medium text-text dark:text-[#f5f5f5]"
        >
          {t('dashboard.professor.viewCurrentWeek')}
        </button>
      </div>

      {viewMode === 'mois' ? (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-4 p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-primary/15 dark:bg-pink-400/15 text-pink-primary dark:text-pink-400 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-primary dark:bg-pink-400" />
              {t('dashboard.professor.myCourses')}
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {t('dashboard.professor.myAvailabilityShort')}
            </span>
            <button
              onClick={() => setShowOtherProfs(!showOtherProfs)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showOtherProfs
                  ? 'bg-slate-300/30 dark:bg-slate-600/30 text-slate-700 dark:text-slate-300'
                  : 'bg-slate-200/50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-500'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 ${!showOtherProfs && 'opacity-50'}`} />
              {t('dashboard.professor.otherProfs')} {showOtherProfs ? t('dashboard.professor.hide') : t('dashboard.professor.show')}
            </button>
          </div>
          <Calendar
          events={calendarEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          viewMode="mois"
          onViewModeChange={setViewMode}
          calendarStyle={calendarStyle}
        />
        </>
      ) : viewMode === 'semaine' ? (
        <div ref={weekViewRef} className="space-y-4 scroll-mt-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-4 flex gap-2 transition-colors duration-500">
            <button onClick={() => setViewMode('mois')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20 transition">
              {t('dashboard.professor.month')}
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-primary dark:bg-pink-400 text-white">
              {t('dashboard.professor.week')}
            </button>
            <button onClick={() => setViewMode('jour')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20 transition">
              {t('dashboard.professor.dayView')}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-primary/15 dark:bg-pink-400/15 text-pink-primary dark:text-pink-400 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-primary dark:bg-pink-400" />
                {t('dashboard.professor.myCourses')}
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {t('dashboard.professor.myAvailabilityShort')}
              </span>
              <button
                onClick={() => setShowOtherProfs(!showOtherProfs)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  showOtherProfs
                    ? 'bg-slate-300/30 dark:bg-slate-600/30 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-200/50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-500'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 ${!showOtherProfs && 'opacity-50'}`} />
                {t('dashboard.professor.otherProfs')} {showOtherProfs ? t('dashboard.professor.hide') : t('dashboard.professor.show')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="px-4 py-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium">
                ← {t('dashboard.professor.previous')}
              </button>
              <span className="font-medium text-text dark:text-[#f5f5f5]">
                {weekStartDate.toLocaleDateString(locale, { month: 'short' })} {weekStartDate.getDate()} – {weekEndDate.toLocaleDateString(locale, { month: 'short' })} {weekEndDate.getDate()}, {weekStartDate.getFullYear()}
              </span>
              <button onClick={nextWeek} className="px-4 py-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium">
                {t('dashboard.professor.next')} →
              </button>
            </div>
          </div>

          {/* Grille horizontale : 7 colonnes (jours) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {coursesByDay.map(({ day, dateStr, isToday, courses: dayCourses, availability: dayAvail }) => (
                <div
                  key={day}
                  className={`min-h-[140px] rounded-2xl p-4 transition ${isToday ? 'calendar-today-cell bg-pink-primary/20 dark:bg-pink-400/25 border-2 border-pink-primary/50 dark:border-pink-400/50' : 'bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10'}`}
                >
                  <div className="font-medium text-text dark:text-[#f5f5f5] mb-1">{day}</div>
                  <div className="text-xs text-text/50 dark:text-[#f5f5f5]/50 mb-3">{dateStr}</div>
                  <div className="space-y-2">
                    {dayAvail.map((slot) => {
                      const isMySlot = slot.professorId === user?.id;
                      return (
                        <div
                          key={`${slot.professorId}-${slot.startTime}`}
                          className={`text-xs rounded-lg px-2 py-1.5 ${
                            isMySlot
                              ? 'bg-emerald-500/80 dark:bg-emerald-500/80 text-white'
                              : 'bg-slate-300/80 dark:bg-slate-600/80 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {slot.startTime}–{slot.endTime} {isMySlot ? t('dashboard.professor.me') : slot.professorName}
                        </div>
                      );
                    })}
                    {dayCourses.length === 0 && dayAvail.length === 0 ? (
                      <p className="text-sm text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.professor.noClasses')}</p>
                    ) : dayCourses.length > 0 ? (
                      dayCourses.map((c) => {
                        const status = getCourseStatus(c);
                        const weekCardDarkBg = ['gradient', 'status'].includes(calendarStyle) || status === 'completed';
                        const weekTextClass = weekCardDarkBg ? 'text-white' : 'text-text dark:text-[#f5f5f5]';
                        const weekTimeClass = weekCardDarkBg ? 'text-white opacity-95' : 'text-text/90 dark:text-[#f5f5f5]/90';
                        return (
                          <div
                            key={c.id}
                            className={getWeekCourseCardClass(calendarStyle, status)}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className={`font-medium ${weekTextClass}`}>{c.student?.name}</span>
                                <span className={`text-sm ml-2 ${weekTimeClass}`}>{formatTimeAMPM(c.time)}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                                status === 'live' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                status === 'professor_absent' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                                status === 'upcoming' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {status === 'live' ? t('dashboard.professor.live') : status === 'professor_absent' ? t('dashboard.admin.endReasonProfessorAbsent') : status === 'upcoming' ? t('dashboard.professor.upcoming') : t('dashboard.professor.completed')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center items-center">
                              {editingLink === c.id ? (
                                <div className="flex gap-2 flex-1">
                                  <input
                                    type="url"
                                    value={linkValue}
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-pink-soft dark:border-white/20 rounded-lg text-xs bg-transparent text-text dark:text-[#f5f5f5]"
                                    autoFocus
                                  />
                                  <button onClick={() => saveMeetingLink(c.id)} className="text-green-600 dark:text-green-400 text-sm">✓</button>
                                  <button onClick={() => setEditingLink(null)} className="text-text/50 text-sm">✕</button>
                                </div>
                              ) : (
                                <button onClick={() => openEditLink(c)} className={`text-xs hover:opacity-90 hover:underline ${weekTextClass}`}>
                                  {c.meetingLink ? t('dashboard.professor.editLink') : t('dashboard.professor.addLink')}
                                </button>
                              )}
                              {recordingFor === c.id ? (
                                <div className="flex gap-2 flex-1">
                                  <input
                                    type="url"
                                    placeholder={t('dashboard.professor.recordingUrl')}
                                    value={recordingValue}
                                    onChange={(e) => setRecordingValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-pink-soft dark:border-white/20 rounded-lg text-xs bg-transparent text-text dark:text-[#f5f5f5]"
                                    autoFocus
                                  />
                                  <button onClick={() => saveRecording(c.id)} className="text-green-600 dark:text-green-400 text-sm">✓</button>
                                  <button onClick={() => setRecordingFor(null)} className="text-text/50 text-sm">✕</button>
                                </div>
                              ) : (
                                <button onClick={() => openRecording(c)} className={`text-xs hover:opacity-90 hover:underline ${weekTextClass}`}>
                                  {c.recordingLink ? t('dashboard.professor.editRecording') : t('dashboard.professor.addRecording')}
                                </button>
                              )}
                              {(status === 'upcoming' || status === 'live') && (
                                <Link
                                  to={`/live?courseId=${c.id}`}
                                  className="inline-block px-2 py-1 bg-pink-primary dark:bg-pink-400 text-white rounded-lg text-xs hover:bg-pink-dark dark:hover:bg-pink-500 transition"
                                >
                                  {status === 'live' ? t('dashboard.student.join') : t('dashboard.professor.startCourse')}
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-4 flex flex-wrap gap-2 transition-colors duration-500">
            <button onClick={() => setViewMode('mois')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20 transition">
              {t('dashboard.professor.month')}
            </button>
            <button onClick={() => setViewMode('semaine')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20 transition">
              {t('dashboard.professor.week')}
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-primary dark:bg-pink-400 text-white">
              {t('dashboard.professor.dayView')}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <button onClick={prevDay} className="p-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium">
                ←
              </button>
              <span className="font-semibold text-text dark:text-[#f5f5f5] min-w-[200px] text-center capitalize">
                {dayViewDateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextDay} className="p-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium">
                →
              </button>
            </div>
            <button
              onClick={goToTodayDayView}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                dayViewDate === today
                  ? 'bg-pink-primary dark:bg-pink-400 text-white'
                  : 'bg-pink-soft/50 dark:bg-white/10 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/70 dark:hover:bg-white/20'
              }`}
            >
              {t('calendar.today')}
            </button>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-colors duration-500">
            <div className="flex-1 min-w-0">
                {dayTimelineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-pink-soft/40 dark:bg-pink-500/15 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-pink-primary dark:text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <p className="text-text/60 dark:text-[#f5f5f5]/60 font-medium">{t('dashboard.professor.noClasses')}</p>
                    <p className="text-sm text-text/40 dark:text-[#f5f5f5]/40 mt-1">{t('dashboard.professor.noClassesDay')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-pink-soft/30 dark:divide-white/10">
                    {dayTimelineItems.map((item, i) => item.type === 'availability' ? (
                      <div
                        key={`av-${item.data.professorId}-${item.data.startTime}`}
                        className={`flex items-center gap-4 p-4 transition-all duration-300 hover:bg-pink-soft/20 dark:hover:bg-white/5 animate-fade-in ${
                          item.data.professorId === user?.id
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-l-4 border-l-emerald-500'
                            : 'bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-slate-400 dark:border-l-slate-500'
                        }`}
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                      >
                        <div className="w-20 shrink-0 text-sm font-mono font-medium text-text/70 dark:text-[#f5f5f5]/70">
                          {item.data.startTime} – {item.data.endTime}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-text dark:text-[#f5f5f5]">
                            {item.data.professorId === user?.id ? t('dashboard.professor.myAvailabilityShort') : item.data.professorName}
                          </span>
                          {item.data.professorId === user?.id && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">{t('dashboard.professor.me')}</span>}
                        </div>
                      </div>
                    ) : renderCourseDayCard(item.data, i)
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
