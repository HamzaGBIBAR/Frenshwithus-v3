import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import LogoutButton from './LogoutButton';
import AnimatedEye from './AnimatedEye';

const SCROLL_GLASS = 40;
const SCROLL_COMPACT = 120;
const THROTTLE_MS = 16;

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollY / docHeight) * 100, 100) : 0);
      lastScrollRef.current = scrollY;
    };

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return progress;
}

function useScrollState() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const update = () => setScrollY(window.scrollY);

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        update();
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    atTop: scrollY < SCROLL_GLASS,
    showGlass: scrollY >= SCROLL_GLASS,
    compact: scrollY >= SCROLL_COMPACT,
  };
}

const NavLink = ({ href, children }) => (
  <a
    href={href}
    onClick={(e) => {
      if (href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    }}
    className="nav-link-item group relative px-3 py-2 text-sm font-medium text-text/80 dark:text-[#f5f5f5]/80 hover:text-pink-primary dark:hover:text-pink-400 transition-all duration-300 hover:scale-105"
  >
    {children}
    <span className="nav-link-underline absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-pink-primary dark:bg-pink-400 rounded-full transition-all duration-300 group-hover:w-3/4" />
  </a>
);

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const progress = useScrollProgress();
  const { atTop, showGlass, compact } = useScrollState();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'PROFESSOR') return '/professor';
    return '/student';
  };

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = useCallback(() => {
    closeMobile();
    logout();
  }, [closeMobile, logout]);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out
          ${atTop ? 'bg-transparent border-b border-transparent shadow-none' : ''}
          ${showGlass ? 'nav-glass' : ''}
          ${compact ? 'nav-compact' : 'nav-expanded'}
        `}
      >
        {/* Scroll progress indicator */}
        <div
          className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-pink-primary via-pink-dark to-pink-primary dark:from-pink-400 dark:via-pink-500 dark:to-pink-400 transition-opacity duration-300"
          style={{
            width: `${progress}%`,
            opacity: showGlass ? 1 : 0,
          }}
        />

        <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-2 min-w-0 transition-all duration-500">
          {/* Logo */}
          <Link to="/" className="flex flex-col gap-0.5 min-w-0 flex-shrink group" dir="ltr">
            <span className="logo-sequence text-lg xs:text-xl sm:text-2xl font-semibold text-text dark:text-[#f5f5f5] flex items-baseline gap-1 min-w-0">
              <span className="logo-part font-bold text-text dark:text-[#f5f5f5] truncate opacity-100">French</span>
              <span className="logo-part text-sm xs:text-base font-light text-text/50 dark:text-[#f5f5f5]/60 lowercase shrink-0 opacity-100">with</span>
              <span className="logo-part shrink-0 opacity-100">
                <AnimatedEye variant="hero" show={true} />
              </span>
            </span>
            <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50 font-normal hidden xs:block truncate">{t('nav.tagline')}</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            <NavLink href="#about">{t('nav.about', 'About')}</NavLink>
            <NavLink href="#pricing">{t('nav.pricing', 'Pricing')}</NavLink>
            <NavLink href="#contact">{t('nav.contact', 'Contact')}</NavLink>
          </nav>

          {/* Right side: actions */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcher className="rounded-full shrink-0" />
            <ThemeToggle className="rounded-full shrink-0" />
            {user && (
              <LogoutButton onClick={handleLogout} compact className="border-red-300/50 dark:border-red-500/40 shrink-0" />
            )}
            {user ? (
              <button
                type="button"
                onClick={() => { window.location.href = getDashboardLink(); }}
                className="px-3 xs:px-4 sm:px-6 py-2 sm:py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-full hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-300 btn-glow btn-hover shadow-pink-soft font-medium text-xs sm:text-sm min-h-[44px] whitespace-nowrap flex items-center justify-center shrink-0 hover:scale-[1.03] active:scale-[0.98]"
              >
                {t('nav.dashboard')}
              </button>
            ) : (
              <>
                <Link
                  to="/reservation"
                  onClick={closeMobile}
                  className="reservation-nav-btn reservation-nav-btn-shine relative overflow-hidden px-2.5 xs:px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs min-h-[40px] sm:min-h-[44px] whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-r from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-500 text-white shadow-md shadow-pink-300/40 dark:shadow-pink-500/30 border border-pink-400/30 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111111]"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden xs:inline">{t('nav.reservation')}</span>
                </Link>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="px-2.5 xs:px-4 sm:px-5 py-2 sm:py-2.5 bg-white dark:bg-white/10 text-pink-primary dark:text-pink-400 border border-pink-soft dark:border-white/20 rounded-full hover:bg-pink-soft/40 dark:hover:bg-white/20 transition-all duration-300 font-medium text-xs min-h-[40px] sm:min-h-[44px] whitespace-nowrap flex items-center justify-center shrink-0 hover:scale-[1.03] active:scale-[0.98]"
                >
                  {t('nav.login')}
                </Link>
              </>
            )}

            {/* Hamburger (mobile) */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-3 min-h-[44px] min-w-[44px] rounded-xl text-text dark:text-[#f5f5f5] hover:bg-pink-soft/40 dark:hover:bg-white/10 transition-all duration-300 active:scale-95 flex items-center justify-center"
              aria-label={mobileOpen ? t('nav.closeMenu', 'Close menu') : t('nav.openMenu', 'Open menu')}
              aria-expanded={mobileOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-center gap-1.5">
                <span
                  className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 origin-center ${
                    mobileOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                />
                <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-0' : ''}`} />
                <span
                  className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 origin-center ${
                    mobileOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        className={`
          lg:hidden fixed top-0 right-0 bottom-0 z-50 w-full max-w-[280px] bg-white dark:bg-[#1a1a1a] shadow-2xl
          border-l border-pink-soft/30 dark:border-white/10
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="pt-20 px-6 pb-8 flex flex-col gap-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile menu">
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
                closeMobile();
              }}
              className="nav-link-item py-3 px-4 rounded-xl text-text dark:text-[#f5f5f5] font-medium hover:bg-pink-soft/40 dark:hover:bg-white/10 transition-colors"
            >
              {t('nav.about', 'About')}
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                closeMobile();
              }}
              className="nav-link-item py-3 px-4 rounded-xl text-text dark:text-[#f5f5f5] font-medium hover:bg-pink-soft/40 dark:hover:bg-white/10 transition-colors"
            >
              {t('nav.pricing', 'Pricing')}
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                closeMobile();
              }}
              className="nav-link-item py-3 px-4 rounded-xl text-text dark:text-[#f5f5f5] font-medium hover:bg-pink-soft/40 dark:hover:bg-white/10 transition-colors"
            >
              {t('nav.contact', 'Contact')}
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
