import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRandomFrenchWord, getTranslation } from '../data/frenchWords';

const MIN_DELAY_MS = 2000;   // Min 2s before first appearance
const MAX_DELAY_MS = 6000;   // Max 6s
const VISIBLE_DURATION_MS = 15000; // Stays visible 15s
const POSITIONS = [
  { bottom: '12%', left: '6%' },
  { bottom: '18%', right: '5%' },
  { bottom: '25%', left: '8%' },
  { bottom: '15%', right: '10%' },
  { bottom: '22%', left: '4%' },
  { bottom: '10%', right: '7%' },
];

export default function FrenchWordBubble() {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [position, setPosition] = useState(POSITIONS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showBubble = useCallback(() => {
    setCurrentWord(getRandomFrenchWord());
    setPosition(POSITIONS[Math.floor(Math.random() * POSITIONS.length)]);
    setVisible(true);
  }, []);

  const hideBubble = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    let showTimer;
    let hideTimer;

    const scheduleNext = () => {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      showTimer = setTimeout(() => {
        showBubble();
        hideTimer = setTimeout(() => {
          hideBubble();
          scheduleNext();
        }, VISIBLE_DURATION_MS);
      }, delay);
    };

    scheduleNext();
    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [showBubble, hideBubble]);

  const handleClick = () => {
    if (currentWord) {
      setModalOpen(true);
      setVisible(false);
    }
  };

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setCurrentWord(null);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onEscape = (e) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [modalOpen, handleCloseModal]);

  if (!mounted) return null;

  return (
    <>
      {/* Floating bubble – appears randomly */}
      {visible && !modalOpen && (
        <button
          type="button"
          onClick={handleClick}
          className="french-word-bubble fixed z-[25] w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-pink-soft/60 dark:border-pink-500/40 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md hover:scale-110 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:ring-offset-2 dark:focus:ring-offset-[#111] cursor-pointer overflow-hidden p-1"
          style={{
            ...position,
            animation: 'frenchWordBubbleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          aria-label={t('frenchWord.discover')}
        >
          <img
            src="/mascot-logo.png"
            alt="French With Us mascot"
            className="w-full h-full object-contain french-word-bubble-img"
            draggable={false}
          />
          <span className="french-word-bubble-pulse absolute inset-0 rounded-2xl border-2 border-pink-primary/30 dark:border-pink-400/30" aria-hidden="true" />
        </button>
      )}

      {/* Modal – French word + translation */}
      {modalOpen && currentWord && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="french-word-title"
        >
          <div
            className="french-word-modal relative w-full max-w-md rounded-2xl shadow-2xl border border-pink-soft/50 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-primary via-pink-dark to-pink-primary dark:from-pink-400 dark:via-pink-500 dark:to-pink-400" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-pink-soft/60 dark:bg-pink-500/20 text-pink-dark dark:text-pink-400 text-xs font-medium uppercase tracking-wider">
                  {t('frenchWord.badge')}
                </span>
              </div>
              <h2 id="french-word-title" className="text-3xl sm:text-4xl font-bold text-pink-primary dark:text-pink-400 mb-2 font-heading" dir="ltr">
                {currentWord.french}
              </h2>
              <p className="text-lg text-text/80 dark:text-[#f5f5f5]/80 mb-6">
                {getTranslation(currentWord, i18n.language)}
              </p>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-pink-soft dark:border-white/20 text-pink-dark dark:text-pink-400 font-medium hover:bg-pink-soft/30 dark:hover:bg-white/10 transition-colors"
              >
                {t('frenchWord.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
