import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileMenuButton from '../components/MobileMenuButton';
import NotificationBell from '../components/NotificationBell';
import AdminDashboard from '../pages/admin/Dashboard';
import Professors from '../pages/admin/Professors';
import Students from '../pages/admin/Students';
import Courses from '../pages/admin/Courses';
import Payments from '../pages/admin/Payments';
import Availability from '../pages/admin/Availability';
import Messages from '../pages/admin/Messages';
import Statistics from '../pages/admin/Statistics';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/professors', label: 'Professors' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/availability', label: 'Availability' },
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/statistics', label: 'Statistics' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm border-b border-pink-soft/50 dark:border-white/10">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <span className="font-semibold text-text dark:text-[#f5f5f5]">French With Us</span>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <div className="hidden md:flex sticky top-0 z-20 items-center justify-end px-4 sm:px-6 py-3 bg-transparent border-b border-pink-soft/30 dark:border-white/5">
          <NotificationBell />
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-transparent transition-colors duration-500">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="professors" element={<Professors />} />
          <Route path="students" element={<Students />} />
          <Route path="courses" element={<Courses />} />
          <Route path="payments" element={<Payments />} />
          <Route path="availability" element={<Availability />} />
          <Route path="messages" element={<Messages />} />
          <Route path="statistics" element={<Statistics />} />
        </Routes>
        </main>
      </div>
    </div>
  );
}
