import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudentMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    const load = async () => {
      const [msgRes, meRes] = await Promise.all([
        api.get('/student/messages'),
        api.get('/auth/me').catch(() => ({ data: {} })),
      ]);
      setMessages(msgRes.data);
      const profs = msgRes.data
        .flatMap((m) => [m.sender, m.receiver])
        .filter((p) => p && p.id !== user.id);
      const unique = [...new Map(profs.map((p) => [p.id, p])).values()];
      if (meRes.data?.professor && !unique.find((p) => p.id === meRes.data.professor.id)) {
        unique.unshift(meRes.data.professor);
      }
      setProfessors(unique);
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
                {p.name}
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
                {professors.find((p) => p.id === selectedProfessor)?.name}
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
              Select a professor to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
