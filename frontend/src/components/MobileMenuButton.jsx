export default function MobileMenuButton({ onClick, ariaLabel = 'Open menu' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden p-3 min-h-touch min-w-touch rounded-xl text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 transition active:scale-95"
      aria-label={ariaLabel}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
