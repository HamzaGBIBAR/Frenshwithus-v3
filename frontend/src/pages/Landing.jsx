import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import HeroCharacter from '../components/HeroCharacter';
import HeroMotionWrapper from '../components/HeroMotionWrapper';
import PlanningSection from '../components/PlanningSection';
import ContactSection from '../components/ContactSection';
import ScrollCharacter from '../components/ScrollCharacter';
import Pricing from '../components/Pricing';
import ScrollReveal from '../components/ScrollReveal';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import LogoutButton from '../components/LogoutButton';
import AnimatedEye from '../components/AnimatedEye';

function getSampleEvents(t) {
  const today = new Date().toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  return [
    { id: '1', date: today, title: t('calendar.events.french'), time: '10:00' },
    { id: '2', date: today, title: t('calendar.events.conversation'), time: '14:00' },
    { id: '3', date: addDays(2), title: t('calendar.events.writing'), time: '11:00' },
    { id: '4', date: addDays(5), title: t('calendar.events.reading'), time: '09:00' },
    { id: '5', date: addDays(7), title: t('calendar.events.french'), time: '16:00' },
  ];
}

export default function Landing() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  const [selectedDate, setSelectedDate] = useState(null);
  const [logoState, setLogoState] = useState('french');
  const hasReachedAll = useRef(false);
  const heroRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLogoState('all');
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroRect = heroRef.current?.getBoundingClientRect();
        const heroBottom = heroRect ? scrollY + heroRect.bottom : 500;

        if (hasReachedAll.current) {
          setLogoState('all');
        } else if (scrollY >= heroBottom - 50) {
          hasReachedAll.current = true;
          setLogoState('all');
        } else if (scrollY < 120) {
          setLogoState('french');
        } else if (scrollY < 240) {
          setLogoState('with');
        } else {
          setLogoState('me');
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'PROFESSOR') return '/professor';
    return '/student';
  };

  const showFrench = logoState === 'french' || logoState === 'with' || logoState === 'me' || logoState === 'all';
  const showWith = logoState === 'with' || logoState === 'me' || logoState === 'all';
  const showMe = logoState === 'me' || logoState === 'all';

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500 relative overflow-x-hidden">
      <ScrollCharacter />
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-500">
        <div className="w-full px-3 xs:px-5 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-x-2 gap-y-2 min-w-0">
          {/* Logo: can shrink on very small screens so nav has room */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-shrink" dir="ltr">
            <span className="logo-sequence text-lg xs:text-xl sm:text-2xl font-semibold text-text dark:text-[#f5f5f5] flex items-baseline gap-1 min-w-0">
              <span className={`logo-part font-bold text-text dark:text-[#f5f5f5] transition-opacity duration-300 truncate ${showFrench ? 'opacity-100' : 'opacity-0'}`}>French</span>
              <span className={`logo-part text-sm xs:text-base font-light text-text/50 dark:text-[#f5f5f5]/60 lowercase transition-opacity duration-300 shrink-0 ${showWith ? 'opacity-100' : 'opacity-0'}`}>with</span>
              <span className={`logo-part shrink-0 transition-opacity duration-300 ${showMe ? 'opacity-100' : 'opacity-0'}`}>
                <AnimatedEye variant="hero" show={showMe} />
              </span>
            </span>
            <span className="text-xs text-text/50 dark:text-[#f5f5f5]/50 font-normal hidden xs:block truncate">{t('nav.tagline')}</span>
          </div>
          {/* Nav: wraps to next line on very narrow screens so Connexion is never cut off */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-4 justify-end min-h-touch">
            <LanguageSwitcher className="rounded-full shrink-0" />
            <ThemeToggle className="rounded-full shrink-0" />
            {user && (
              <LogoutButton
                onClick={handleLogout}
                compact
                className="border-red-300/50 dark:border-red-500/40 shrink-0"
              />
            )}
            {user ? (
              <button
                type="button"
                onClick={() => { window.location.href = getDashboardLink(); }}
                className="px-3 xs:px-4 sm:px-6 py-2 sm:py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-full hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-300 btn-glow btn-hover shadow-pink-soft font-medium text-xs sm:text-sm min-h-[44px] whitespace-nowrap flex items-center justify-center shrink-0"
              >
                {t('nav.dashboard')}
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 xs:px-4 sm:px-6 py-2 sm:py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-full hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-300 btn-glow btn-hover shadow-pink-soft font-medium text-xs sm:text-sm min-h-[44px] whitespace-nowrap flex items-center justify-center shrink-0"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 xl:px-10 3xl:px-12 py-10 sm:py-16 lg:py-24 xl:py-28 3xl:py-32">
        {/* Hero Section */}
        <section ref={heroRef} className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-16 mb-12 sm:mb-20">
          <ScrollReveal className="flex-1 w-full min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text dark:text-[#f5f5f5] mb-3 sm:mb-4 leading-tight flex flex-wrap items-baseline gap-1" dir="ltr">
              {t('hero.title')} <span className="text-lg sm:text-xl lg:text-2xl font-light text-text/50 dark:text-[#f5f5f5]/60 lowercase">{t('hero.with')}</span>{' '}
              <span className="brand-me">
                <AnimatedEye variant="hero" />
              </span>
            </h1>
            <p className="text-base sm:text-lg text-text/80 dark:text-[#f5f5f5]/80 mb-6 sm:mb-8 max-w-xl">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 bg-white/80 dark:bg-[#1a1a1a] rounded-xl px-4 py-2 shadow-pink-soft dark:shadow-lg transition-colors duration-500">
                <span className="text-gold text-xl">★</span>
                <span className="font-medium text-text dark:text-[#f5f5f5]">{t('hero.rating')}</span>
              </div>
              <div className="bg-white/80 dark:bg-[#1a1a1a] rounded-xl px-4 py-2 shadow-pink-soft dark:shadow-lg transition-colors duration-500">
                <span className="font-medium text-text dark:text-[#f5f5f5]">{t('hero.students')}</span>
              </div>
              <div className="bg-white/80 dark:bg-[#1a1a1a] rounded-xl px-4 py-2 shadow-pink-soft dark:shadow-lg transition-colors duration-500">
                <span className="font-medium text-text dark:text-[#f5f5f5]">{t('hero.countries')}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              {user ? (
                <button
                  type="button"
                  onClick={() => { window.location.href = getDashboardLink(); }}
                  className="px-6 py-3 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-300 btn-glow btn-hover text-center font-medium min-h-[48px] flex items-center justify-center"
                >
                  {t('nav.dashboard')}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-3 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-300 btn-glow btn-hover text-center font-medium min-h-[48px] flex items-center justify-center"
                >
                  {t('hero.getStarted')}
                </Link>
              )}
              <a
                href="mailto:frenchwithus.noreply@gmail.com"
                className="px-6 py-3 border-2 border-pink-soft dark:border-white/20 text-pink-dark dark:text-pink-400 rounded-xl hover:bg-pink-soft/50 dark:hover:bg-white/10 transition-all duration-300 btn-hover text-center font-medium min-h-[48px] flex items-center justify-center"
              >
                {t('hero.contactUs')}
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal className="flex-1 w-full min-w-0 flex justify-center lg:justify-end">
            <HeroMotionWrapper>
              <HeroCharacter />
            </HeroMotionWrapper>
          </ScrollReveal>
        </section>

        <div className="py-8 lg:py-12" aria-hidden="true">
          <div className="section-divider" />
        </div>

        {/* Approach Section */}
        <section className="w-full py-12 sm:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="headline-approach text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-center uppercase leading-tight mb-8 sm:mb-12">
              {t('approach.line1')}
              <br />
              {t('approach.line2')}
              <br />
              {t('approach.line3')}
            </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <ScrollReveal className="approach-card bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 card-hover relative transition-colors duration-500 flex flex-col h-full">
                <div className="absolute top-4 right-4 w-10 h-10 bg-pink-soft dark:bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text dark:text-[#f5f5f5] text-lg mb-3 pr-12">{t('approach.french.title')}</h3>
                <p className="text-text/80 dark:text-[#f5f5f5]/80 text-sm mb-4 flex-1">{t('approach.french.desc')}</p>
                <Link to={getDashboardLink()} className="text-pink-primary dark:text-pink-400 font-medium text-sm hover:underline mt-auto">
                  {t('approach.french.link')}
                </Link>
              </ScrollReveal>
              <ScrollReveal className="approach-card bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 card-hover relative transition-colors duration-500 flex flex-col h-full">
                <div className="absolute top-4 right-4 w-10 h-10 bg-pink-soft dark:bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text dark:text-[#f5f5f5] text-lg mb-3 pr-12">{t('approach.oral.title')}</h3>
                <p className="text-text/80 dark:text-[#f5f5f5]/80 text-sm mb-4 flex-1">{t('approach.oral.desc')}</p>
                <Link to={getDashboardLink()} className="text-pink-primary dark:text-pink-400 font-medium text-sm hover:underline mt-auto">
                  {t('approach.oral.link')}
                </Link>
              </ScrollReveal>
              <ScrollReveal className="approach-card bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 card-hover relative transition-colors duration-500 flex flex-col h-full">
                <div className="absolute top-4 right-4 w-10 h-10 bg-pink-soft dark:bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text dark:text-[#f5f5f5] text-lg mb-3 pr-12">{t('approach.grammar.title')}</h3>
                <p className="text-text/80 dark:text-[#f5f5f5]/80 text-sm mb-4 flex-1">{t('approach.grammar.desc')}</p>
                <Link to={getDashboardLink()} className="text-pink-primary dark:text-pink-400 font-medium text-sm hover:underline mt-auto">
                  {t('approach.grammar.link')}
                </Link>
              </ScrollReveal>
              <ScrollReveal className="approach-card bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 card-hover relative transition-colors duration-500 flex flex-col h-full">
                <div className="absolute top-4 right-4 w-10 h-10 bg-pink-soft dark:bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-primary dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text dark:text-[#f5f5f5] text-lg mb-3 pr-12">{t('approach.culture.title')}</h3>
                <p className="text-text/80 dark:text-[#f5f5f5]/80 text-sm mb-4 flex-1">{t('approach.culture.desc')}</p>
                <Link to={getDashboardLink()} className="text-pink-primary dark:text-pink-400 font-medium text-sm hover:underline mt-auto">
                  {t('approach.culture.link')}
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <div className="py-8 lg:py-12" aria-hidden="true">
          <div className="section-divider section-divider--tall" />
        </div>

        {/* Apprendre & Pratiquer Section */}
        <section className="w-full py-12 sm:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-soft dark:bg-white/10 text-pink-dark dark:text-pink-400 text-sm font-medium transition-colors duration-500">
                <span className="w-1 h-1 rounded-full bg-pink-primary" />
                <span className="w-1 h-1 rounded-full bg-pink-primary opacity-60" />
                <span className="w-1 h-1 rounded-full bg-pink-primary opacity-40" />
                {t('learn.badge')}
              </span>
            </ScrollReveal>

            <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-4">
              <ScrollReveal className="flex-1 order-1">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 card-hover h-full flex flex-col transition-colors duration-500">
                  <h3 className="text-2xl font-bold text-text dark:text-[#f5f5f5] mb-1">{t('learn.title')}</h3>
                  <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm mb-4">{t('learn.subtitle')}</p>
                  <div className="flex-1 min-h-[200px] rounded-xl bg-pink-soft/30 dark:bg-white/5 overflow-hidden mb-4 flex items-center justify-center relative">
                    <img src="/images/learn-french.png" alt="Enfant apprenant le français en ligne" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }} />
                    <svg className="hidden absolute inset-0 w-full max-w-[280px] h-full max-h-[180px] m-auto" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="180" rx="12" fill="#FADADD"/>
                      <rect x="50" y="40" width="100" height="70" rx="8" fill="#FFF" stroke="#E75480" strokeWidth="2"/>
                      <line x1="60" y1="55" x2="140" y2="55" stroke="#E75480" strokeWidth="1.5" opacity="0.5"/>
                      <line x1="60" y1="70" x2="120" y2="70" stroke="#E75480" strokeWidth="1.5" opacity="0.5"/>
                      <ellipse cx="100" cy="125" rx="35" ry="25" fill="#FADADD" stroke="#E75480" strokeWidth="2"/>
                      <circle cx="95" cy="122" r="3" fill="#1F1F1F"/>
                      <circle cx="105" cy="122" r="3" fill="#1F1F1F"/>
                      <path d="M92 132 Q100 138 108 132" stroke="#C2185B" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      <path d="M75 100 Q70 95 75 90" stroke="#E75480" strokeWidth="2" fill="none"/>
                      <path d="M125 100 Q130 95 125 90" stroke="#E75480" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t('learn.tags', { returnObjects: true }).map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-lg bg-pink-soft/60 dark:bg-white/10 text-pink-dark dark:text-pink-400 text-xs font-medium transition-colors duration-500">{tag}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <div className="flex items-center justify-center flex-shrink-0 py-2 lg:py-0 lg:w-8 order-2">
                <span className="text-2xl font-light text-pink-primary dark:text-pink-400">+</span>
              </div>

              <ScrollReveal className="flex-1 order-3">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 card-hover h-full flex flex-col transition-colors duration-500">
                  <h3 className="text-2xl font-bold text-text dark:text-[#f5f5f5] mb-1">{t('practice.title')}</h3>
                  <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm mb-4">{t('practice.subtitle')}</p>
                  <div className="flex-1 min-h-[200px] rounded-xl bg-pink-soft/30 dark:bg-white/5 overflow-hidden mb-4 relative">
                    <img src="/images/practice-group.png" alt="Groupe d'élèves apprenant le français" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }} />
                    <svg className="hidden absolute inset-0 w-full h-full" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="180" rx="12" fill="#FADADD"/>
                      <circle cx="50" cy="60" r="25" fill="#FFF" stroke="#E75480" strokeWidth="2"/>
                      <circle cx="50" cy="55" r="4" fill="#1F1F1F"/>
                      <path d="M42 62 Q50 68 58 62" stroke="#C2185B" strokeWidth="1.5" fill="none"/>
                      <circle cx="100" cy="70" r="28" fill="#FFF" stroke="#E75480" strokeWidth="2"/>
                      <circle cx="100" cy="65" r="4" fill="#1F1F1F"/>
                      <path d="M92 72 Q100 78 108 72" stroke="#C2185B" strokeWidth="1.5" fill="none"/>
                      <circle cx="150" cy="60" r="25" fill="#FFF" stroke="#E75480" strokeWidth="2"/>
                      <circle cx="150" cy="55" r="4" fill="#1F1F1F"/>
                      <path d="M142 62 Q150 68 158 62" stroke="#C2185B" strokeWidth="1.5" fill="none"/>
                      <rect x="30" y="110" width="40" height="20" rx="4" fill="#E75480" opacity="0.3"/>
                      <text x="40" y="124" fontSize="10" fill="#C2185B" fontWeight="600">FR</text>
                      <rect x="85" y="120" width="40" height="20" rx="4" fill="#E75480" opacity="0.3"/>
                      <text x="95" y="134" fontSize="10" fill="#C2185B" fontWeight="600">CA</text>
                      <rect x="130" y="110" width="40" height="20" rx="4" fill="#E75480" opacity="0.3"/>
                      <text x="140" y="124" fontSize="10" fill="#C2185B" fontWeight="600">MA</text>
                    </svg>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t('practice.tags', { returnObjects: true }).map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-lg bg-pink-soft/60 dark:bg-white/10 text-pink-dark dark:text-pink-400 text-xs font-medium transition-colors duration-500">{tag}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <div className="py-8 lg:py-12" aria-hidden="true">
          <div className="section-divider" />
        </div>

        {/* Planning (Planification, Cours à venir, Mon parcours) */}
        <section>
          <ScrollReveal>
            <h2 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('planning.title')}</h2>
          </ScrollReveal>
          <ScrollReveal>
            <PlanningSection
              events={getSampleEvents(t)}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              viewMode="mois"
            />
          </ScrollReveal>
        </section>

        <div className="py-8 lg:py-12" aria-hidden="true">
          <div className="section-divider" />
        </div>

        <Pricing />

        <div className="py-8 lg:py-12" aria-hidden="true">
          <div className="section-divider section-divider--tall" />
        </div>

        {/* Testimonials – 5 groups on loop with fade */}
        <section className="mb-12 sm:mb-16">
          <ScrollReveal>
            <h2 className="text-2xl lg:text-3xl font-semibold text-text dark:text-[#f5f5f5] mb-2">{t('testimonials.title')}</h2>
            <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm mb-10">{t('testimonials.subtitle')}</p>
          </ScrollReveal>
          <TestimonialsCarousel />
        </section>

        <div className="py-8 lg:py-12" aria-hidden="true">
          <div className="section-divider" />
        </div>

        <ContactSection />

        <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-12 sm:mt-16 pt-8 sm:pt-12 pb-6 sm:pb-8 safe-area-bottom">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
              <div dir="ltr" className="flex flex-col gap-1">
                <span className="font-semibold text-text dark:text-[#f5f5f5] text-lg">
                  {t('footer.brand')}
                </span>
                <span className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                  {t('footer.tagline')}
                </span>
              </div>
              <nav className="flex flex-wrap items-center gap-6 text-sm">
                <a
                  href="#pricing"
                  className="text-text/70 dark:text-[#f5f5f5]/70 hover:text-pink-primary dark:hover:text-pink-400 transition-colors"
                >
                  {t('footer.pricing')}
                </a>
                <a
                  href="#contact"
                  className="text-text/70 dark:text-[#f5f5f5]/70 hover:text-pink-primary dark:hover:text-pink-400 transition-colors"
                >
                  {t('footer.contact')}
                </a>
              </nav>
            </div>
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <a
                href={`mailto:${t('footer.email')}`}
                className="text-sm text-text/60 dark:text-[#f5f5f5]/60 hover:text-pink-primary dark:hover:text-pink-400 transition-colors"
              >
                {t('footer.email')}
              </a>
              <span className="text-sm text-text/50 dark:text-[#f5f5f5]/50">
                {t('footer.copyright', { year: new Date().getFullYear() })}
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
