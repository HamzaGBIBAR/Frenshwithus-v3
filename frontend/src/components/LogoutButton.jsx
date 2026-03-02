import { useTranslation } from 'react-i18next';

export default function LogoutButton({ onClick, className = '' }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('nav.logout')}
      className={`
        group relative overflow-hidden
        w-full px-4 py-2.5 rounded-xl
        flex items-center justify-center gap-2.5
        text-sm font-medium
        border-2 border-red-200/60 dark:border-red-500/30
        transition-all duration-300 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10
        hover:from-red-100 hover:to-rose-100 dark:hover:from-red-500/25 dark:hover:to-rose-500/25
        hover:border-red-400/60 dark:hover:border-red-400/50
        text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
        hover:shadow-[0_0_24px_rgba(239,68,68,0.2)] dark:hover:shadow-[0_0_24px_rgba(248,113,113,0.25)]
        animate-fade-in
        ${className}
      `}
    >
      {/* Icône sortie avec animation */}
      <svg
        className="w-5 h-5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span className="font-semibold">{t('nav.logout')}</span>
      {/* Lueur animée au survol */}
      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
    </button>
  );
}
