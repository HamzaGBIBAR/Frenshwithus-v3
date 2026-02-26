import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';
import { useAuth } from '../../context/AuthContext';

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]; // Mon=1, Sun=7

function getCourseStatus(course) {
  const now = new Date();
  const d = new Date(`${course.date}T${course.time}`);
  if (d < now) return 'completed';
  const twoHours = 2 * 60 * 60 * 1000;
  if (course.isStarted && d <= now && now - d < twoHours) return 'live';
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

  const [allProfsAvailability, setAllProfsAvailability] = useState([]);
  const [showOtherProfs, setShowOtherProfs] = useState(true);
  const { user } = useAuth();

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
    rangeEnd.setMonth(rangeEnd.getMonth() + 4);
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

  const courseEvents = courses.map((c) => ({
    id: c.id,
    date: c.date,
    title: c.student?.name || t('dashboard.professor.course'),
    time: c.time,
    type: 'course',
  }));

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

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.professor.title')}</h1>
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
        />
        </>
      ) : viewMode === 'semaine' ? (
        <div className="space-y-4">
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
                  className={`min-h-[140px] rounded-2xl p-4 transition ${isToday ? 'bg-pink-soft/60 dark:bg-pink-400/20 ring-2 ring-pink-primary/30 dark:ring-pink-400/30' : 'bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10'}`}
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
                        return (
                          <div
                            key={c.id}
                            className="bg-gradient-to-r from-pink-soft/50 to-transparent dark:from-white/5 dark:to-transparent rounded-xl p-3 border border-pink-soft/50 dark:border-white/10 card-hover shadow-pink-soft dark:shadow-lg"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-medium text-text dark:text-[#f5f5f5]">{c.student?.name}</span>
                                <span className="text-sm text-text/60 dark:text-[#f5f5f5]/60 ml-2">{c.time}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                                status === 'live' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                status === 'upcoming' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {status === 'live' ? t('dashboard.professor.live') : status === 'upcoming' ? t('dashboard.professor.upcoming') : t('dashboard.professor.completed')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
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
                                <button onClick={() => openEditLink(c)} className="text-xs text-pink-primary dark:text-pink-400 hover:underline">
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
                        );
                      })
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-4 flex gap-2 transition-colors duration-500">
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
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg p-8 text-center text-text/60 dark:text-[#f5f5f5]/60 transition-colors duration-500">
            {t('dashboard.professor.dayViewSoon')}
          </div>
        </div>
      )}
    </div>
  );
}
