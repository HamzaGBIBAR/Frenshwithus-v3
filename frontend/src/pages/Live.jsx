import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const JITSI_DOMAIN = 'meet.jit.si';

export default function Live() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [professorOnline, setProfessorOnline] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endReason, setEndReason] = useState('');
  const sessionIdRef = useRef(null);
  const socketRef = useRef(null);

  const END_REASONS = [
    { value: 'student_absent', key: 'endReasonStudentAbsent' },
    { value: 'completed', key: 'endReasonCompleted' },
    { value: 'meeting_issue', key: 'endReasonMeetingIssue' },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'STUDENT' && user.role !== 'PROFESSOR') {
      setAccess({ canAccess: false });
      setLoading(false);
      return;
    }
    if (!courseId) {
      navigate(user?.role === 'PROFESSOR' ? '/professor/courses' : '/student', { replace: true });
      return;
    }

    let cancelled = false;

    async function fetchAccess() {
      try {
        const { data } = await api.get(`/live-access?courseId=${courseId}`);
        if (cancelled) return;
        setAccess(data);
        setProfessorOnline(data.professorOnline);

        if (data.role === 'PROFESSOR') {
          setShowMeeting(true);
        } else if (data.professorOnline) {
          setShowMeeting(true);
        }
      } catch (err) {
        if (cancelled) return;
        setAccess({ canAccess: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAccess();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate, courseId]);

  useEffect(() => {
    if (!user || access?.canAccess !== true || !courseId) return;

    const socketUrl = import.meta.env.DEV ? '' : `${window.location.origin}`;
    const socket = io(socketUrl, {
      path: '/live-socket',
      withCredentials: true,
      query: { courseId },
    });

    socketRef.current = socket;

    socket.on('professorOnline', ({ online, courseId: evtCourseId }) => {
      if (evtCourseId && evtCourseId !== courseId) return;
      setProfessorOnline(online);
      if (online && user.role === 'STUDENT') {
        setShowMeeting(true);
        showToast(t('dashboard.livePage.professorArrived'));
      }
    });

    socket.on('connect_error', () => {
      console.warn('Live socket connection failed');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, access?.canAccess, courseId, showToast, t]);

  useEffect(() => {
    if (!showMeeting || !access?.courseId) return;
    if (user?.role === 'PROFESSOR') {
      api.post('/live/session/start', { courseId: access.courseId }).then(({ data }) => { sessionIdRef.current = data.sessionId; }).catch(() => {});
    }
  }, [showMeeting, access?.courseId, user?.role]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent text-text dark:text-[#f5f5f5]">
        <p className="text-lg">{t('dashboard.livePage.loading')}</p>
      </div>
    );
  }

  if (!access?.canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 text-center max-w-md">
          <p className="text-text dark:text-[#f5f5f5]">{!courseId ? 'Accédez au cours depuis le planning.' : t('dashboard.livePage.accessDenied')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:opacity-90 transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (sessionEnded && user?.role === 'PROFESSOR') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 text-center max-w-lg animate-fade-in">
          <h2 className="text-xl font-semibold text-text dark:text-[#f5f5f5] mb-2">Session terminée</h2>
          <p className="text-text/80 dark:text-[#f5f5f5]/80 mb-4">La session en direct a été clôturée.</p>
          <button
            onClick={() => navigate(user.role === 'PROFESSOR' ? '/professor' : '/student')}
            className="px-6 py-2 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:opacity-90 transition"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!showMeeting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 text-center max-w-lg animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-soft/50 dark:bg-pink-400/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-pink-primary dark:text-pink-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text dark:text-[#f5f5f5] mb-2">{t('dashboard.livePage.title')}</h2>
          <p className="text-text/80 dark:text-[#f5f5f5]/80 mb-6">{t('dashboard.livePage.professorWaiting')}</p>
          <button
            type="button"
            onClick={() => navigate(user?.role === 'PROFESSOR' ? '/professor' : '/student')}
            className="px-6 py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:opacity-90 transition"
          >
            {t('dashboard.livePage.leaveRoom')}
          </button>
        </div>
      </div>
    );
  }

  const meetingUrl = access?.roomName ? `https://${JITSI_DOMAIN}/${access.roomName}` : '';

  return (
    <div className="min-h-screen flex flex-col bg-transparent p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-pink-soft/50 dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t('dashboard.livePage.professorOnline')}
          </span>
          <span className="text-sm text-text/70 dark:text-[#f5f5f5]/70">{t('dashboard.livePage.title')}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (user?.role === 'PROFESSOR') {
              setShowEndModal(true);
            } else {
              setShowMeeting(false);
              navigate('/student');
            }
          }}
          className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition"
        >
          {t('dashboard.livePage.leaveRoom')}
        </button>
      </div>
      {showEndModal && user?.role === 'PROFESSOR' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-text dark:text-[#f5f5f5] mb-2">{t('dashboard.livePage.endCourseTitle')}</h3>
            <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-4">{t('dashboard.livePage.endCourseDesc')}</p>
            <div className="space-y-3 mb-6">
              {END_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    endReason === r.value
                      ? 'border-pink-primary dark:border-pink-400 bg-pink-soft/40 dark:bg-pink-400/20'
                      : 'border-pink-soft/50 dark:border-white/10 hover:bg-pink-soft/20 dark:hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="endReason"
                    value={r.value}
                    checked={endReason === r.value}
                    onChange={() => setEndReason(r.value)}
                    className="w-4 h-4 text-pink-primary dark:text-pink-400 focus:ring-pink-primary"
                  />
                  <span className="text-sm font-medium text-text dark:text-[#f5f5f5]">{t(`dashboard.livePage.${r.key}`)}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowEndModal(false); setEndReason(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-pink-soft dark:border-white/20 text-text dark:text-[#f5f5f5] font-medium hover:bg-pink-soft/30 dark:hover:bg-white/10 transition"
              >
                {t('dashboard.livePage.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sessionIdRef.current) {
                    api.post('/live/session/end', { sessionId: sessionIdRef.current, endReason: endReason || 'completed' }).catch(() => {});
                  }
                  setShowEndModal(false);
                  setSessionEnded(true);
                }}
                disabled={!endReason}
                className="flex-1 px-4 py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:bg-pink-dark dark:hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {t('dashboard.livePage.confirmEnd')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 p-6 bg-white dark:bg-[#1a1a1a] border border-t-0 border-pink-soft/50 dark:border-white/10 rounded-b-2xl flex flex-col items-center justify-center gap-6">
        <p className="text-text dark:text-[#f5f5f5] text-center">
          {user?.role === 'PROFESSOR' ? t('dashboard.livePage.professorHint') : t('dashboard.livePage.studentHint')}
        </p>
        {meetingUrl && (
          <>
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-pink-primary dark:bg-pink-400 text-white rounded-xl text-lg font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition btn-glow"
            >
              {user?.role === 'PROFESSOR' ? t('dashboard.livePage.openMeeting') : t('dashboard.livePage.joinMeeting')}
            </a>
            <div className="w-full max-w-md">
              <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-2">{t('dashboard.livePage.linkToShare')}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={meetingUrl}
                  className="flex-1 px-4 py-2 rounded-xl border border-pink-soft dark:border-white/20 bg-white dark:bg-[#111111] text-text dark:text-[#f5f5f5] text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(meetingUrl);
                    showToast(t('dashboard.livePage.linkCopied'));
                  }}
                  className="px-4 py-2 bg-pink-soft dark:bg-white/10 text-pink-dark dark:text-pink-300 rounded-xl text-sm font-medium hover:bg-pink-soft/80 dark:hover:bg-white/20 transition"
                >
                  {t('dashboard.livePage.copy')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
