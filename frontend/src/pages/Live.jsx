import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';

const JITSI_DOMAIN = 'meet.jit.si';

export default function Live() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [professorOnline, setProfessorOnline] = useState(false);
  const [showJitsi, setShowJitsi] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const sessionIdRef = useRef(null);
  const socketRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

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

    let cancelled = false;

    async function fetchAccess() {
      try {
        const { data } = await api.get('/live-access');
        if (cancelled) return;
        setAccess(data);
        setProfessorOnline(data.professorOnline);

        if (data.role === 'PROFESSOR') {
          setShowJitsi(true);
        } else if (data.professorOnline) {
          setShowJitsi(true);
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
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || access?.canAccess !== true) return;

    const socketUrl = import.meta.env.DEV ? '' : `${window.location.origin}`;
    const socket = io(socketUrl, {
      path: '/live-socket',
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('professorOnline', ({ online }) => {
      setProfessorOnline(online);
      if (online && user.role === 'STUDENT') {
        setShowJitsi(true);
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
  }, [user, access?.canAccess, showToast, t]);

  useEffect(() => {
    if (!showJitsi || !access?.roomName || !jitsiContainerRef.current) return;

    const isProfessor = user?.role === 'PROFESSOR';
    const displayName = user?.name || 'Participant';

    if (isProfessor) {
      api.post('/live/session/start').then(({ data }) => { sessionIdRef.current = data.sessionId; }).catch(() => {});
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      const jitsiApi = window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: access.roomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
          ],
        },
        userInfo: { displayName },
      });

      jitsiApiRef.current = jitsiApi;

      jitsiApi.addEventListener('videoConferenceLeft', () => {
        if (isProfessor && sessionIdRef.current) {
          api.post('/live/session/end', { sessionId: sessionIdRef.current }).catch(() => {});
          setSessionEnded(true);
        }
        setShowJitsi(false);
      });
    };
    document.body.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [showJitsi, access?.roomName, user?.name, user?.role]);

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
          <p className="text-text dark:text-[#f5f5f5]">{t('dashboard.livePage.accessDenied')}</p>
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

  if (!showJitsi) {
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
      <div className="flex items-center justify-between gap-4 p-4 border-b border-pink-soft/50 dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm">
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
            const jitsiApi = jitsiApiRef.current;
            if (jitsiApi) {
              try {
                jitsiApi.executeCommand('hangup');
              } catch (_) {
                jitsiApi.dispose();
              }
              if (user?.role === 'PROFESSOR' && sessionIdRef.current) {
                api.post('/live/session/end', { sessionId: sessionIdRef.current }).catch(() => {});
                setSessionEnded(true);
              }
              setShowJitsi(false);
            } else {
              setShowJitsi(false);
              if (user?.role === 'PROFESSOR') setSessionEnded(true);
              navigate(user?.role === 'PROFESSOR' ? '/professor' : '/student');
            }
          }}
          className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition"
        >
          {t('dashboard.livePage.leaveRoom')}
        </button>
      </div>
      <div className="flex-1 min-h-0 relative" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}
