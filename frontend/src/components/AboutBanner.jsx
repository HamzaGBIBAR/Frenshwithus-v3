import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedEye from './AnimatedEye';
import { CONTACT } from '../config/contact';

/**
 * Scroll-triggered contact/brand overlay at bottom of page.
 * - Scroll down to bottom → window slides up from bottom
 * - Scroll up → window slides down and hides
 * - Scroll down again → window shows again (repeats every time)
 */
export default function AboutBanner({ triggerRef }) {
  const { t } = useTranslation();
  // phase: 'idle' | 'in' | 'visible' | 'out'
  const [phase, setPhase] = useState('idle');
  const scrollAnchorRef = useRef(0);

  const hide = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'visible' || prev === 'in') {
        setTimeout(() => setPhase('idle'), 650);
        return 'out';
      }
      return prev;
    });
  }, []);

  /* ── Intersection Observer: show when trigger enters, hide when it leaves ── */
  useEffect(() => {
    const el = triggerRef?.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('in');
          scrollAnchorRef.current = window.scrollY;
          requestAnimationFrame(() => setTimeout(() => setPhase('visible'), 30));
        } else {
          setPhase((prev) => {
            if (prev === 'visible' || prev === 'in') {
              setTimeout(() => setPhase('idle'), 650);
              return 'out';
            }
            return 'idle';
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef]);

  /* ── Scroll up → hide (window falls down). Scroll down again → trigger re-enters → show. ── */
  useEffect(() => {
    if (phase !== 'visible') return;
    const handleScroll = () => {
      const delta = window.scrollY - scrollAnchorRef.current;
      if (delta < -60) hide(); // user scrolled up
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [phase, hide]);

  /* ── Keyboard: Escape to hide ── */
  useEffect(() => {
    if (phase !== 'visible') return;
    const handleKey = (e) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, hide]);

  if (phase === 'idle') return null;

  const isIn = phase === 'visible';

  return (
    /* Backdrop overlay */
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="À propos de French With Us"
    >
      {/* Dim layer fades in/out */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-700"
        style={{ opacity: isIn ? 1 : 0 }}
        onClick={hide}
        aria-hidden="true"
      />

      {/* Poster panel – slides up from bottom */}
      <div
        className="relative w-full sm:w-[90vw] sm:max-w-3xl max-h-screen sm:max-h-[90vh] sm:rounded-3xl overflow-hidden
                   shadow-[0_-8px_60px_rgba(231,84,128,0.25)] sm:shadow-[0_8px_80px_rgba(231,84,128,0.3)]
                   transition-all duration-700"
        style={{
          transform: isIn
            ? 'translateY(0) scale(1)'
            : 'translateY(110%) scale(0.96)',
          opacity: isIn ? 1 : 0,
          transitionTimingFunction: isIn
            ? 'cubic-bezier(0.22, 1, 0.36, 1)'
            : 'cubic-bezier(0.55, 0, 1, 0.45)',
        }}
      >
        {/* ── Background layers ── */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e0610] via-[#160b18] to-[#0a0a10]" />
        {/* Ambient glows */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-pink-700/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-pink-600/8 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle noise/grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
            backgroundSize: '200px',
          }}
        />

        {/* ── Close button ── */}
        <button
          type="button"
          onClick={hide}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25
                     flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Top accent line ── */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/70 to-transparent" />

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-10 py-10 sm:py-14 gap-7 sm:gap-8">

          {/* Logo */}
          <div
            className="flex items-baseline gap-2 transition-all duration-500 delay-150"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(20px)' }}
          >
            <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">French</span>
            <span className="text-lg sm:text-xl font-light text-white/50 lowercase">with</span>
            <span className="text-3xl sm:text-4xl">
              <AnimatedEye variant="hero" show />
            </span>
          </div>

          {/* Ornamental divider */}
          <div
            className="flex items-center gap-3 transition-all duration-500 delay-200"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'scaleX(1)' : 'scaleX(0)' }}
          >
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-pink-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500/80" />
            <div className="w-16 h-px bg-gradient-to-r from-pink-500/60 via-pink-400/80 to-pink-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500/80" />
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-pink-500/60" />
          </div>

          {/* Headline */}
          <h2
            className="transition-all duration-600 delay-[250ms]"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(24px)' }}
          >
            <span className="block text-[clamp(2rem,6vw,3.75rem)] font-black uppercase leading-none tracking-tight text-white">
              {t('about.banner.line1', 'Apprenez le')}
            </span>
            <span className="block text-[clamp(2.4rem,7vw,4.5rem)] font-black uppercase leading-none tracking-tight
                             bg-gradient-to-r from-pink-400 via-pink-300 to-pink-500 bg-clip-text text-transparent
                             drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]">
              {t('about.banner.line2', 'Français')}
            </span>
            <span className="block text-[clamp(2rem,6vw,3.75rem)] font-black uppercase leading-none tracking-tight text-white/80">
              {t('about.banner.line3', 'avec nous')}
            </span>
          </h2>

          {/* Tagline */}
          <p
            className="text-white/50 text-sm sm:text-base max-w-sm transition-all duration-500 delay-[320ms]"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(16px)' }}
          >
            {t('about.banner.tagline', 'Cours particuliers de français en ligne — professeurs certifiés')}
          </p>

          {/* Contact info row */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 transition-all duration-500 delay-[380ms]"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(16px)' }}
          >
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-2 text-white/55 hover:text-pink-300 transition-colors text-sm group"
            >
              <span className="w-7 h-7 rounded-full bg-white/8 group-hover:bg-pink-500/20 border border-white/10 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              {CONTACT.email}
            </a>
            <div className="hidden sm:block w-px h-4 bg-white/15" aria-hidden="true" />
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 text-white/55 hover:text-pink-300 transition-colors text-sm group"
            >
              <span className="w-7 h-7 rounded-full bg-white/8 group-hover:bg-pink-500/20 border border-white/10 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={2} />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
                </svg>
              </span>
              @frenchwithus_official
            </a>
          </div>

          {/* Social icon row */}
          <div
            className="flex items-center gap-3 transition-all duration-500 delay-[430ms]"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(16px)' }}
          >
            {[
              {
                href: CONTACT.instagram,
                label: 'Instagram',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={2} />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
                  </svg>
                ),
              },
              {
                href: CONTACT.linkedin,
                label: 'LinkedIn',
                icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                ),
              },
            ].map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-white/15 bg-white/6 hover:bg-pink-500/25 hover:border-pink-400/50
                           flex items-center justify-center text-white/55 hover:text-pink-300
                           transition-all duration-250 hover:scale-110 hover:shadow-[0_0_16px_rgba(236,72,153,0.35)]"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* CTA button */}
          <div
            className="transition-all duration-500 delay-[490ms]"
            style={{ opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)' }}
          >
            <Link
              to="/reservation"
              onClick={hide}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full
                         bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500
                         text-white text-sm font-semibold shadow-lg shadow-pink-500/30
                         hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('pricing.freeSession', 'Séance gratuite')}
            </Link>
          </div>

          {/* Scroll hint */}
          <div
            className="flex flex-col items-center gap-1.5 transition-all duration-500 delay-[550ms]"
            style={{ opacity: isIn ? 0.35 : 0 }}
          >
            <p className="text-white/60 text-[11px] uppercase tracking-widest">
              {t('about.banner.scrollUpHint', 'Remonter pour fermer')}
            </p>
            <svg className="w-4 h-4 text-white/40 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </div>

        {/* ── Bottom accent line ── */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />
      </div>
    </div>
  );
}
