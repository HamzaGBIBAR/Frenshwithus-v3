import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function MascotIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-9 h-9">
      <defs>
        <linearGradient id="notif-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4f96" />
          <stop offset="100%" stopColor="#b100ff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="34" r="24" fill="#121212" stroke="url(#notif-ring)" strokeWidth="2.5" />
      <path d="M14 22c5-10 31-10 36 0c-4 4-9 6-18 6s-14-2-18-6z" fill="#ff4f96" />
      <circle cx="32" cy="19" r="2.2" fill="#ffd83d" />
      <circle cx="26" cy="35" r="2" fill="#f5f5f5" />
      <circle cx="38" cy="35" r="2" fill="#f5f5f5" />
      <path d="M25 42c3 4 11 4 14 0" stroke="#f5f5f5" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const hasUnread = unreadCount > 0;

  const loadNotifications = () =>
    api.get('/notifications').then((r) => {
      setItems(r.data?.notifications || []);
      setUnreadCount(r.data?.unreadCount || 0);
    });

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [items]
  );

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    loadNotifications();
  };

  const archiveNotification = async (id) => {
    await api.delete(`/notifications/${id}`);
    loadNotifications();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    loadNotifications();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-2xl p-1.5 transition-all duration-300 ${
          hasUnread
            ? 'shadow-[0_0_24px_rgba(231,84,128,0.35)] animate-pulse'
            : 'hover:shadow-[0_0_18px_rgba(231,84,128,0.22)]'
        }`}
        aria-label="Notifications"
      >
        <MascotIcon />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-pink-primary text-white text-[10px] font-bold px-1 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[340px] max-w-[90vw] z-50 rounded-2xl border border-pink-soft/50 dark:border-white/10 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl shadow-2xl animate-fade-in overflow-hidden">
          <div className="px-4 py-3 border-b border-pink-soft/40 dark:border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-text dark:text-[#f5f5f5]">Notifications</h3>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-pink-primary dark:text-pink-300 hover:underline"
            >
              Tout lire
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {sortedItems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text/60 dark:text-[#f5f5f5]/60">Aucune notification</p>
            ) : (
              sortedItems.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-pink-soft/30 dark:border-white/10 transition ${
                    n.isRead ? 'bg-transparent' : 'bg-pink-soft/25 dark:bg-pink-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!n.isRead) await markRead(n.id);
                        if (n.link) navigate(n.link);
                        setOpen(false);
                      }}
                      className="text-left flex-1"
                    >
                      <p className="text-sm font-semibold text-text dark:text-[#f5f5f5]">{n.title}</p>
                      <p className="text-xs text-text/70 dark:text-[#f5f5f5]/70 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-text/50 dark:text-[#f5f5f5]/50 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="text-[11px] text-pink-primary dark:text-pink-300 hover:underline"
                        >
                          Vu
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => archiveNotification(n.id)}
                        className="text-[11px] text-text/60 dark:text-[#f5f5f5]/60 hover:underline"
                      >
                        Archiver
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
