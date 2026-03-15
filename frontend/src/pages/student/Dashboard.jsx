import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';
import StudentWeekView from '../../components/StudentWeekView';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import TeacherProfileTooltip from '../../components/TeacherProfileTooltip';
import { formatTimeAMPM, formatProfessorName, formatTimeRange, getEndTime, shouldShowProfessorAbsent } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateTime, convertMoroccoToLocal, convertTimeBetweenTimezones, getTimezoneByCountry, formatUtcInTimezone } from '../../utils/countries';
import { getStudentCalendarStyle } from '../../utils/calendarStyles';
import COUNTRIES from '../../utils/countries';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function StudentPaymentsSection({ payments, onRefresh, t }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const copyReference = (ref) => {
    navigator.clipboard?.writeText(ref);
  };

  const handleRemoveProof = async (paymentId) => {
    setRemovingId(paymentId);
    try {
      await api.delete(`/student/payments/${paymentId}/proof`);
      onRefresh?.();
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  };

  const handleUploadProof = async (paymentId, e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setUploadingId(paymentId);
    const formData = new FormData();
    formData.append('proof', file);
    try {
      await api.post(`/student/payments/${paymentId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onRefresh?.();
    } catch {
      // ignore
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  return (
    <section id="payments" className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg scroll-mt-24">
      <h2 className="text-text/60 dark:text-[#f5f5f5]/60 text-sm font-medium mb-3">{t('dashboard.student.payments')}</h2>
      {payments.length === 0 ? (
        <p className="text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.noPayment')}</p>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border border-pink-soft/30 dark:border-white/10 bg-pink-soft/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-text dark:text-[#f5f5f5]">€{Number(p.amount || 0).toFixed(2)}</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'}`}>
                  {p.status === 'paid' ? t('dashboard.adminPayments.paid') : p.proofUrl ? t('dashboard.student.proofSent') : t('dashboard.adminPayments.unpaid')}
                </span>
              </div>
              {p.reference && (
                <div className="mb-2">
                  <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.student.paymentReference')}</p>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded-lg bg-white dark:bg-[#1a1a1a] border border-pink-soft/40 dark:border-white/10 text-sm font-mono text-pink-primary dark:text-pink-400">
                      {p.reference}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyReference(p.reference)}
                      className="text-xs text-pink-primary dark:text-pink-400 hover:underline font-medium"
                    >
                      {t('dashboard.student.copyReference')}
                    </button>
                  </div>
                  <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50 mt-1">{t('dashboard.student.paymentReferenceHint')}</p>
                </div>
              )}
              {p.status === 'unpaid' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                      className="hidden"
                      onChange={(e) => handleUploadProof(p.id, e)}
                      disabled={uploadingId === p.id}
                    />
                    <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 hover:bg-pink-primary/30 dark:hover:bg-pink-400/30 transition disabled:opacity-50">
                      {uploadingId === p.id ? '...' : p.proofUrl ? t('dashboard.student.replaceProof') : t('dashboard.student.uploadProof')}
                    </span>
                  </label>
                  {p.proofUrl && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProof(p.id)}
                      disabled={removingId === p.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                    >
                      {removingId === p.id ? '...' : t('dashboard.student.removeProof')}
                    </button>
                  )}
                  <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.payViaWhatsApp')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
const POLL_INTERVAL_MS = 15000;

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

function useStudentData() {
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(() => {
    setError(null);
    return api
      .get('/student/courses')
      .then((res) => setCourses(Array.isArray(res?.data) ? res.data : []))
      .catch((err) => {
        setCourses([]);
        setError(err.response?.data?.error || err.message || 'Erreur de chargement');
      });
  }, []);

  const fetchPayments = useCallback(() => {
    return api
      .get('/student/payments')
      .then((res) => setPayments(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setPayments([]));
  }, []);

  const fetchAvailability = useCallback(() => {
    return api
      .get('/student/availability')
      .then((res) => setAvailability(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setAvailability([]));
  }, []);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchPayments(), fetchAvailability()]).finally(() => setLoading(false));
  }, [fetchCourses, fetchPayments, fetchAvailability]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { courses, payments, availability, loading, error, fetchCourses, fetchAvailability, fetchAll };
}

function getMoroccoTime(now) {
  try {
    const moroccoNow = now.toLocaleString('sv-SE', { timeZone: 'Africa/Casablanca' });
    return {
      dateStr: moroccoNow.slice(0, 10),
      timeStr: moroccoNow.slice(11, 16),
    };
  } catch (_) {
    return null;
  }
}

function isCourseDefinitelyFuture(c, moroccoNow) {
  // Use Africa/Casablanca IANA timezone (handles Ramadan UTC+0 vs standard UTC+1 correctly)
  if (!c?.date || !c?.time || !moroccoNow) return false;
  const courseTimeShort = c.time.slice(0, 5);
  return c.date > moroccoNow.dateStr || (c.date === moroccoNow.dateStr && courseTimeShort > moroccoNow.timeStr);
}

function isWithin15MinGracePeriod(c, moroccoNow) {
  // Returns true if course started less than 15 minutes ago in Morocco time
  if (!c?.date || !c?.time || !moroccoNow) return false;
  if (c.date !== moroccoNow.dateStr) return false; // Different day
  const courseTimeShort = c.time.slice(0, 5);
  const [ch, cm] = courseTimeShort.split(':').map(Number);
  const [nh, nm] = moroccoNow.timeStr.split(':').map(Number);
  const courseMinutes = ch * 60 + cm;
  const nowMinutes = nh * 60 + nm;
  return nowMinutes < courseMinutes + 15;
}

function categorizeCourses(courses) {
  const now = new Date();
  const moroccoNow = getMoroccoTime(now);
  const upcoming = [];
  const live = [];
  const past = [];

  for (const c of courses) {
    if (!c?.date || !c?.time) continue;
    const d = new Date(`${c.date}T${c.time}`);
    if (isNaN(d.getTime())) continue;

    // IMPORTANT: If professor started the course, NEVER consider it as professor_absent
    // The professor showed up, even if late
    if (c.isStarted) {
      if (c.sessionEnded) {
        past.push(c);
      } else if (now - d < TWO_HOURS_MS) {
        live.push(c);
      } else {
        past.push(c);
      }
      continue;
    }

    // Professor has NOT started the course
    const isFuture = isCourseDefinitelyFuture(c, moroccoNow);
    const inGracePeriod = isWithin15MinGracePeriod(c, moroccoNow);
    const timeReached = !isFuture && !inGracePeriod;
    const withinWindow = now - d < TWO_HOURS_MS;
    
    // Only mark as professor_absent if endReason explicitly says so
    // (absenceReason in DB may be stale)
    const professorAbsentPast = timeReached && c.endReason === 'professor_absent';
    const ended = c.sessionEnded || professorAbsentPast;

    if (isFuture) {
      upcoming.push(c);
    } else if (inGracePeriod && !c.sessionEnded) {
      // Within 15 min grace period - show as live (can join)
      live.push(c);
    } else if (!ended && withinWindow) {
      live.push(c);
    } else {
      past.push(c);
    }
  }

  return { upcoming, live, past };
}

function CourseCard({ course, variant, onJoin, onViewRecording, highlighted, localInfo }) {
  const { t } = useTranslation();
  const professorName = course.professor?.name ? formatProfessorName(course.professor.name) : t('dashboard.student.frenchCourse');
  const borderClass = highlighted ? 'ring-2 ring-pink-primary dark:ring-pink-400 border-pink-primary dark:border-pink-400' : 'border-pink-soft/50 dark:border-white/10';
  const liveBorder = variant === 'live' ? 'border-green-500/50 dark:border-green-400/50' : borderClass;

  const durationMin = course.durationMin || 60;
  const displayDate = localInfo ? localInfo.displayDate : course.date;
  const displayTime = localInfo
    ? (localInfo.displayEndTime ? `${localInfo.displayTime} – ${localInfo.displayEndTime}` : localInfo.displayTime)
    : (course.time ? formatTimeRange(course.time, durationMin) : '');

  return (
    <div
      className={`bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border shadow-pink-soft dark:shadow-lg transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${liveBorder}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          {variant === 'live' && (
            <span className="inline-block px-2 py-0.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium mb-2">
              {t('dashboard.student.live')}
            </span>
          )}
          <p className="font-medium text-text dark:text-[#f5f5f5] truncate">
            {course.professor ? (
              <TeacherProfileTooltip teacher={course.professor}>{professorName}</TeacherProfileTooltip>
            ) : (
              professorName
            )}
          </p>
          <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
            {displayDate} {t('dashboard.student.at')} {displayTime}
          </p>
          <p className="text-xs text-text/40 dark:text-[#f5f5f5]/40 mt-0.5">
            {durationMin} min
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {variant === 'past' && (() => {
            const reason = course.endReason || course.absenceReason;
            const reasonLabel =
              reason === 'completed' ? t('dashboard.student.endReasonCompleted') :
              reason === 'student_absent' ? t('dashboard.student.endReasonStudentAbsent') :
              reason === 'meeting_issue' ? t('dashboard.student.endReasonMeetingIssue') :
              (reason === 'professor_absent' || shouldShowProfessorAbsent(course)) ? t('dashboard.admin.endReasonProfessorAbsent') : null;
            return reasonLabel ? (
              <p className={`text-sm font-medium ${reason === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : reason === 'professor_absent' ? 'text-orange-600 dark:text-orange-400' : 'text-text/70 dark:text-[#f5f5f5]/70'}`}>
                {reasonLabel}
              </p>
            ) : null;
          })()}
          {variant === 'live' || variant === 'upcoming' ? onJoin(course) : onViewRecording(course)}
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const { courses, payments, availability, loading, error, fetchCourses, fetchAvailability, fetchAll } = useStudentData();
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [viewMode, setViewMode] = useState('mois');
  const [calendarStyle, setCalendarStyle] = useState(getStudentCalendarStyle);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const handler = () => setCalendarStyle(getStudentCalendarStyle());
    window.addEventListener('studentCalendarStyleChanged', handler);
    return () => window.removeEventListener('studentCalendarStyleChanged', handler);
  }, []);
  const [localTime, setLocalTime] = useState(() => user?.country ? getLocalDateTime(user.country, i18n.language) : null);
  const studentTz = user?.timezone || (user?.country ? getTimezoneByCountry(user.country) : null);
  const [availForm, setAvailForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });

  useEffect(() => {
    if (location.hash === '#payments' && !loading) {
      const el = document.getElementById('payments');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, loading]);

  useEffect(() => {
    if (!user?.country) return;
    const tick = () => setLocalTime(getLocalDateTime(user.country, i18n.language));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user?.country, i18n.language]);

  const getLocalInfo = (c) => {
    const tz = studentTz || (user?.country ? getTimezoneByCountry(user.country) : null);
    if (!tz) return null;
    if (c?.startUtc) {
      const start = formatUtcInTimezone(c.startUtc, tz, i18n.language);
      if (!start) return null;
      const endUtc = c.durationMin ? new Date(new Date(c.startUtc).getTime() + c.durationMin * 60 * 1000) : null;
      const end = endUtc ? formatUtcInTimezone(endUtc.toISOString(), tz, i18n.language) : null;
      return { date: start.date, time: start.time, displayDate: start.displayDate, displayTime: start.displayTime, displayEndTime: end?.displayTime || null };
    }
    if (!c?.date || !c?.time) return null;
    const start = convertTimeBetweenTimezones(c.date, c.time, 'Africa/Casablanca', tz, i18n.language);
    if (!start) return null;
    const endTime = getEndTime(c.time, c.durationMin || 60);
    const end = endTime ? convertTimeBetweenTimezones(c.date, endTime, 'Africa/Casablanca', tz, i18n.language) : null;
    return { date: start.date, displayDate: start.displayDate, displayTime: start.displayTime, displayEndTime: end?.displayTime || null };
  };

  const { upcoming, live, past } = categorizeCourses(courses);

  const hasJoinable = upcoming.length > 0 || live.length > 0;
  useEffect(() => {
    if (!hasJoinable) return;
    const id = setInterval(fetchCourses, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasJoinable, fetchCourses]);

  const coursesThisWeek = courses.filter((c) => {
    const localInfo = getLocalInfo(c);
    const courseDateStr = localInfo?.date || (c?.startUtc ? new Date(c.startUtc).toISOString().slice(0, 10) : c?.date);
    if (!courseDateStr) return false;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    const weekStartStr = startOfWeek.toISOString().slice(0, 10);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const weekEndStr = endOfWeek.toISOString().slice(0, 10);
    return courseDateStr >= weekStartStr && courseDateStr <= weekEndStr;
  }).length;

  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toJsDay = (dow) => (dow === 7 ? 0 : dow);

  const availabilityEvents = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setMonth(rangeStart.getMonth() - 2);
    const rangeEnd = new Date();
    rangeEnd.setMonth(rangeEnd.getMonth() + 12);
    const evts = [];
    for (const slot of availability || []) {
      const d = new Date(rangeStart.getTime());
      const end = new Date(rangeEnd.getTime());
      const timeLabel = slot.endTime ? `${slot.startTime?.slice(0, 5) || ''} – ${slot.endTime.slice(0, 5)}` : slot.startTime?.slice(0, 5) || '';
      while (d <= end) {
        if (d.getDay() === toJsDay(slot.dayOfWeek)) {
          evts.push({
            id: `av-my-${slot.id}-${toDateStr(d)}`,
            date: toDateStr(d),
            time: timeLabel,
            title: t('dashboard.student.myAvailabilityShort') || t('dashboard.professor.myAvailabilityShort') || 'Dispo.',
            type: 'my-availability',
          });
        }
        d.setDate(d.getDate() + 1);
      }
    }
    return evts;
  }, [availability, t]);

  const courseEvents = courses.map((c) => {
    if (!c?.date || !c?.time) return null;
    const sessionEnded = c.isStarted && c.sessionEnded;
    const localInfo = getLocalInfo(c);
    return {
      id: c.id,
      date: localInfo?.date || c.date,
      title: c.professor?.name ? formatProfessorName(c.professor.name) : t('dashboard.student.frenchCourse'),
      time: localInfo?.displayEndTime ? `${localInfo.displayTime} – ${localInfo.displayEndTime}` : (localInfo?.displayTime || formatTimeRange(c.time, c.durationMin || 60)),
      hoverDetails: localInfo ? `${localInfo.displayDate} ${localInfo.displayTime}${localInfo.displayEndTime ? ' – ' + localInfo.displayEndTime : ''}` : '',
      type: 'course',
      isPast: sessionEnded || !!c.endReason,
    };
  }).filter(Boolean);

  const calendarEvents = [...courseEvents, ...availabilityEvents];

  const handleSelectEvent = useCallback((evt) => {
    if (!evt?.id) return;
    setHighlightedId(evt.id);
    const el = document.getElementById(`course-${evt.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => setHighlightedId(null), 2500);
  }, []);

  const renderJoinButton = (c) => {
    const canJoin = !!c?.professorOnline;
    if (canJoin) {
      return (
        <Link
          to={`/live?courseId=${c.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-primary dark:bg-pink-400 text-white rounded-xl text-sm font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-200 btn-glow"
        >
          {t('dashboard.student.join')}
        </Link>
      );
    }
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span
          className="inline-flex items-center px-4 py-2 bg-gray-200/80 dark:bg-white/15 text-gray-500 dark:text-[#f5f5f5]/50 rounded-xl text-sm cursor-not-allowed"
        >
          {t('dashboard.student.join')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('dashboard.student.profNotInMeet')}
        </span>
      </div>
    );
  };

  const renderRecordingButton = (c) => {
    const link = c?.sessionEnded ? c.recordingLink : null;
    if (link) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-primary dark:bg-pink-400 text-white rounded-xl text-sm font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-200 btn-glow"
        >
          {t('dashboard.student.viewRecording')}
        </a>
      );
    }
    return <span className="text-sm text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.student.noRecording')}</span>;
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-12 h-12 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.student.title')}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in max-w-md">
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">{t('dashboard.student.errorLoading')}</h2>
          <p className="text-sm text-red-600/90 dark:text-red-400/90 mb-4">{error}</p>
          <button
            onClick={fetchAll}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition"
          >
            {t('dashboard.student.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5]">{t('dashboard.student.title')}</h1>
        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-1">{t('dashboard.student.subtitle')}</p>
      </header>

      {localTime && user?.country && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-soft/40 to-pink-soft/10 dark:from-pink-500/15 dark:to-pink-500/5 border border-pink-soft/50 dark:border-pink-400/20 shadow-pink-soft dark:shadow-lg transition-all duration-500">
          <div className="w-12 h-12 rounded-xl bg-pink-primary/15 dark:bg-pink-400/15 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold font-mono text-pink-primary dark:text-pink-400 tracking-tight tabular-nums">{localTime.time}</p>
            <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70 capitalize truncate">{localTime.date}</p>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{COUNTRIES.find((c) => c.code === user.country)?.name}</p>
            <p className="text-[10px] text-text/40 dark:text-[#f5f5f5]/40 font-mono">{localTime.tz}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-pink-primary/15 dark:bg-pink-400/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-pink-primary dark:text-pink-400">{coursesThisWeek}</p>
            <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.student.coursesThisWeek', { count: coursesThisWeek })}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-pink-primary/15 dark:bg-pink-400/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.student.payments')}</p>
            <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">
              {payments.length === 0 ? t('dashboard.student.noPayment') : `${payments.length} ${t('dashboard.student.paymentsCount')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Availability - visual week grid + optional manual add */}
      <section id="availability" className="scroll-mt-6 p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-2">{t('dashboard.student.myAvailability')}</h2>
        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-4">{t('dashboard.student.availabilityDesc')}</p>
        {(studentTz || (typeof Intl !== 'undefined' && Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone)) ? (
          <>
            <AvailabilityGrid
              slots={availability}
              dayLabels={typeof t('dashboard.professor.days', { returnObjects: true }) === 'object' ? t('dashboard.professor.days', { returnObjects: true }) : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']}
              onAdd={async ({ dayOfWeek, startTime, endTime }) => {
                try {
                  const browserTz = typeof Intl !== 'undefined' && Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone
                    : undefined;
                  await api.post('/student/availability', {
                    dayOfWeek,
                    startTime,
                    endTime,
                    ...(browserTz && { timezone: browserTz }),
                  });
                  fetchAvailability();
                } catch {
                  // ignore
                }
              }}
              onRemove={async (id) => {
                try {
                  await api.delete(`/student/availability/${id}`);
                  fetchAvailability();
                } catch {
                  // ignore
                }
              }}
              removeLabel={t('dashboard.student.removeSlot')}
              emptyMessage={t('dashboard.student.availabilityGridHint') || 'Click and drag on a day column to add a time slot. Click a slot to remove it.'}
            />
            <details className="mt-4 group">
              <summary className="text-sm text-pink-primary dark:text-pink-400 cursor-pointer hover:underline list-none inline-flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                {t('dashboard.student.addManually') || 'Add a slot manually'}
              </summary>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const browserTz = typeof Intl !== 'undefined' && Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone
                      ? Intl.DateTimeFormat().resolvedOptions().timeZone
                      : undefined;
                    await api.post('/student/availability', {
                      dayOfWeek: availForm.dayOfWeek,
                      startTime: availForm.startTime,
                      endTime: availForm.endTime,
                      ...(browserTz && { timezone: browserTz }),
                    });
                    setAvailForm((f) => ({ ...f, startTime: '09:00', endTime: '10:00' }));
                    fetchAvailability();
                  } catch {
                    // ignore
                  }
                }}
                className="flex flex-wrap gap-4 items-end mt-3 pl-4"
              >
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.professor.day')}</label>
                  <select
                    value={availForm.dayOfWeek}
                    onChange={(e) => setAvailForm((f) => ({ ...f, dayOfWeek: +e.target.value }))}
                    className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  >
                    {(typeof t('dashboard.professor.days', { returnObjects: true }) === 'object' ? t('dashboard.professor.days', { returnObjects: true }) : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']).map((dayName, i) => (
                      <option key={i} value={i + 1}>{dayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.professor.from')}</label>
                  <input
                    type="time"
                    value={availForm.startTime}
                    onChange={(e) => setAvailForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-1">{t('dashboard.professor.to')}</label>
                  <input
                    type="time"
                    value={availForm.endTime}
                    onChange={(e) => setAvailForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5]"
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow">
                  {t('dashboard.student.addSlot')}
                </button>
              </form>
            </details>
          </>
        ) : (
          <p className="text-sm text-text/50 dark:text-[#f5f5f5]/50">
            {t('dashboard.student.availabilityNeedTimezone')}
          </p>
        )}
      </section>

      {/* Calendar / Planning */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.student.planning')}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('mois')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'mois' ? 'bg-pink-primary dark:bg-pink-400 text-white' : 'bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20'}`}
            >
              {t('calendar.month')}
            </button>
            <button
              onClick={() => setViewMode('semaine')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${viewMode === 'semaine' ? 'bg-pink-primary dark:bg-pink-400 text-white' : 'bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20'}`}
            >
              {t('calendar.week')}
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden">
          {viewMode === 'mois' ? (
            <Calendar
              events={calendarEvents}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectEvent={handleSelectEvent}
              viewMode="mois"
              embedded
              calendarStyle={calendarStyle}
            />
          ) : (
            <StudentWeekView
              events={calendarEvents}
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              onSelectEvent={handleSelectEvent}
              calendarStyle={calendarStyle}
              dayNames={typeof t('dashboard.professor.days', { returnObjects: true }) === 'object' ? t('dashboard.professor.days', { returnObjects: true }) : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']}
              t={t}
            />
          )}
        </div>
      </section>

      {/* Live courses */}
      {live.length > 0 && (
        <section id="live-courses" className="scroll-mt-6">
          <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-3">{t('dashboard.student.liveCourses')}</h2>
          <div className="space-y-3">
            {live.map((c) => (
              <div key={c.id} id={`course-${c.id}`}>
                <CourseCard course={c} variant="live" onJoin={renderJoinButton} highlighted={highlightedId === c.id} localInfo={getLocalInfo(c)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section id="upcoming-courses" className="scroll-mt-6">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-3">{t('dashboard.student.upcomingCourses')}</h2>
        {upcoming.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 text-center">
            <p className="text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.noUpcoming')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((c) => (
              <div key={c.id} id={`course-${c.id}`}>
                <CourseCard course={c} variant="upcoming" onJoin={renderJoinButton} highlighted={highlightedId === c.id} localInfo={getLocalInfo(c)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      <section id="past-courses" className="scroll-mt-6">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-3">{t('dashboard.student.pastCourses')}</h2>
        {past.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 text-center">
            <p className="text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.noPast')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((c) => (
              <div key={c.id} id={`course-${c.id}`}>
                <CourseCard course={c} variant="past" onViewRecording={renderRecordingButton} highlighted={highlightedId === c.id} localInfo={getLocalInfo(c)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payments detail */}
      <StudentPaymentsSection payments={payments} onRefresh={fetchAll} t={t} />
    </div>
  );
}
