import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ProfessorDashboard() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/professor/courses').then((r) => setCourses(r.data));
  }, []);

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">Dashboard</h1>
      <div className="bg-white p-6 rounded-2xl border border-pink-soft/50 shadow-pink-soft mb-6 card-hover">
        <h2 className="text-text/60 text-sm font-medium">Upcoming Courses</h2>
        <p className="text-2xl font-bold text-pink-primary mt-1">{upcoming.length}</p>
      </div>
      <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft overflow-hidden">
        <div className="p-4 border-b border-pink-soft/50 flex justify-between items-center">
          <h2 className="font-semibold text-text">My Courses</h2>
          <Link to="/professor/courses" className="text-sm text-pink-primary hover:underline font-medium">
            Manage courses
          </Link>
        </div>
        <div className="overflow-x-auto responsive-table-wrap">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="bg-pink-soft/30 text-left">
                <th className="p-3 font-medium text-text">Student</th>
                <th className="p-3 font-medium text-text">Date</th>
                <th className="p-3 font-medium text-text">Time</th>
                <th className="p-3 font-medium text-text">Started</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 10).map((c) => (
                <tr key={c.id} className="border-t border-pink-soft/30 hover:bg-pink-soft/20 transition">
                  <td className="p-3 text-text">{c.student?.name}</td>
                  <td className="p-3 text-text">{c.date}</td>
                  <td className="p-3 text-text">{c.time}</td>
                  <td className="p-3">{c.isStarted ? <span className="text-green-600">Yes</span> : <span className="text-text/60">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
