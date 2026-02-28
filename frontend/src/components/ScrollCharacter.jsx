import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Chatbot from './Chatbot';

/**
 * ScrollCharacter – personnage qui affiche la section "Restons en contact"
 * Apparaît quand on scroll jusqu'à la section Contact.
 * Cliquable : ouvre un chatbot AI pour poser des questions sur French With Us.
 * Design: version simplifiée (tête + béret) du HeroCharacter
 */
const EXIT_DURATION = 500;

export default function ScrollCharacter() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.slice(0, 2) === 'ar';
  const [contactVisible, setContactVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (contactVisible) {
      setContentVisible(true);
    } else {
      const timer = setTimeout(() => setContentVisible(false), EXIT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [contactVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', handler);

    const contactEl = document.getElementById('contact');
    if (!contactEl) {
      return () => mq.removeEventListener('change', handler);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setContactVisible(true);
        else setContactVisible(false);
      },
      { threshold: 0.2, rootMargin: '0px 0px -80px 0px' }
    );

    observer.observe(contactEl);
    return () => {
      mq.removeEventListener('change', handler);
      observer.disconnect();
    };
  }, []);

  if (reduceMotion) return null;

  return (
    <>
      <div
        className={`scroll-character-wrapper fixed top-[18%] z-[10] flex flex-col items-center gap-1 transition-all duration-500 ease-out ${
          isRtl ? 'right-[4%] lg:right-[6%]' : 'left-[4%] lg:left-[6%]'
        } ${
          contactVisible
            ? 'opacity-100 translate-x-0 pointer-events-auto'
            : `opacity-0 pointer-events-none ${isRtl ? 'translate-x-12' : '-translate-x-12'}`
        }`}
      >
        {contentVisible && (
        <div className="scroll-character-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 32" className="w-8 h-10 lg:w-10 lg:h-12 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M6 18l6 6 6-6" />
          </svg>
        </div>
        )}
        {contentVisible && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="scroll-character scroll-character--contact scroll-character--flash w-20 h-20 lg:w-24 lg:h-24 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:ring-offset-2 dark:focus:ring-offset-[#111] cursor-pointer hover:scale-110 transition-transform duration-300"
          aria-label="Ouvrir l'assistant Chat Bot – poser une question"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full scroll-character-svg" fill="none">
            {/* Tête – light: rose clair | dark: gris foncé + contour rose lumineux */}
            <circle cx="50" cy="50" r="38" fill="#FADADD" stroke="#E75480" strokeWidth="1.5" className="scroll-character-face" />
            {/* Béret – rose, pompon jaune */}
            <ellipse cx="50" cy="32" rx="28" ry="8" fill="#C2185B" className="dark:fill-pink-600" />
            <ellipse cx="50" cy="28" rx="25" ry="6" fill="#E75480" className="dark:fill-pink-500" />
            <circle cx="50" cy="26" r="5" fill="#F4B400" opacity="0.9" />
            {/* Yeux – light: noir | dark: blanc */}
            <ellipse cx="42" cy="52" rx="3" ry="4" fill="#1F1F1F" className="scroll-character-eyes" />
            <ellipse cx="58" cy="52" rx="3" ry="4" fill="#1F1F1F" className="scroll-character-eyes" />
            {/* Sourire – light: rose | dark: blanc */}
            <path d="M42 62 Q50 68 58 62" stroke="#C2185B" strokeWidth="1.5" fill="none" strokeLinecap="round" className="scroll-character-smile" />
          </svg>
        </button>
        )}
        {contentVisible && (
        <span className="scroll-character-label scroll-character-label--neon font-sans text-pink-primary dark:text-pink-400 font-semibold text-xs tracking-wider uppercase" dir="auto">
          {t('chatbot.logoLabel')}
        </span>
        )}
      </div>

      <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
