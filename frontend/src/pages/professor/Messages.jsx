import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ProfessorMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    api.get('/professor/messages').then((r) => setMessages(r.data));
    api.get('/professor/students').then((r) => setStudents(r.data));
  }, []);

  const conversation = messages
    .filter((m) => m.senderId === selectedStudent || m.receiverId === selectedStudent)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedStudent) return;
    await api.post('/professor/messages', { receiverId: selectedStudent, content });
    setContent('');
    api.get('/professor/messages').then((r) => setMessages(r.data));
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">Messages</h1>
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="w-full md:w-64 bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft overflow-hidden">
          <div className="p-4 border-b border-pink-soft/50 font-medium text-text">Students</div>
          <div className="max-h-80 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s.id)}
                className={`w-full p-4 text-left hover:bg-pink-soft/30 transition ${selectedStudent === s.id ? 'bg-pink-soft/60 text-pink-dark font-medium border-l-4 border-pink-primary' : 'text-text'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft flex flex-col min-h-[400px]">
          {selectedStudent ? (
            <>
              <div className="p-4 border-b border-pink-soft/50 font-medium text-text">
                {students.find((s) => s.id === selectedStudent)?.name}
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {conversation.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      m.senderId === user.id
                        ? 'ml-auto bg-pink-primary text-white'
                        : 'bg-pink-soft/50 text-text'
                    }`}
                  >
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-pink-soft/50 flex gap-2">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-pink-soft rounded-xl focus:ring-2 focus:ring-pink-primary focus:border-pink-primary"
                />
                <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text/50">
              Select a student to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
