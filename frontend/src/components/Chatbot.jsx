import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

const SUGGESTED_QUESTIONS = {
  fr: [
    'Quels sont les tarifs des cours ?',
    'Comment m\'inscrire à un cours ?',
    'Quels niveaux proposez-vous ?',
    'Comment se déroule une séance ?',
    'Proposez-vous une séance d\'essai gratuite ?',
    'Quelle est la durée des cours ?',
  ],
  en: [
    'What are the course prices?',
    'How do I sign up for a course?',
    'What levels do you offer?',
    'How does a session work?',
    'Do you offer a free trial session?',
    'How long are the lessons?',
  ],
  ar: [
    'ما هي أسعار الدورات؟',
    'كيف أسجل في دورة؟',
    'ما المستويات التي تقدمونها؟',
    'كيف تتم الجلسة؟',
    'هل تقدمون جلسة تجريبية مجانية؟',
    'ما مدة الدروس؟',
  ],
  zh: [
    '课程价格是多少？',
    '如何报名课程？',
    '你们提供哪些级别？',
    '一节课如何进行？',
    '你们提供免费试听课吗？',
    '课程时长是多久？',
  ],
};

function ScrollCharacterAvatar({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} flex-shrink-0`} fill="none">
      <circle cx="50" cy="50" r="38" fill="#FADADD" stroke="#E75480" strokeWidth="1.5" className="dark:fill-[#1a1a1a] dark:stroke-pink-400" />
      <ellipse cx="50" cy="32" rx="28" ry="8" fill="#C2185B" className="dark:fill-pink-600" />
      <ellipse cx="50" cy="28" rx="25" ry="6" fill="#E75480" className="dark:fill-pink-500" />
      <circle cx="50" cy="26" r="5" fill="#F4B400" opacity="0.9" />
      <ellipse cx="42" cy="52" rx="3" ry="4" fill="#1F1F1F" className="dark:fill-white" />
      <ellipse cx="58" cy="52" rx="3" ry="4" fill="#1F1F1F" className="dark:fill-white" />
      <path d="M42 62 Q50 68 58 62" stroke="#C2185B" strokeWidth="1.5" fill="none" strokeLinecap="round" className="dark:stroke-white" />
    </svg>
  );
}

export default function Chatbot({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const lang = i18n.language?.slice(0, 2) || 'fr';
  const suggested = SUGGESTED_QUESTIONS[lang] || SUGGESTED_QUESTIONS.fr;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t('chatbot.welcome'),
      }]);
    }
  }, [open, t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content) return;

    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post('/chat', {
        messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
      });
      setMessages((m) => [...m, { id: Date.now(), role: 'assistant', content: data.reply }]);
    } catch (err) {
      const fallback = t('chatbot.error');
      setMessages((m) => [...m, { id: Date.now(), role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md h-[85vh] max-h-[560px] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-pink-soft/50 dark:border-white/10 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-soft/50 dark:border-white/10 bg-pink-soft/20 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <ScrollCharacterAvatar />
            <div>
              <h3 className="font-semibold text-text dark:text-[#f5f5f5]">{t('chatbot.title')}</h3>
              <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">{t('chatbot.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-pink-soft/50 dark:hover:bg-white/10 text-text/70 dark:text-[#f5f5f5]/70 transition"
            aria-label={t('chatbot.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'assistant' && <ScrollCharacterAvatar className="w-8 h-8" />}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-pink-primary dark:bg-pink-400 text-white ml-auto'
                    : 'bg-pink-soft/40 dark:bg-white/10 text-text dark:text-[#f5f5f5]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <ScrollCharacterAvatar className="w-8 h-8" />
              <div className="bg-pink-soft/40 dark:bg-white/10 rounded-2xl px-4 py-2.5">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-primary dark:bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-pink-primary dark:bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-pink-primary dark:bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mb-2">{t('chatbot.suggested')}</p>
            <div className="flex flex-wrap gap-2">
              {suggested.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-pink-soft/50 dark:bg-white/10 text-pink-dark dark:text-pink-400 hover:bg-pink-soft dark:hover:bg-white/20 transition border border-pink-soft/50 dark:border-white/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-pink-soft/50 dark:border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.placeholder')}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-pink-soft dark:border-white/20 bg-transparent text-text dark:text-[#f5f5f5] placeholder:text-text/50 dark:placeholder:text-[#f5f5f5]/50 focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {t('chatbot.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
