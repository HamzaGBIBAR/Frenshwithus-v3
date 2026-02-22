import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`px-3 py-1.5 text-sm font-medium transition-all duration-300 border border-pink-soft/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-pink-soft/40 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] flex items-center justify-center rounded-xl ${className}`}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
