import { useTheme } from '../context/ThemeContext';

function SunIcon({ className = '' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className = '' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative w-10 h-10 flex items-center justify-center rounded-xl
        border border-pink-soft/50 dark:border-white/10
        bg-white/60 dark:bg-white/5
        hover:bg-pink-soft/40 dark:hover:bg-white/10
        hover:scale-105 hover:shadow-lg hover:shadow-pink-200/30 dark:hover:shadow-pink-500/20
        active:scale-95
        text-amber-500 dark:text-amber-400
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a1a1a]
        ${className}
      `}
    >
      {/* Light mode: show sun (click to go light) */}
      {isDark ? (
        <span className="theme-toggle-sun theme-toggle-icon-in inline-flex items-center justify-center w-5 h-5 text-amber-500 dark:text-amber-400">
          <SunIcon className="w-5 h-5" />
        </span>
      ) : (
        <span className="theme-toggle-moon theme-toggle-icon-in inline-flex items-center justify-center w-5 h-5 text-sky-400 dark:text-sky-300">
          <MoonIcon className="w-5 h-5" />
        </span>
      )}
    </button>
  );
}
