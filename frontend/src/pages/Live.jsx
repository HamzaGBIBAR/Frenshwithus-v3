import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const PRIMARY_JAAS_DOMAIN = '8x8.vc';
const FALLBACK_JITSI_DOMAIN = 'meet.jit.si';

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
  const [jitsiDomain, setJitsiDomain] = useState(PRIMARY_JAAS_DOMAIN);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
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
      .catch((err) => {
        console.warn('JaaS token error, deploying fallback to public Jitsi:', err);
        // Fallback to public Jitsi Meet immediately if token fetching fails
        setIsUsingFallback(true);
        setJitsiDomain(FALLBACK_JITSI_DOMAIN);
        setJaasToken('public-fallback-token'); // Dummy token to trigger next useEffect
        setJaasAppId('frenchwithus-public');
      });
  }, [showMeeting, access?.courseId, user?.role]);

  useEffect(() => {
    if (!jaasToken || !jaasAppId || !jitsiContainerRef.current || !access?.roomName) return;

    setJitsiJoined(false);
    let joined = false;
    const jitsiFallbackTimer = setTimeout(() => {
      if (!joined) {
        setJaasError("La connexion à la salle prend plus de temps que prévu. Réessayez ou vérifiez votre connexion.");
      }
    }, 30000);

    function initJitsi() {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      const roomName = isUsingFallback 
        ? `FrenchWithUs-${access.roomName}-${courseId}`
        : `${jaasAppId}/${access.roomName}`;
        
      try {
        // eslint-disable-next-line no-undef
        jitsiApiRef.current = new JitsiMeetExternalAPI(jitsiDomain, {
          roomName,
          ...(isUsingFallback ? {} : { jwt: jaasToken }),
          userInfo: {
            displayName: user?.name || 'Utilisateur',
            email: user?.email || ''
          },
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
          setJaasError(null);
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
        console.error('Jitsi init error:', e);
        if (!isUsingFallback) {
          triggerFallback();
        } else {
          setJaasError('Erreur lors de l\'initialisation de la salle vidéo publique.');
        }
      }
    }

    function triggerFallback() {
      console.warn('Triggering Jitsi Fallback script load...');
      setIsUsingFallback(true);
      setJitsiDomain(FALLBACK_JITSI_DOMAIN);
      
      const script = document.createElement('script');
      script.src = `https://${FALLBACK_JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setJaasError('Impossible de charger le script Jitsi de secours.');
      document.head.appendChild(script);
    }

    if (typeof JitsiMeetExternalAPI !== 'undefined') {
      initJitsi();
    } else {
      const script = document.createElement('script');
      script.src = isUsingFallback 
        ? `https://${FALLBACK_JITSI_DOMAIN}/external_api.js`
        : `https://${PRIMARY_JAAS_DOMAIN}/libs/external_api.min.js`;
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => {
        if (!isUsingFallback) {
          triggerFallback();
        } else {
          setJaasError("Impossible de charger le script Jitsi (bloqué par le navigateur ou problème réseau).");
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      clearTimeout(jitsiFallbackTimer);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [jaasToken, jaasAppId, access?.roomName, user, navigate, jitsiDomain, isUsingFallback, courseId]);

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
          <div className="absolute inset-0 flex items-center justify-center p-4 rounded-xl bg-black/40 backdrop-blur-sm z-10 transition-all animate-fade-in">
            <div className="p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-red-200 dark:border-red-800/50 shadow-2xl text-center max-w-md w-full animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text dark:text-[#f5f5f5] mb-2">Erreur de connexion Jitsi</h3>
              <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70 mb-6">{jaasError}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition shadow-lg shadow-pink-primary/20"
                >
                  Rafraîchir la page
                </button>
                <button
                  onClick={() => {
                    if (user?.role === 'PROFESSOR') {
                      setShowEndModal(true);
                      setJaasError(null);
                    } else {
                      navigate('/student');
                    }
                  }}
                  className="w-full px-6 py-3 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft dark:border-white/10 text-text dark:text-[#f5f5f5] font-medium hover:bg-pink-soft/50 dark:hover:bg-white/10 transition"
                >
                  Quitter la salle
                </button>
              </div>
            </div>
          </div>
        ) : !jaasToken ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 bg-white/50 dark:bg-[#1a1a1a]/50 p-6 rounded-2xl backdrop-blur-sm border border-pink-soft/30 dark:border-white/5">
              <div className="w-12 h-12 border-[3px] border-pink-primary/20 dark:border-pink-400/20 border-t-pink-primary dark:border-t-pink-400 rounded-full animate-spin" />
              <p className="text-sm font-medium text-text/80 dark:text-[#f5f5f5]/80">Initialisation de la salle…</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={jitsiContainerRef} className="w-full h-full" />
            {!jitsiJoined && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md border border-pink-soft/40 dark:border-white/10 p-8 max-w-md shadow-2xl">
                  <div className="w-12 h-12 border-[3px] border-pink-primary/20 border-t-pink-primary rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-base font-semibold text-text dark:text-[#f5f5f5] mb-1">
                      {t('dashboard.livePage.loading') || 'Connexion à la salle en cours…'}
                    </p>
                    <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">
                      {isUsingFallback ? 'Utilisation du serveur de secours (meet.jit.si)...' : 'Préparation du flux vidéo sécurisé...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
