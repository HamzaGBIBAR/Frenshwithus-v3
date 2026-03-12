import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-250 ease-in-out border border-pink-soft/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-pink-soft/40 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] rounded-xl ${className}`}
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-250 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`absolute top-full mt-2 min-w-[160px] rounded-xl border border-pink-soft/50 dark:border-white/10 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-250 ease-in-out origin-top ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
        style={{ zIndex: 50 }}
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelect(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors duration-200 ease-in-out ${
              lang.code === i18n.language
                ? 'bg-pink-soft/60 dark:bg-pink-400/20 text-pink-dark dark:text-pink-400 font-medium'
                : 'text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/10'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
            {lang.code === i18n.language && (
              <svg className="w-4 h-4 ml-auto text-pink-primary dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
