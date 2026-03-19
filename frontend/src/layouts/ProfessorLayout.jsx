import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MobileMenuButton from '../components/MobileMenuButton';
import ProfessorProfileModal from '../components/ProfessorProfileModal';
import NotificationBell from '../components/NotificationBell';
import ProfessorDashboard from '../pages/professor/Dashboard';
import ProfessorCourses from '../pages/professor/Courses';
import ProfessorMessages from '../pages/professor/Messages';
import DiscussionAdmin from '../pages/professor/DiscussionAdmin';

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2);
}

const navItems = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/professor', label: 'Tableau de bord', end: true },
  { to: '/professor/courses', label: 'Planning' },
  { to: '/professor/messages', label: 'Messages' },
  { to: '/professor/discussion-admin', label: 'Discussion admin' },
];

export default function ProfessorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { user } = useAuth();

  useEffect(() => setAvatarError(false), [user?.avatarUrl]);

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {profileOpen && <ProfessorProfileModal onClose={() => setProfileOpen(false)} />}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm border-b border-pink-soft/50 dark:border-white/10">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <span className="font-semibold text-text dark:text-[#f5f5f5]">French With Us</span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <div className="hidden md:flex sticky top-0 z-20 items-center justify-end gap-3 px-4 sm:px-6 py-3 bg-transparent border-b border-pink-soft/30 dark:border-white/5">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-2 ring-pink-soft/50 dark:ring-white/10 hover:ring-pink-primary/60 dark:hover:ring-pink-400/30 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(231,84,128,0.3)] dark:hover:shadow-[0_0_20px_rgba(244,114,182,0.25)] focus:outline-none focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:ring-offset-2 dark:focus:ring-offset-[#111111] animate-fade-in"
            aria-label="Ouvrir le profil"
          >
            {user?.avatarUrl && !avatarError ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 text-white font-semibold text-sm shadow-inner">
                {getInitials(user?.name)}
              </div>
            )}
            <span className="absolute inset-0 rounded-full bg-pink-primary/0 group-hover:bg-pink-primary/10 dark:group-hover:bg-pink-400/10 transition-colors duration-300" />
          </button>
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-transparent transition-colors duration-500">
        <Routes>
          <Route index element={<ProfessorDashboard />} />
          <Route path="courses" element={<ProfessorCourses />} />
          <Route path="messages" element={<ProfessorMessages />} />
          <Route path="discussion-admin" element={<DiscussionAdmin />} />
        </Routes>
        </main>
      </div>
    </div>
  );
}
