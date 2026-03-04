import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';
import TeacherProfileTooltip from '../../components/TeacherProfileTooltip';
import { formatTimeAMPM, formatProfessorName } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateTime, convertMoroccoToLocal } from '../../utils/countries';
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
                      accept="image/jpeg,image/png,image/webp,image/jpg"
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

function useStudentData() {
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
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

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([fetchCourses(), fetchPayments()]).finally(() => setLoading(false));
  }, [fetchCourses, fetchPayments]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { courses, payments, loading, error, fetchCourses, fetchAll };
}

function categorizeCourses(courses) {
  const now = new Date();
  const upcoming = [];
  const live = [];
  const past = [];

  for (const c of courses) {
    if (!c?.date || !c?.time) continue;
    const d = new Date(`${c.date}T${c.time}`);
    if (isNaN(d.getTime())) continue;

    const timeReached = now >= d;
    const withinWindow = now - d < TWO_HOURS_MS;
    const ended = c.sessionEnded || c.endReason === 'professor_absent';

    if (!timeReached) {
      upcoming.push(c);
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

  const displayDate = localInfo ? localInfo.displayDate : course.date;
  const displayTime = localInfo ? localInfo.displayTime : (course.time ? formatTimeAMPM(course.time) : '');
  const durationMin = course.durationMin || 60;

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
          {course.endReason === 'professor_absent' && (
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">{t('dashboard.admin.endReasonProfessorAbsent')}</p>
          )}
        </div>
        <div className="flex-shrink-0">
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
  const { courses, payments, loading, error, fetchCourses, fetchAll } = useStudentData();
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [localTime, setLocalTime] = useState(() => user?.country ? getLocalDateTime(user.country, i18n.language) : null);

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
    if (!user?.country || !c?.date || !c?.time) return null;
    return convertMoroccoToLocal(c.date, c.time, user.country, i18n.language);
  };

  const { upcoming, live, past } = categorizeCourses(courses);

  const hasJoinable = upcoming.length > 0 || live.length > 0;
  useEffect(() => {
    if (!hasJoinable) return;
    const id = setInterval(fetchCourses, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasJoinable, fetchCourses]);

  const coursesThisWeek = courses.filter((c) => {
    if (!c?.date || !c?.time) return false;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const d = new Date(`${c.date}T${c.time}`);
    return d >= startOfWeek && d <= endOfWeek;
  }).length;

  const calendarEvents = courses.map((c) => {
    if (!c?.date || !c?.time) return null;
    const d = new Date(`${c.date}T${c.time}`);
    const sessionEnded = c.isStarted && c.sessionEnded;
    const localInfo = getLocalInfo(c);
    return {
      id: c.id,
      date: localInfo?.date || c.date,
      title: c.professor?.name ? formatProfessorName(c.professor.name) : t('dashboard.student.frenchCourse'),
      time: localInfo?.displayTime || formatTimeAMPM(c.time),
      hoverDetails: `${t('dashboard.student.moroccoTime')}: ${c.date} ${formatTimeAMPM(c.time)}`,
      type: 'course',
      isPast: sessionEnded || !!c.endReason,
    };
  }).filter(Boolean);

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

      {/* Calendar */}
      <section>
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">{t('dashboard.student.planning')}</h2>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden">
          <Calendar
            events={calendarEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectEvent={handleSelectEvent}
            viewMode="mois"
            embedded
            calendarStyle="default"
          />
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
