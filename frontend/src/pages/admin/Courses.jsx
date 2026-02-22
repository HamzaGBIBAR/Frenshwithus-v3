import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Courses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/admin/courses').then((r) => setCourses(r.data));
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">Courses</h1>
      <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pink-soft/30 text-left">
              <th className="p-3 font-medium text-text">Professor</th>
              <th className="p-3 font-medium text-text">Student</th>
              <th className="p-3 font-medium text-text">Date</th>
              <th className="p-3 font-medium text-text">Time</th>
              <th className="p-3 font-medium text-text">Started</th>
              <th className="p-3 font-medium text-text">Meeting Link</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-t border-pink-soft/30 hover:bg-pink-soft/20 transition">
                <td className="p-3 text-text">{c.professor?.name}</td>
                <td className="p-3 text-text">{c.student?.name}</td>
                <td className="p-3 text-text">{c.date}</td>
                <td className="p-3 text-text">{c.time}</td>
                <td className="p-3">{c.isStarted ? <span className="text-green-600">Yes</span> : <span className="text-text/60">No</span>}</td>
                <td className="p-3">
                  {c.meetingLink ? (
                    <a href={c.meetingLink} target="_blank" rel="noreferrer" className="text-pink-primary hover:underline truncate max-w-[150px] block">
                      Link
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
