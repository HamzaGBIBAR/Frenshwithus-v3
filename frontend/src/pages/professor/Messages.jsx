import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ProfessorMessages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const refreshMessages = () => api.get('/professor/messages').then((r) => setMessages(r.data));
  useEffect(() => {
    refreshMessages();
    api.get('/professor/students').then((r) => setStudents(r.data));
  }, []);

  const conversation = messages
    .filter((m) => m.senderId === selectedStudent || m.receiverId === selectedStudent)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if ((!content.trim() && !selectedFile) || !selectedStudent) return;
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('receiverId', selectedStudent);
        formData.append('content', content);
        formData.append('file', selectedFile);
        await api.post('/professor/messages/attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/professor/messages', { receiverId: selectedStudent, content });
      }
      setContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refreshMessages();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Message send failed');
    }
  };

  const selectedName = students.find((s) => s.id === selectedStudent)?.name;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('dashboard.professor.message')}</h1>
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Student list */}
        <div className="w-full md:w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-colors duration-500">
          <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 font-medium text-text dark:text-[#f5f5f5]">
            {t('dashboard.admin.student')}s
          </div>
          <div className="max-h-80 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s.id)}
                className={`w-full p-4 text-left transition-all duration-200 ${
                  selectedStudent === s.id
                    ? 'bg-pink-primary/15 dark:bg-pink-400/15 text-pink-primary dark:text-pink-400 font-medium border-l-4 border-pink-primary dark:border-pink-400'
                    : 'text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                {s.name}
              </button>
            ))}
            {students.length === 0 && (
              <p className="p-4 text-sm text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.professor.noClasses')}</p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg flex flex-col min-h-[400px] transition-colors duration-500">
          {selectedStudent ? (
            <>
              <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pink-primary/15 dark:bg-pink-400/15 flex items-center justify-center">
                  <span className="text-sm font-bold text-pink-primary dark:text-pink-400">{selectedName?.charAt(0)?.toUpperCase()}</span>
                </div>
                <span className="font-medium text-text dark:text-[#f5f5f5]">{selectedName}</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-pink-soft/10 dark:bg-white/[0.02]">
                {conversation.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-text/40 dark:text-[#f5f5f5]/40">{t('dashboard.professor.noClasses')}</p>
                  </div>
                )}
                {conversation.map((m) => {
                  const isMe = m.senderId === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-2xl p-3 animate-fade-in ${
                        isMe
                          ? 'ml-auto bg-pink-primary dark:bg-pink-500 text-white rounded-br-md'
                          : 'bg-white dark:bg-[#252525] text-text dark:text-[#f5f5f5] border border-pink-soft/30 dark:border-white/10 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {m.content && <p className="text-sm leading-relaxed">{m.content}</p>}
                      {m.attachmentUrl && (
                        <a
                          href={m.attachmentUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={`inline-flex items-center gap-2 mt-2 text-xs underline ${
                            isMe ? 'text-white/90' : 'text-pink-primary dark:text-pink-300'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                          </svg>
                          {m.attachmentName || 'Attachment'}
                        </a>
                      )}
                      <p className={`text-[10px] mt-1.5 ${isMe ? 'text-white/60' : 'text-text/40 dark:text-[#f5f5f5]/40'}`}>
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              {errorMsg && (
                <div className="px-4 pt-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
                </div>
              )}
              <form onSubmit={sendMessage} className="p-4 border-t border-pink-soft/50 dark:border-white/10 flex gap-2">
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('dashboard.professor.message') + '...'}
                  className="flex-1 px-4 py-2.5 border border-pink-soft/50 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary bg-white dark:bg-[#111] text-text dark:text-[#f5f5f5] placeholder:text-text/40 dark:placeholder:text-[#f5f5f5]/40 transition-colors duration-300"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".doc,.docx,.xls,.xlsx,.pdf"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2.5 border border-pink-soft/50 dark:border-white/20 rounded-xl text-pink-primary dark:text-pink-300 hover:bg-pink-soft/30 dark:hover:bg-white/10 transition"
                  title="Attach file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                  </svg>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-200 font-medium btn-glow"
                >
                  {t('contact.send')}
                </button>
              </form>
              {selectedFile && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70">
                    {selectedFile.name}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-soft/40 dark:bg-pink-500/15 flex items-center justify-center">
                <svg className="w-7 h-7 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-text/50 dark:text-[#f5f5f5]/50 text-sm font-medium">{t('dashboard.adminMessages.selectStudent')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
