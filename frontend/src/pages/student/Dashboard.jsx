import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [meetingStatus, setMeetingStatus] = useState({});

  useEffect(() => {
    api.get('/student/courses').then((r) => setCourses(r.data));
    api.get('/student/payments').then((r) => setPayments(r.data));
  }, []);

  const checkMeetingLink = async (courseId) => {
    const { data } = await api.get(`/student/courses/${courseId}/meeting-link`);
    setMeetingStatus((s) => ({ ...s, [courseId]: data }));
  };

  const upcoming = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d >= new Date();
  });

  const past = courses.filter((c) => {
    const d = new Date(`${c.date}T${c.time}`);
    return d < new Date();
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">My Courses</h1>

      <div className="bg-white p-6 rounded-2xl border border-pink-soft/50 shadow-pink-soft mb-6 card-hover">
        <h2 className="text-text/60 text-sm font-medium mb-2">Payment Status</h2>
        <div className="space-y-2">
          {payments.length === 0 ? (
            <p className="text-text/50">No payments yet</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center">
                <span className="font-medium text-text">${p.amount.toFixed(2)}</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {p.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-medium text-text mb-3">Upcoming Courses</h2>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-text/50">No upcoming courses</p>
          ) : (
            upcoming.map((c) => {
              const status = meetingStatus[c.id];
              return (
                <div key={c.id} className="bg-white p-4 rounded-2xl border border-pink-soft/50 shadow-pink-soft card-hover">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-text">{c.professor?.name}</p>
                      <p className="text-sm text-text/60">{c.date} at {c.time}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {!status ? (
                        <button
                          onClick={() => checkMeetingLink(c.id)}
                          className="px-4 py-2 bg-pink-primary text-white rounded-xl text-sm hover:bg-pink-dark transition btn-glow"
                        >
                          Get Meeting Link
                        </button>
                      ) : status.unlocked ? (
                        <a
                          href={status.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition"
                        >
                          Join Meeting
                        </a>
                      ) : (
                        <span className="text-amber-600 text-sm">{status.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h2 className="font-medium text-text mb-3">Past Courses</h2>
        <div className="space-y-3">
          {past.length === 0 ? (
            <p className="text-text/50">No past courses</p>
          ) : (
            past.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-pink-soft/50 shadow-pink-soft card-hover">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-text">{c.professor?.name}</p>
                    <p className="text-sm text-text/60">{c.date} at {c.time}</p>
                  </div>
                  {c.recordingLink ? (
                    <a
                      href={c.recordingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-pink-primary text-white rounded-xl text-sm hover:bg-pink-dark transition btn-glow"
                    >
                      View Recording
                    </a>
                  ) : (
                    <span className="text-text/40 text-sm">No recording yet</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
