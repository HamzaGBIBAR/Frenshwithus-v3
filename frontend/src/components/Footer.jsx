import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AnimatedEye from './AnimatedEye';
import { CONTACT } from '../config/contact';

export default function Footer() {
  const { t } = useTranslation();
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const socialLinks = [
    { href: CONTACT.instagram, label: t('contact.instagram'), icon: 'instagram' },
    { href: CONTACT.linkedin, label: t('contact.linkedin'), icon: 'linkedin' },
  ];

  return (
    <footer
      ref={footerRef}
      className="footer-curved-wrap mt-12 sm:mt-16 pt-16 sm:pt-20 pb-10 sm:pb-12 safe-area-bottom"
      role="contentinfo"
    >
      {/* Curved pink glow overlay */}
      <div className="footer-curved-overlay" aria-hidden />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo – goes up first, then web info appears below */}
        <div
          className={`footer-logo-go-up ${isVisible ? 'is-visible' : ''} flex flex-col items-center gap-4 mb-8`}
          dir="ltr"
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="logo-sequence text-2xl sm:text-3xl font-semibold text-white flex items-baseline gap-1.5">
              <span className="font-bold text-white">French</span>
              <span className="text-base sm:text-lg font-light text-white/70 lowercase">with</span>
              <span className="shrink-0">
                <AnimatedEye variant="hero" show />
              </span>
            </span>
            <span className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0 footer-brand-glow" aria-hidden />
          </div>
          <p className="text-sm text-white/60">{t('footer.tagline')}</p>
        </div>

        {/* Nav + CTA – revealed after logo */}
        <div className={`footer-fade-up footer-fade-up--delay-1 ${isVisible ? 'is-visible' : ''} flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8`}>
          <a
            href="#pricing"
            className="footer-link text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            {t('footer.pricing')}
          </a>
          <a
            href="#contact"
            className="footer-link text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            {t('footer.contact')}
          </a>
          <Link
            to="/reservation"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-pink-primary rounded-full font-medium text-sm hover:bg-white/90 transition-colors btn-glow"
          >
            <span>{t('pricing.freeSession')}</span>
          </Link>
        </div>

        {/* Social – Instagram, LinkedIn */}
        <div className={`footer-fade-up footer-fade-up--delay-2 ${isVisible ? 'is-visible' : ''} flex justify-center gap-4 mb-8`}>
          {socialLinks.map(({ href, label, icon }) => (
            <a
              key={icon}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              aria-label={label}
            >
              {icon === 'instagram' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={2} />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
                </svg>
              )}
              {icon === 'linkedin' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              )}
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className={`footer-fade-up footer-fade-up--delay-3 ${isVisible ? 'is-visible' : ''} border-t border-white/15 w-full max-w-xs mx-auto mb-6`} />

        {/* Email + Copyright – mail, LinkedIn context */}
        <div className={`footer-fade-up footer-fade-up--delay-4 ${isVisible ? 'is-visible' : ''} flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-6 text-sm text-white/50`}>
          <a
            href={`mailto:${t('footer.email')}`}
            className="hover:text-white/80 transition-colors"
          >
            {t('footer.email')}
          </a>
          <span className="hidden sm:inline text-white/30">·</span>
          <span>
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
}
