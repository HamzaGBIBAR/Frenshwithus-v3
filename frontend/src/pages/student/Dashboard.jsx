import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';
import TeacherProfileTooltip from '../../components/TeacherProfileTooltip';
import { formatTimeAMPM, formatProfessorName } from '../../utils/format';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightedCourseId, setHighlightedCourseId] = useState(null);
  const upcomingRef = useRef(null);
  const pastRef = useRef(null);

  useEffect(() => {
    api.get('/student/courses').then((r) => setCourses(r.data));
    api.get('/student/payments').then((r) => setPayments(r.data));
  }, []);

  const calendarEvents = courses.map((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    const isPast = d < new Date();
    return {
      id: c.id,
      date: c.date,
      title: c.professor?.name ? formatProfessorName(c.professor.name) : t('dashboard.student.frenchCourse'),
      time: formatTimeAMPM(c.time),
      type: 'course',
      isPast,
    };
  });

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  const past = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d < new Date();
  });

  const coursesThisWeek = courses.filter((c) => {
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

  const handleSelectEvent = useCallback((evt) => {
    const courseId = evt.id;
    const isPast = past.some((c) => c.id === courseId);
    const targetRef = isPast ? pastRef : upcomingRef;
    if (targetRef?.current) {
      setHighlightedCourseId(courseId);
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setHighlightedCourseId(null), 2000);
    }
  }, [past]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.student.title')}</h1>

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
            <p className="text-sm font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.student.coursesThisWeek', { count: coursesThisWeek })}</p>
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">{t('dashboard.student.upcoming', { count: upcoming.length })}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-4">{t('dashboard.student.planning')}</h2>
        <Calendar
          events={calendarEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onSelectEvent={handleSelectEvent}
          viewMode="mois"
          embedded
        />
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg mb-6 card-hover transition-colors duration-500">
        <h2 className="text-text/60 dark:text-[#f5f5f5]/60 text-sm font-medium mb-2">{t('dashboard.student.payments')}</h2>
        <div className="space-y-2">
          {payments.length === 0 ? (
            <p className="text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.noPayment')}</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center">
                <span className="font-medium text-text">${p.amount.toFixed(2)}</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'}`}>
                  {p.status === 'paid' ? t('dashboard.adminPayments.paid') : t('dashboard.adminPayments.unpaid')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div ref={upcomingRef} className="mb-6 scroll-mt-6">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-3">{t('dashboard.student.upcomingCourses')}</h2>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.noUpcoming')}</p>
          ) : (
            upcoming.map((c, i) => (
                <div key={c.id} className={`bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border shadow-pink-soft dark:shadow-lg card-hover transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 ${highlightedCourseId === c.id ? 'ring-2 ring-pink-primary dark:ring-pink-400 border-pink-primary dark:border-pink-400' : 'border-pink-soft/50 dark:border-white/10'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-text dark:text-[#f5f5f5]">
                        {c.professor?.name ? (
                          <TeacherProfileTooltip teacher={c.professor}>{formatProfessorName(c.professor.name)}</TeacherProfileTooltip>
                        ) : (
                          t('dashboard.student.frenchCourse')
                        )}
                      </p>
                      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">{c.date} {t('dashboard.student.at')} {formatTimeAMPM(c.time)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        to={`/live?courseId=${c.id}`}
                        className="inline-block px-4 py-2 bg-pink-primary dark:bg-pink-400 text-white rounded-xl text-sm hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow"
                      >
                        {t('dashboard.student.join')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div ref={pastRef} className="scroll-mt-6">
        <h2 className="font-medium text-text dark:text-[#f5f5f5] mb-3">{t('dashboard.student.pastCourses')}</h2>
        <div className="space-y-3">
          {past.length === 0 ? (
            <p className="text-text/50 dark:text-[#f5f5f5]/50">{t('dashboard.student.noPast')}</p>
          ) : (
            past.map((c, i) => (
              <div key={c.id} className={`bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border shadow-pink-soft dark:shadow-lg card-hover transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 ${highlightedCourseId === c.id ? 'ring-2 ring-pink-primary dark:ring-pink-400 border-pink-primary dark:border-pink-400' : 'border-pink-soft/50 dark:border-white/10'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-text dark:text-[#f5f5f5]">
                      {c.professor?.name ? (
                        <TeacherProfileTooltip teacher={c.professor}>{formatProfessorName(c.professor.name)}</TeacherProfileTooltip>
                      ) : (
                        t('dashboard.student.frenchCourse')
                      )}
                    </p>
                    <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">{c.date} {t('dashboard.student.at')} {formatTimeAMPM(c.time)}</p>
                    {c.endReason === 'professor_absent' && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">{t('dashboard.admin.endReasonProfessorAbsent')}</p>
                    )}
                  </div>
                  {c.recordingLink ? (
                    <a
                      href={c.recordingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-pink-primary dark:bg-pink-400 text-white rounded-xl text-sm hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow"
                    >
                      {t('dashboard.student.viewRecording')}
                    </a>
                  ) : (
                    <span className="text-text/40 dark:text-[#f5f5f5]/40 text-sm">{t('dashboard.student.noRecording')}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
