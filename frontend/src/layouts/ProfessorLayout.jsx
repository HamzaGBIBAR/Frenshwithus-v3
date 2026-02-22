import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfessorDashboard from '../pages/professor/Dashboard';
import ProfessorCourses from '../pages/professor/Courses';
import ProfessorMessages from '../pages/professor/Messages';

const navItems = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/professor', label: 'Tableau de bord', end: true },
  { to: '/professor/courses', label: 'Planning' },
  { to: '/professor/messages', label: 'Messages' },
];

export default function ProfessorLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} />
      <main className="flex-1 p-6 overflow-auto bg-transparent min-h-screen transition-colors duration-500">
        <Routes>
          <Route index element={<ProfessorDashboard />} />
          <Route path="courses" element={<ProfessorCourses />} />
          <Route path="messages" element={<ProfessorMessages />} />
        </Routes>
      </main>
    </div>
  );
}
