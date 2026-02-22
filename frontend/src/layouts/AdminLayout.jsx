import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AdminDashboard from '../pages/admin/Dashboard';
import Professors from '../pages/admin/Professors';
import Students from '../pages/admin/Students';
import Courses from '../pages/admin/Courses';
import Payments from '../pages/admin/Payments';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/professors', label: 'Professors' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/courses', label: 'Courses' },
  { to: '/admin/payments', label: 'Payments' },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} />
      <main className="flex-1 p-6 overflow-auto bg-pink-bg dark:bg-[#111111] bg-french-pattern min-h-screen transition-colors duration-500">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="professors" element={<Professors />} />
          <Route path="students" element={<Students />} />
          <Route path="courses" element={<Courses />} />
          <Route path="payments" element={<Payments />} />
        </Routes>
      </main>
    </div>
  );
}
