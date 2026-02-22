import { useTranslation } from 'react-i18next';
import ScrollReveal from './ScrollReveal';
import { CONTACT } from '../config/contact';

function ContactIllustration() {
  return (
    <svg viewBox="0 0 180 140" className="contact-illustration w-full max-w-[180px] h-auto text-pink-primary/25 dark:text-pink-400/20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Minimal envelope – modern, friendly */}
      <rect x="25" y="45" width="130" height="90" rx="10" />
      <path d="M25 55 L90 95 L155 55" />
      {/* Soft connection dots */}
      <circle cx="90" cy="30" r="8" fill="currentColor" fillOpacity="0.12" />
      <circle cx="70" cy="38" r="4" fill="currentColor" fillOpacity="0.08" />
      <circle cx="110" cy="38" r="4" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

export default function ContactSection() {
  const { t } = useTranslation();

  const links = [
    {
      href: `mailto:${CONTACT.email}`,
      label: t('contact.email'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: `tel:${CONTACT.phone.replace(/\s/g, '')}`,
      label: t('contact.phone'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      href: CONTACT.instagram,
      label: t('contact.instagram'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
        </svg>
      ),
    },
    {
      href: CONTACT.linkedin,
      label: t('contact.linkedin'),
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="contact" className="w-full py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="contact-card bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 lg:p-12 shadow-pink-soft dark:shadow-xl border border-pink-soft/50 dark:border-white/10 overflow-hidden relative">
            {/* Subtle gradient accent – animated */}
            <div className="contact-card__blob contact-card__blob--top absolute top-0 right-0 w-64 h-64 bg-pink-soft/30 dark:bg-pink-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="contact-card__blob contact-card__blob--bottom absolute bottom-0 left-0 w-48 h-48 bg-pink-soft/20 dark:bg-pink-400/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Illustration – gentle float */}
              <div className="flex-shrink-0 flex items-center justify-center w-40 h-32 lg:w-48 lg:h-40">
                <ContactIllustration />
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-bold text-text dark:text-[#f5f5f5] mb-3">
                  {t('contact.title')}
                </h2>
                <p className="text-text/70 dark:text-[#f5f5f5]/70 text-sm lg:text-base mb-8 max-w-xl">
                  {t('contact.subtitle')}
                </p>

                {/* Social links – staggered */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  {links.map((item, i) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="contact-link flex items-center gap-2 px-4 py-3 rounded-xl bg-pink-soft/50 dark:bg-white/5 border border-pink-soft/60 dark:border-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft dark:hover:bg-white/10 hover:border-pink-primary/40 dark:hover:border-pink-400/40 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5"
                      style={{ animationDelay: `${i * 80}ms` }}
                      aria-label={item.label}
                    >
                      <span className="text-pink-primary dark:text-pink-400 contact-link__icon">{item.icon}</span>
                      <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                    </a>
                  ))}
                </div>

                <a
                  href={`mailto:${CONTACT.email}`}
                  className="contact-cta inline-flex items-center gap-2 mt-6 px-6 py-3 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-300 btn-glow btn-hover font-medium text-sm"
                >
                  {t('contact.cta')}
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
