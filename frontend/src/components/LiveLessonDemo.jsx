import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TOTAL_STEPS = 3;

export default function LiveLessonDemo() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showMeaning, setShowMeaning] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'PROFESSOR') return '/professor';
    return '/student';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 animate-fade-in min-h-[400px]">
      {/* Student avatars - left sidebar */}
      <div className="hidden lg:flex flex-col gap-3 flex-shrink-0">
        <div className="w-20 h-24 rounded-2xl bg-pink-soft/50 dark:bg-white/10 overflow-hidden border border-pink-soft/50 dark:border-white/10">
          <img
            src="/images/student-avatar-1.png"
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full bg-pink-soft/60 dark:bg-pink-400/20 flex items-center justify-center">
            <span className="text-2xl">👧</span>
          </div>
        </div>
        <div className="w-20 h-24 rounded-2xl bg-pink-soft/50 dark:bg-white/10 overflow-hidden border border-pink-soft/50 dark:border-white/10">
          <img
            src="/images/student-avatar-2.png"
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full bg-pink-soft/60 dark:bg-pink-400/20 flex items-center justify-center">
            <span className="text-2xl">👦</span>
          </div>
        </div>
      </div>

      {/* Main lesson content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <p className="text-xs font-medium text-text/60 dark:text-[#f5f5f5]/60 mb-2">{t('planning.live.subtitle')}</p>
        <div className="flex-1 rounded-2xl border border-pink-soft/50 dark:border-white/10 overflow-hidden bg-white dark:bg-[#111111]">
          {/* Lesson header */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-pink-primary dark:bg-pink-400 rounded-t-2xl">
            <h3 className="font-semibold text-white text-sm truncate">{t('planning.live.lessonTitle')}</h3>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => { setCurrentStep((s) => Math.max(1, s - 1)); setShowMeaning(false); }}
                disabled={currentStep === 1}
                className="p-1.5 rounded-lg text-white/90 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                aria-label="Précédent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="flex items-center gap-1 text-white/90 text-xs min-w-[2.5rem] justify-center">
                <span>{currentStep}</span>
                <span>/</span>
                <span>{TOTAL_STEPS}</span>
              </span>
              <button
                onClick={() => { setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1)); setShowMeaning(false); }}
                disabled={currentStep === TOTAL_STEPS}
                className="p-1.5 rounded-lg text-white/90 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                aria-label="Suivant"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lesson body */}
          <div className="p-6 lg:p-8">
            {(() => {
              const step = t(`planning.live.steps.${currentStep}`, { returnObjects: true });
              const stepData = typeof step === 'object' ? step : { word: t('planning.live.word'), phonetic: t('planning.live.phonetic'), meaning: t('planning.live.meaning'), vocab: 'maison', vocabMeaning: 'house / home' };
              const vocabEmoji = stepData.vocab === 'maison' ? '🏠' : stepData.vocab === 'livre' ? '📖' : '✨';
              return (
                <>
                  <div className="mb-6">
                    <p className="text-2xl lg:text-3xl font-bold text-pink-primary dark:text-pink-400 mb-1">
                      {stepData.word}
                    </p>
                    <p className="text-sm text-text/70 dark:text-[#f5f5f5]/70">
                      {t('planning.live.pronunciation', { phonetic: stepData.phonetic })}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowMeaning(!showMeaning)}
                    className="w-full max-w-xs rounded-xl px-6 py-4 bg-pink-soft/60 dark:bg-pink-400/20 border-2 border-pink-primary/40 dark:border-pink-400/40 hover:bg-pink-soft/80 dark:hover:bg-pink-400/30 transition-all duration-250 flex flex-col items-center gap-2 group"
                  >
                    <span className="text-xl font-bold text-pink-primary dark:text-pink-400">{stepData.word}</span>
                    <span className="text-xs font-medium text-text/70 dark:text-[#f5f5f5]/70 group-hover:text-pink-primary dark:group-hover:text-pink-400">
                      {t('planning.live.showMeaning')}
                    </span>
                  </button>

                  {showMeaning && (
                    <div className="mt-6 p-4 rounded-xl bg-pink-soft/40 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10 animate-fade-in">
                      <p className="text-sm text-text/90 dark:text-[#f5f5f5]/90">{stepData.meaning}</p>
                      {stepData.vocab && (
                        <div className="mt-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
                            {(stepData.vocab === 'maison' || stepData.vocab === 'livre') ? (
                              <img
                                src={stepData.vocab === 'maison' ? '/images/maison-vocab.png' : '/images/livre-vocab.png'}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`${(stepData.vocab === 'maison' || stepData.vocab === 'livre') ? 'hidden' : ''} w-full h-full bg-pink-soft/50 flex items-center justify-center text-lg`}>
                              {vocabEmoji}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-pink-primary dark:text-pink-400">{stepData.vocab}</p>
                            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">{stepData.vocabMeaning}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            {/* CTA - visible on mobile */}
            <div className="lg:hidden mt-6">
              <Link
                to={getDashboardLink()}
                className="block w-full py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white text-center text-sm font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-250 btn-hover"
              >
                {t('planning.live.joinLesson')}
              </Link>
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center gap-2 mt-8 pt-6 border-t border-pink-soft/50 dark:border-white/10">
              <button
                className="w-10 h-10 rounded-xl bg-pink-soft/50 dark:bg-white/10 hover:bg-pink-soft/70 dark:hover:bg-white/20 flex items-center justify-center text-pink-primary dark:text-pink-400 transition-colors"
                aria-label="Video"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                className="w-10 h-10 rounded-xl bg-pink-soft/50 dark:bg-white/10 hover:bg-pink-soft/70 dark:hover:bg-white/20 flex items-center justify-center text-pink-primary dark:text-pink-400 transition-colors"
                aria-label="Microphone"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                className="w-10 h-10 rounded-xl bg-pink-soft/50 dark:bg-white/10 hover:bg-pink-soft/70 dark:hover:bg-white/20 flex items-center justify-center text-pink-primary dark:text-pink-400 transition-colors"
                aria-label="Share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                className="w-10 h-10 rounded-xl bg-pink-soft/50 dark:bg-white/10 hover:bg-pink-soft/70 dark:hover:bg-white/20 flex items-center justify-center text-pink-primary dark:text-pink-400 transition-colors"
                aria-label="Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher & chat - right sidebar */}
      <div className="hidden lg:flex flex-col gap-4 w-48 flex-shrink-0">
        <div className="rounded-2xl overflow-hidden bg-pink-primary/15 dark:bg-pink-400/15 border border-pink-soft/50 dark:border-white/10">
          <div className="aspect-[3/4] relative">
            <img
              src="/images/teacher-french.png"
              alt=""
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 bg-pink-soft/60 dark:bg-pink-400/20 flex items-center justify-center">
              <span className="text-6xl">👩‍🏫</span>
            </div>
          </div>
          <div className="p-3 flex items-center gap-2 bg-white/80 dark:bg-[#1a1a1a]">
            <div className="w-8 h-8 rounded-full bg-pink-primary/30 dark:bg-pink-400/30 flex items-center justify-center">
              <span className="text-pink-primary dark:text-pink-400 text-xs font-bold">M</span>
            </div>
            <span className="font-medium text-text dark:text-[#f5f5f5] text-sm truncate">{t('planning.live.teacher')}</span>
          </div>
        </div>
        <div className="flex-1 min-h-[120px] rounded-2xl bg-pink-soft/40 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10 flex flex-col">
          <div className="p-3 border-b border-pink-soft/50 dark:border-white/10 flex items-center gap-2">
            <svg className="w-4 h-4 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium text-text/70 dark:text-[#f5f5f5]/70">{t('planning.live.chatPlaceholder')}</span>
          </div>
          <div className="flex-1 p-3" />
        </div>
        <Link
          to={getDashboardLink()}
          className="mt-4 w-full py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white text-center text-sm font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-250 btn-hover"
        >
          {t('planning.live.joinLesson')}
        </Link>
      </div>
    </div>
  );
}
