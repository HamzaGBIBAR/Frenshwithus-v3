import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const JAAS_DOMAIN = '8x8.vc';

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
  const [jaasToken, setJaasToken] = useState(null);
  const [jaasAppId, setJaasAppId] = useState(null);
  const [jaasError, setJaasError] = useState(null);
  const [jitsiJoined, setJitsiJoined] = useState(false);
  const sessionIdRef = useRef(null);
  const socketRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

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

        if (data.sessionEnded && data.role === 'PROFESSOR') {
          setSessionEnded(true);
        } else if (data.role === 'PROFESSOR') {
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
      api.post('/live/session/start', { courseId: access.courseId })
        .then(({ data }) => { sessionIdRef.current = data.sessionId; })
        .catch(() => {});
    }

    api.get(`/live/jaas-token?courseId=${access.courseId}`)
      .then(({ data }) => {
        setJaasToken(data.token);
        setJaasAppId(data.appId);
      })
      .catch(() => {
        setJaasError('Impossible de récupérer le token JaaS. Vérifiez la configuration serveur.');
      });
  }, [showMeeting, access?.courseId, user?.role]);

  useEffect(() => {
    if (!jaasToken || !jaasAppId || !jitsiContainerRef.current || !access?.roomName) return;

    setJitsiJoined(false);
    let joined = false;
    const jitsiFallbackTimer = setTimeout(() => {
      if (!joined) {
        setJaasError("Connexion à la salle en cours a pris trop de temps. Réessayez.");
      }
    }, 30000);

    function initJitsi() {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      const roomName = `${jaasAppId}/${access.roomName}`;
      try {
        // eslint-disable-next-line no-undef
        jitsiApiRef.current = new JitsiMeetExternalAPI(JAAS_DOMAIN, {
          roomName,
          jwt: jaasToken,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'chat', 'raisehand', 'tileview', 'select-background', 'stats'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        });

        jitsiApiRef.current.addListener('videoConferenceJoined', () => {
          joined = true;
          setJitsiJoined(true);
        });

        jitsiApiRef.current.addListener('readyToClose', () => {
          if (user?.role === 'PROFESSOR') {
            setShowEndModal(true);
          } else {
            setShowMeeting(false);
            navigate('/student');
          }
        });
      } catch (e) {
        joined = false;
        setJaasError('Erreur lors de l\'initialisation de la salle vidéo.');
      }
    }

    if (typeof JitsiMeetExternalAPI !== 'undefined') {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = `https://${JAAS_DOMAIN}/libs/external_api.min.js`;
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setJaasError("Impossible de charger le script Jitsi.");
      document.head.appendChild(script);
    }

    return () => {
      clearTimeout(jitsiFallbackTimer);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [jaasToken, jaasAppId, access?.roomName, user?.role, navigate]);

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

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-pink-soft/50 dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm">
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

      <div className="flex-1 relative" style={{ height: 'calc(100vh - 57px)' }}>
        {jaasError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-red-200 dark:border-red-800 text-center max-w-md">
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Erreur JaaS</p>
              <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70">{jaasError}</p>
            </div>
          </div>
        ) : !jaasToken ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-pink-primary/30 border-t-pink-primary rounded-full animate-spin" />
              <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">Connexion à la salle en cours…</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={jitsiContainerRef} className="w-full h-full" />
            {!jitsiJoined && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-sm border border-pink-soft/40 dark:border-white/10 p-6 max-w-md">
                  <div className="w-10 h-10 border-2 border-pink-primary/30 border-t-pink-primary rounded-full animate-spin" />
                  <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70 text-center">
                    {t('dashboard.livePage.loading') || 'Connexion à la salle en cours…'}
                  </p>
                  <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50 text-center">
                    Si rien ne s’affiche, attendez quelques secondes ou rechargez.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
