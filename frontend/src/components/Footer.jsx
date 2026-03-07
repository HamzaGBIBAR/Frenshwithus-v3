import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AnimatedEye from './AnimatedEye';
import { CONTACT } from '../config/contact';

export default function Footer() {
  const { t } = useTranslation();
  const footerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const socialLinks = [
    { href: CONTACT.instagram, label: t('contact.instagram'), icon: 'instagram' },
    { href: CONTACT.linkedin, label: t('contact.linkedin'), icon: 'linkedin' },
  ];

  const show = visible ? 'footer-new-visible' : '';

  return (
    <footer
      ref={footerRef}
      className="footer-new mt-16 sm:mt-20 pt-10 pb-8 sm:pt-12 sm:pb-10 safe-area-bottom"
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main row: logo | links + CTA | social */}
        <div className={`footer-new-row ${show} flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6" dir="ltr">
            <span className="inline-flex items-baseline gap-1.5 text-xl sm:text-2xl font-bold text-text dark:text-[#f5f5f5]">
              <span>French</span>
              <span className="font-light text-text/70 dark:text-[#f5f5f5]/70 lowercase">with</span>
              <span className="shrink-0">
                <AnimatedEye variant="hero" show />
              </span>
            </span>
            <span className="text-sm text-text/60 dark:text-[#f5f5f5]/60 hidden sm:inline md:border-l md:border-pink-soft/50 dark:md:border-white/20 md:pl-6">
              {t('footer.tagline')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a
              href="#pricing"
              className="text-sm font-medium text-text/80 dark:text-[#f5f5f5]/80 hover:text-pink-primary dark:hover:text-pink-400 transition-colors"
            >
              {t('footer.pricing')}
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-text/80 dark:text-[#f5f5f5]/80 hover:text-pink-primary dark:hover:text-pink-400 transition-colors"
            >
              {t('footer.contact')}
            </a>
            <Link
              to="/reservation"
              className="inline-flex items-center px-4 py-2.5 rounded-full bg-pink-primary dark:bg-pink-400 text-white text-sm font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition-colors btn-glow"
            >
              {t('pricing.freeSession')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map(({ href, label, icon }) => (
              <a
                key={icon}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="w-9 h-9 rounded-full bg-pink-soft/60 dark:bg-white/10 flex items-center justify-center text-pink-primary dark:text-pink-400 hover:bg-pink-soft dark:hover:bg-white/20 transition-colors"
                aria-label={label}
              >
                {icon === 'instagram' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={2} />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
                  </svg>
                )}
                {icon === 'linkedin' && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom: email + copyright */}
        <div className={`footer-new-bottom ${show} mt-8 pt-6 border-t border-pink-soft/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-text/60 dark:text-[#f5f5f5]/60`}>
          <a
            href={`mailto:${t('footer.email')}`}
            className="hover:text-pink-primary dark:hover:text-pink-400 transition-colors"
          >
            {t('footer.email')}
          </a>
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
        </div>
      </div>
    </footer>
  );
}
