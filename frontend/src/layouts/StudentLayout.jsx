import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StudentDashboard from '../pages/student/Dashboard';
import StudentMessages from '../pages/student/Messages';

const navItems = [
  { to: '/student', label: 'My Courses', end: true },
  { to: '/student/messages', label: 'Messages' },
];

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} />
      <main className="flex-1 p-6 overflow-auto bg-pink-bg dark:bg-[#111111] bg-french-pattern min-h-screen transition-colors duration-500">
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="messages" element={<StudentMessages />} />
        </Routes>
      </main>
    </div>
  );
}
