import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MobileMenuButton from '../components/MobileMenuButton';
import NotificationBell from '../components/NotificationBell';
import StudentProfileModal from '../components/StudentProfileModal';
import StudentDashboard from '../pages/student/Dashboard';
import StudentMessages from '../pages/student/Messages';

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2);
}

const navItems = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/student', label: 'Mes cours', end: true },
  { to: '/student/messages', label: 'Messages' },
];

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { user } = useAuth();

  useEffect(() => setAvatarError(false), [user?.avatarUrl]);

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {profileOpen && <StudentProfileModal onClose={() => setProfileOpen(false)} />}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm border-b border-pink-soft/50 dark:border-white/10">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <span className="font-semibold text-text dark:text-[#f5f5f5]">French With Us</span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="group relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-pink-soft/50 dark:ring-white/10 hover:ring-pink-primary/60 dark:hover:ring-pink-400/30 transition-all duration-300"
              aria-label="Open profile"
            >
              {user?.avatarUrl && !avatarError ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 text-white font-semibold text-xs">
                  {getInitials(user?.name)}
                </div>
              )}
            </button>
          </div>
        </header>
        <div className="hidden md:flex sticky top-0 z-20 items-center justify-end gap-3 px-4 sm:px-6 py-3 bg-transparent border-b border-pink-soft/30 dark:border-white/5">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-pink-soft/50 dark:ring-white/10 hover:ring-pink-primary/60 dark:hover:ring-pink-400/30 transition-all duration-300 hover:scale-110"
            aria-label="Open profile"
          >
            {user?.avatarUrl && !avatarError ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 text-white font-semibold text-sm">
                {getInitials(user?.name)}
              </div>
            )}
          </button>
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-white/50 dark:bg-[#111111]/80 transition-colors duration-500 scroll-smooth">
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="messages" element={<StudentMessages />} />
        </Routes>
        </main>
      </div>
    </div>
  );
}
