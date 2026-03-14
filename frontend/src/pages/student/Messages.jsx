import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TeacherProfileTooltip from '../../components/TeacherProfileTooltip';
import { useTranslation } from 'react-i18next';
import { getTimezoneByCountry } from '../../utils/countries';
import { useDocumentViewer } from '../../components/DocumentViewer';

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

function isUserOnline(lastActiveAt) {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() <= ONLINE_WINDOW_MS;
}

export default function StudentMessages() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const fileInputRef = useRef(null);
  const { openDocument, ViewerComponent } = useDocumentViewer();
  const studentTimezone = useMemo(
    () => getTimezoneByCountry(user?.country),
    [user?.country]
  );

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

  useEffect(() => {
    const id = setInterval(() => {
      refreshMessages();
      api.get('/student/professors').then((r) => setProfessors(r.data || []));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const conversation = messages
    .filter((m) => m.senderId === selectedProfessor || m.receiverId === selectedProfessor)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const selectedProfessorObj = professors.find((p) => p.id === selectedProfessor) || null;

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
      setErrorMsg(err.response?.data?.error || t('dashboard.messaging.sendFailed'));
    }
  };

  const markAsSeen = async (messageId) => {
    await api.put(`/student/messages/${messageId}/seen`);
    setOpenMenuId(null);
    refreshMessages();
  };

  const archiveMessage = async (messageId) => {
    await api.put(`/student/messages/${messageId}/archive`);
    setOpenMenuId(null);
    refreshMessages();
  };

  const formatMessageDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(i18n.language || 'fr', {
      timeZone: studentTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">
        {t('dashboard.professor.message')}
      </h1>
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="w-full md:w-64 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-colors duration-500">
          <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 font-medium text-text dark:text-[#f5f5f5]">{t('dashboard.messaging.professors')}</div>
          <div className="max-h-80 overflow-y-auto">
            {professors.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfessor(p.id)}
                className={`w-full p-4 text-left transition ${
                  selectedProfessor === p.id
                    ? 'bg-pink-primary/15 dark:bg-pink-400/15 text-pink-primary dark:text-pink-400 font-medium border-l-4 border-pink-primary dark:border-pink-400'
                    : 'text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                <TeacherProfileTooltip teacher={p}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isUserOnline(p.lastActiveAt) ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                    {p.name}
                  </span>
                </TeacherProfileTooltip>
              </button>
            ))}
            {professors.length === 0 && (
              <p className="p-4 text-text/50 dark:text-[#f5f5f5]/50 text-sm">{t('dashboard.messaging.noConversations')}</p>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg flex flex-col min-h-[400px] transition-colors duration-500">
          {selectedProfessor ? (
            <>
              <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 font-medium text-text dark:text-[#f5f5f5]">
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
                <p className={`text-xs mt-1 ${isUserOnline(selectedProfessorObj?.lastActiveAt) ? 'text-emerald-600 dark:text-emerald-400' : 'text-text/50 dark:text-[#f5f5f5]/50'}`}>
                  {isUserOnline(selectedProfessorObj?.lastActiveAt) ? t('dashboard.messaging.online') : t('dashboard.messaging.offline')}
                </p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-pink-soft/10 dark:bg-white/[0.02]">
                {conversation.map((m) => (
                  <div
                    key={m.id}
                    className={`relative max-w-[80%] rounded-2xl p-3 ${
                      m.senderId === user.id
                        ? 'ml-auto bg-pink-primary dark:bg-pink-500 text-white'
                        : 'bg-white dark:bg-[#252525] text-text dark:text-[#f5f5f5] border border-pink-soft/30 dark:border-white/10 shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenuId((prev) => (prev === m.id ? null : m.id))}
                      className={`absolute top-1.5 right-1.5 p-1 rounded-md ${
                        m.senderId === user.id ? 'hover:bg-white/20' : 'hover:bg-pink-soft/40'
                      }`}
                      aria-label="Message actions"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="4" cy="10" r="1.6" />
                        <circle cx="10" cy="10" r="1.6" />
                        <circle cx="16" cy="10" r="1.6" />
                      </svg>
                    </button>
                    {openMenuId === m.id && (
                      <div className="absolute right-1.5 top-8 z-10 bg-white dark:bg-[#1a1a1a] border border-pink-soft/40 dark:border-white/10 rounded-lg shadow-lg min-w-[120px]">
                        {m.senderId !== user.id && !m.isSeen && (
                          <button
                            type="button"
                            onClick={() => markAsSeen(m.id)}
                            className="w-full text-left px-3 py-2 text-xs text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/5"
                          >
                            {t('dashboard.messaging.markSeen')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => archiveMessage(m.id)}
                            className="w-full text-left px-3 py-2 text-xs text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/5"
                        >
                          {t('dashboard.messaging.archive')}
                        </button>
                      </div>
                    )}
                    {m.content && <p className="text-sm">{m.content}</p>}
                    {m.attachmentUrl && (
                      <button
                        type="button"
                        onClick={() => openDocument(m.attachmentUrl, m.attachmentMimeType, m.attachmentName)}
                        className={`inline-flex items-center gap-2 mt-2 text-xs underline cursor-pointer hover:opacity-80 transition ${
                          m.senderId === user.id ? 'text-white/90' : 'text-pink-primary'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                        </svg>
                        {m.attachmentName || t('dashboard.messaging.attachment')}
                      </button>
                    )}
                    <p className="text-xs opacity-70 mt-1">{formatMessageDate(m.createdAt)}</p>
                    {m.senderId === user.id && (
                      <p className="text-[10px] opacity-80 mt-0.5">
                        {m.isSeen ? t('dashboard.messaging.seen') : t('dashboard.messaging.sent')}
                      </p>
                    )}
                  </div>
                ))}
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
                  placeholder={t('dashboard.messaging.typeMessage')}
                  className="flex-1 px-4 py-2.5 border border-pink-soft dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] placeholder:text-text/50 dark:placeholder:text-[#f5f5f5]/70"
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
                  title={t('dashboard.messaging.attachFile')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                  </svg>
                </button>
                <button type="submit" className="px-5 py-2.5 bg-pink-primary text-white rounded-xl hover:bg-pink-dark transition btn-glow">
                  {t('dashboard.messaging.send')}
                </button>
              </form>
              {selectedFile && (
                <div className="px-4 pb-3 text-xs text-text/60 dark:text-[#f5f5f5]/70">
                  {selectedFile.name}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text/50 dark:text-[#f5f5f5]/50">
              {t('dashboard.messaging.selectProfessor')}
            </div>
          )}
        </div>
      </div>
      {ViewerComponent}
    </div>
  );
}
