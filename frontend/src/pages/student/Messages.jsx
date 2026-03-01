import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TeacherProfileTooltip from '../../components/TeacherProfileTooltip';

export default function StudentMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    const load = async () => {
      const [msgRes, profsRes] = await Promise.all([
        api.get('/student/messages'),
        api.get('/student/professors'),
      ]);
      setMessages(msgRes.data);
      setProfessors(profsRes.data);
    };
    load();
  }, [user.id]);

  const conversation = messages
    .filter((m) => m.senderId === selectedProfessor || m.receiverId === selectedProfessor)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedProfessor) return;
    await api.post('/student/messages', { receiverId: selectedProfessor, content });
    setContent('');
    api.get('/student/messages').then((r) => setMessages(r.data));
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">Messages</h1>
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="w-full md:w-64 bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft overflow-hidden">
          <div className="p-4 border-b border-pink-soft/50 font-medium text-text">Professors</div>
          <div className="max-h-80 overflow-y-auto">
            {professors.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfessor(p.id)}
                className={`w-full p-4 text-left hover:bg-pink-soft/30 transition ${selectedProfessor === p.id ? 'bg-pink-soft/60 text-pink-dark font-medium border-l-4 border-pink-primary' : 'text-text'}`}
              >
                <TeacherProfileTooltip teacher={p}>{p.name}</TeacherProfileTooltip>
              </button>
            ))}
            {professors.length === 0 && (
              <p className="p-4 text-text/50 text-sm">No conversations yet</p>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-pink-soft/50 shadow-pink-soft flex flex-col min-h-[400px]">
          {selectedProfessor ? (
            <>
              <div className="p-4 border-b border-pink-soft/50 font-medium text-text">
                {(() => {
                  const prof = professors.find((p) => p.id === selectedProfessor);
                  return prof ? (
                    <TeacherProfileTooltip teacher={prof}>
                      <span className="cursor-default">{prof.name}</span>
                    </TeacherProfileTooltip>
                  ) : (
                    <span>—</span>
                  );
                })()}
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
                  className="flex-1 px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] placeholder:text-text/50 dark:placeholder:text-[#f5f5f5]/70"
                />
                <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text/50">
              Select a professor to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
