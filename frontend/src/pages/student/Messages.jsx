import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TeacherProfileTooltip from '../../components/TeacherProfileTooltip';
import { useTranslation } from 'react-i18next';

export default function StudentMessages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const refreshMessages = () => api.get('/student/messages').then((r) => setMessages(r.data));
  useEffect(() => {
    const load = async () => {
      const [, profsRes] = await Promise.all([
        refreshMessages(),
        api.get('/student/professors'),
      ]);
      setProfessors(profsRes?.data || []);
    };
    load();
  }, [user.id]);

  const conversation = messages
    .filter((m) => m.senderId === selectedProfessor || m.receiverId === selectedProfessor)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const sendMessage = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if ((!content.trim() && !selectedFile) || !selectedProfessor) return;
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('receiverId', selectedProfessor);
        formData.append('content', content);
        formData.append('file', selectedFile);
        await api.post('/student/messages/attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/student/messages', { receiverId: selectedProfessor, content });
      }
      setContent('');
      setSelectedFile(null);
      refreshMessages();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Message send failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text mb-6">{t('dashboard.professor.message')}</h1>
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
                    {m.content && <p className="text-sm">{m.content}</p>}
                    {m.attachmentUrl && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`inline-flex items-center gap-2 mt-2 text-xs underline ${
                          m.senderId === user.id ? 'text-white/90' : 'text-pink-primary'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                        </svg>
                        {m.attachmentName || 'Attachment'}
                      </a>
                    )}
                    <p className="text-xs opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              {errorMsg && (
                <div className="px-4 pt-3">
                  <p className="text-xs text-red-600">{errorMsg}</p>
                </div>
              )}
              <form onSubmit={sendMessage} className="p-4 border-t border-pink-soft/50 flex gap-2">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] placeholder:text-text/50 dark:placeholder:text-[#f5f5f5]/70"
                />
                <input
                  type="file"
                  accept=".doc,.docx,.xls,.xlsx,.pdf"
                  className="text-xs"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
                  Send
                </button>
              </form>
              {selectedFile && (
                <div className="px-4 pb-3 text-xs text-text/60">
                  {selectedFile.name}
                </div>
              )}
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
