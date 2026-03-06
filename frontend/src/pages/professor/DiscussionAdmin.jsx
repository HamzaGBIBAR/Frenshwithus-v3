import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function DiscussionAdmin() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadMessages = () =>
    api.get('/professor/admin-discussion').then((r) => setMessages(Array.isArray(r.data) ? r.data : [])).catch(() => setMessages([]));

  useEffect(() => {
    setLoading(true);
    loadMessages().finally(() => setLoading(false));
    const id = setInterval(loadMessages, 12000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!content.trim() && !selectedFile) return;
    setSending(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('file', selectedFile);
        await api.post('/professor/admin-discussion/attachment', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/professor/admin-discussion', { content: content.trim() });
      }
      setContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadMessages();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || t('discussionAdmin.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5]">{t('discussionAdmin.title')}</h1>
          <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mt-0.5">{t('discussionAdmin.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg flex flex-col min-h-[480px] overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Header */}
        <div className="px-4 py-3 border-b border-pink-soft/40 dark:border-white/10 bg-gradient-to-r from-pink-soft/30 to-pink-soft/10 dark:from-pink-500/10 dark:to-pink-500/5 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-pink-primary/20 dark:bg-pink-400/20 flex items-center justify-center ring-2 ring-pink-primary/30 dark:ring-pink-400/30">
            <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-text dark:text-[#f5f5f5]">{t('discussionAdmin.withAdmin')}</p>
            <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{t('discussionAdmin.supportLine')}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-pink-soft/5 dark:bg-white/[0.02] min-h-[280px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-pink-soft/30 dark:bg-pink-500/15 flex items-center justify-center">
                <svg className="w-7 h-7 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-text/50 dark:text-[#f5f5f5]/50 text-center max-w-xs">{t('discussionAdmin.noMessages')}</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div
                    className={`relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                      isMe
                        ? 'bg-pink-primary dark:bg-pink-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-[#252525] text-text dark:text-[#f5f5f5] border border-pink-soft/30 dark:border-white/10 rounded-bl-md'
                    }`}
                  >
                    {m.content?.trim() && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                    {m.attachmentUrl && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`inline-flex items-center gap-2 mt-2 text-xs font-medium underline ${isMe ? 'text-white/90' : 'text-pink-primary dark:text-pink-300'}`}
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
                        </svg>
                        {m.attachmentName || t('discussionAdmin.attachment')}
                      </a>
                    )}
                    <p className={`text-[10px] mt-1.5 ${isMe ? 'text-white/60' : 'text-text/40 dark:text-[#f5f5f5]/40'}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={sendMessage} className="p-4 border-t border-pink-soft/40 dark:border-white/10 bg-white/50 dark:bg-[#111]/50 shrink-0">
          {errorMsg && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2">{errorMsg}</p>
          )}
          <div className="flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('discussionAdmin.placeholder')}
              className="flex-1 px-4 py-2.5 border border-pink-soft/50 dark:border-white/20 rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary bg-white dark:bg-[#1a1a1a] text-text dark:text-[#f5f5f5] placeholder:text-text/40 dark:placeholder:text-[#f5f5f5]/40 transition-all duration-200"
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
              className="px-3 py-2.5 border border-pink-soft/50 dark:border-white/20 rounded-xl text-pink-primary dark:text-pink-300 hover:bg-pink-soft/30 dark:hover:bg-white/10 transition-colors"
              title={t('discussionAdmin.attachFile')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20 13" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={sending || (!content.trim() && !selectedFile)}
              className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            >
              {sending ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('contact.send')
              )}
            </button>
          </div>
          {selectedFile && (
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-2 truncate">{selectedFile.name}</p>
          )}
        </form>
      </div>
    </div>
  );
}
