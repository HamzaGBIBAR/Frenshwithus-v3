import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Calendar from '../../components/Calendar';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getCourseStatus(course) {
  const now = new Date();
  const d = new Date(`${course.date}T${course.time}`);
  if (d < now) return 'completed';
  const twoHours = 2 * 60 * 60 * 1000;
  if (course.isStarted && d <= now && now - d < twoHours) return 'live';
  return 'upcoming';
}

export default function ProfessorCourses() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentId: '', date: '', time: '', meetingLink: '' });
  const [editingLink, setEditingLink] = useState(null);
  const [linkValue, setLinkValue] = useState('');
  const [recordingFor, setRecordingFor] = useState(null);
  const [recordingValue, setRecordingValue] = useState('');
  const [viewMode, setViewMode] = useState('mois'); // mois | semaine | jour
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().slice(0, 10);
  });

  const load = () => {
    api.get('/professor/courses').then((r) => setCourses(r.data));
    api.get('/professor/students').then((r) => setStudents(r.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/professor/courses', form);
    setForm({ studentId: '', date: '', time: '', meetingLink: '' });
    load();
  };

  const startCourse = async (id) => {
    await api.put(`/professor/courses/${id}/start`);
    load();
  };

  const saveMeetingLink = async (id) => {
    await api.put(`/professor/courses/${id}/meeting-link`, { meetingLink: linkValue });
    setEditingLink(null);
    setLinkValue('');
    load();
  };

  const saveRecording = async (id) => {
    await api.put(`/professor/courses/${id}/recording`, { recordingLink: recordingValue });
    setRecordingFor(null);
    setRecordingValue('');
    load();
  };

  const openEditLink = (c) => {
    setEditingLink(c.id);
    setLinkValue(c.meetingLink || '');
  };

  const openRecording = (c) => {
    setRecordingFor(c.id);
    setRecordingValue(c.recordingLink || '');
  };

  const today = new Date().toISOString().slice(0, 10);

  const calendarEvents = courses.map((c) => ({
    id: c.id,
    date: c.date,
    title: c.student?.name || 'Cours de français',
    time: c.time,
  }));
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const coursesInWeek = courses.filter((c) => {
    const cd = new Date(c.date + 'T12:00:00');
    return cd >= weekStartDate && cd <= weekEndDate;
  });

  const coursesByDay = DAYS.map((_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      day: DAYS[i],
      dateStr,
      isToday: dateStr === today,
      courses: coursesInWeek.filter((c) => c.date === dateStr).sort((a, b) => a.time.localeCompare(b.time)),
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text">Planning</h1>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-2xl border border-pink-soft/50 shadow-pink-soft mb-6"
      >
        <h2 className="font-medium text-text mb-4">Create Course</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <select
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary"
            required
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary"
            required
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary"
            required
          />
          <input
            placeholder="Meeting link (optional)"
            value={form.meetingLink}
            onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))}
            className="px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary"
          />
        </div>
        <button type="submit" className="mt-4 px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
          Create Course
        </button>
      </form>

      {viewMode === 'mois' ? (
        <Calendar
          events={calendarEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          viewMode="mois"
          onViewModeChange={setViewMode}
        />
      ) : viewMode === 'semaine' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft p-4 flex gap-2">
            <button onClick={() => setViewMode('mois')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 text-text hover:bg-pink-soft/70 transition">
              Mois
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-primary text-white">
              Semaine
            </button>
            <button onClick={() => setViewMode('jour')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 text-text hover:bg-pink-soft/70 transition">
              Jour
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={prevWeek} className="px-4 py-2 text-pink-primary hover:bg-pink-soft/50 rounded-xl transition font-medium">
              ← Previous
            </button>
            <span className="font-medium text-text">
              {weekStartDate.toLocaleDateString('en-US', { month: 'short' })} {weekStartDate.getDate()} – {weekEndDate.toLocaleDateString('en-US', { month: 'short' })} {weekEndDate.getDate()}, {weekStartDate.getFullYear()}
            </span>
            <button onClick={nextWeek} className="px-4 py-2 text-pink-primary hover:bg-pink-soft/50 rounded-xl transition font-medium">
              Next →
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-32 flex-shrink-0">
              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div key={day} className="h-24 flex items-center font-medium text-text/80 text-sm">
                    {day}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {coursesByDay.map(({ day, dateStr, isToday, courses: dayCourses }) => (
                <div
                  key={day}
                  className={`min-h-24 rounded-2xl p-4 transition ${isToday ? 'bg-pink-soft/60 ring-2 ring-pink-primary/30' : 'bg-white border border-pink-soft/50'}`}
                >
                  <div className="text-xs text-text/50 mb-2">{dateStr}</div>
                  <div className="space-y-2">
                    {dayCourses.length === 0 ? (
                      <p className="text-sm text-text/40">No courses</p>
                    ) : (
                      dayCourses.map((c) => {
                        const status = getCourseStatus(c);
                        return (
                          <div
                            key={c.id}
                            className="bg-gradient-to-r from-pink-soft to-white rounded-xl p-3 border border-pink-soft/50 card-hover shadow-pink-soft"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-medium text-text">{c.student?.name}</span>
                                <span className="text-sm text-text/60 ml-2">{c.time}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                                status === 'live' ? 'bg-green-100 text-green-800' :
                                status === 'upcoming' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {status === 'live' ? 'Live' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editingLink === c.id ? (
                                <div className="flex gap-2 flex-1">
                                  <input
                                    type="url"
                                    value={linkValue}
                                    onChange={(e) => setLinkValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-pink-soft rounded-lg text-xs"
                                    autoFocus
                                  />
                                  <button onClick={() => saveMeetingLink(c.id)} className="text-green-600 text-sm">✓</button>
                                  <button onClick={() => setEditingLink(null)} className="text-text/50 text-sm">✕</button>
                                </div>
                              ) : (
                                <button onClick={() => openEditLink(c)} className="text-xs text-pink-primary hover:underline">
                                  {c.meetingLink ? 'Edit link' : 'Add link'}
                                </button>
                              )}
                              {recordingFor === c.id ? (
                                <div className="flex gap-2 flex-1">
                                  <input
                                    type="url"
                                    placeholder="Recording URL"
                                    value={recordingValue}
                                    onChange={(e) => setRecordingValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-pink-soft rounded-lg text-xs"
                                    autoFocus
                                  />
                                  <button onClick={() => saveRecording(c.id)} className="text-green-600 text-sm">✓</button>
                                  <button onClick={() => setRecordingFor(null)} className="text-text/50 text-sm">✕</button>
                                </div>
                              ) : (
                                <button onClick={() => openRecording(c)} className="text-xs text-pink-primary hover:underline">
                                  {c.recordingLink ? 'Edit recording' : 'Add recording'}
                                </button>
                              )}
                              {!c.isStarted && status === 'upcoming' && (
                                <button
                                  onClick={() => startCourse(c.id)}
                                  className="px-2 py-1 bg-pink-primary text-white rounded-lg text-xs hover:bg-pink-dark transition"
                                >
                                  Start Course
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft p-4 flex gap-2">
            <button onClick={() => setViewMode('mois')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 text-text hover:bg-pink-soft/70 transition">
              Mois
            </button>
            <button onClick={() => setViewMode('semaine')} className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 text-text hover:bg-pink-soft/70 transition">
              Semaine
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-primary text-white">
              Jour
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft p-8 text-center text-text/60">
            Vue Jour (bientôt disponible)
          </div>
        </div>
      )}
    </div>
  );
}
