import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileMenuButton from '../components/MobileMenuButton';
import StudentDashboard from '../pages/student/Dashboard';
import StudentMessages from '../pages/student/Messages';

const navItems = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/student', label: 'Mes cours', end: true },
  { to: '/live', label: 'Cours en direct' },
  { to: '/student/messages', label: 'Messages' },
];

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm border-b border-pink-soft/50 dark:border-white/10">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <span className="font-semibold text-text dark:text-[#f5f5f5]">French With Us</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-transparent transition-colors duration-500">
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="messages" element={<StudentMessages />} />
        </Routes>
        </main>
      </div>
    </div>
  );
}
