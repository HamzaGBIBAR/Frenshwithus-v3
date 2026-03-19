import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const PLAN_IDS = ['individuel', 'groups', 'preparation'];

/** Icons per pack: Individual (person), Groups (users), Preparation (academic cap) */
function PackIcon({ planId, highlight, className = '' }) {
  const baseClass = `w-5 h-5 ${highlight ? 'text-white' : 'text-pink-primary dark:text-pink-400'} ${className}`;
  if (planId === 'individuel') {
    return (
      <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  if (planId === 'groups') {
    return (
      <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (planId === 'preparation') {
    return (
      <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    );
  }
  return null;
}

export default function Pricing() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);
  const [isAnnual, setIsAnnual] = useState(true);
  const { user } = useAuth();

  const plans = PLAN_IDS.map((id) => ({
    id,
    title: t(`pricing.plans.${id}.title`),
    subtitle: t(`pricing.plans.${id}.subtitle`),
    priceMonthly: id === 'individuel' ? '25€' : id === 'groups' ? '59€' : '380€',
    priceAnnual: id === 'individuel' ? '25€' : id === 'groups' ? '590€' : '380€',
    unit: t(`pricing.plans.${id}.unit`),
    unitAnnual: t(`pricing.plans.${id}.unitAnnual`),
    features: t(`pricing.plans.${id}.features`, { returnObjects: true }),
    highlight: id === 'individuel',
    oldPriceAnnual: id === 'groups' ? '708€' : null,
    showPrice: id === 'individuel',
  }));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) setVisible(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const getCtaLink = (planId) => {
    if (user) {
      if (user.role === 'ADMIN') return '/admin';
      if (user.role === 'PROFESSOR') return '/professor';
      if (user.role === 'STUDENT') return '/student';
    }
    return `/reservation?pack=${planId || ''}`;
  };

  return (
    <section id="pricing" className="w-full py-12 sm:py-16 lg:py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className={`text-2xl lg:text-3xl font-bold text-text dark:text-[#f5f5f5] text-center mb-3 transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {t('pricing.titlePrefix')}
          <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-pink-dark to-pink-primary dark:from-pink-500 dark:to-pink-400 text-white font-bold shadow-pink-soft">
            {t('pricing.titleHighlight')}
          </span>
          {t('pricing.titleSuffix')}
        </h2>
        <p
          className={`text-text/70 dark:text-[#f5f5f5]/70 text-center text-sm mb-8 transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: visible ? '50ms' : '0ms' }}
        >
          {t('pricing.subtitle')}
        </p>

        <div
          className={`flex flex-col items-center mb-8 transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: visible ? '100ms' : '0ms' }}
        >
          <div className="inline-flex p-1 rounded-full bg-pink-soft/60 dark:bg-white/10 border border-pink-soft dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`min-h-touch px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 touch-manipulation ${
                !isAnnual ? 'bg-pink-primary dark:bg-pink-400 text-white shadow-pink-soft' : 'text-text/70 dark:text-[#f5f5f5]/70 hover:text-text dark:hover:text-[#f5f5f5]'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`min-h-touch px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 touch-manipulation ${
                isAnnual ? 'bg-pink-primary dark:bg-pink-400 text-white shadow-pink-soft' : 'text-text/70 dark:text-[#f5f5f5]/70 hover:text-text dark:hover:text-[#f5f5f5]'
              }`}
            >
              {t('pricing.annual')}
            </button>
          </div>
          <p className="text-text/50 dark:text-[#f5f5f5]/50 text-xs mt-2">{t('pricing.toggleHint')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-visible">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`pricing-card relative group ${
                plan.highlight
                  ? 'bg-pink-dark/90 dark:bg-white/[0.06] backdrop-blur-xl rounded-2xl p-6 shadow-pink-soft dark:shadow-lg dark:ring-1 dark:ring-pink-400/30'
                  : 'bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-white/40 dark:border-white/10'
              } transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(231,84,128,0.25)] dark:hover:shadow-[0_16px_40px_rgba(231,84,128,0.15)] ${
                plan.highlight
                  ? 'hover:ring-2 hover:ring-pink-400/40 dark:hover:ring-pink-400/50'
                  : 'hover:border-pink-primary/60 dark:hover:border-white/20'
              } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: visible ? `${150 + index * 100}ms` : '0ms' }}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-pink-primary dark:bg-pink-400 text-white text-xs font-semibold whitespace-nowrap shadow-md">
                  {t('pricing.popular')}
                </span>
              )}

              <div className="pricing-card-shine rounded-2xl" aria-hidden />

              <div className="relative z-10">
              <div className={`pricing-card-icon-wrap relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm ${
                plan.highlight ? 'bg-white/20 dark:bg-pink-400/20' : 'bg-pink-soft/80 dark:bg-white/10'
              }`}>
                {/* Particles (visible on card hover) */}
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="pricing-card-particle" style={{ '--i': i }} aria-hidden />
                ))}
                <span className="pricing-card-icon-inner relative z-10">
                  <PackIcon planId={plan.id} highlight={plan.highlight} />
                </span>
              </div>

              <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white dark:text-[#f5f5f5]' : 'text-text dark:text-[#f5f5f5]'}`}>
                {plan.title}
              </h3>
              <p className={`text-sm mb-4 ${plan.highlight ? 'text-white/80 dark:text-[#f5f5f5]/80' : 'text-text/60 dark:text-[#f5f5f5]/60'}`}>
                {plan.subtitle}
              </p>

              <div className="mb-4">
                {plan.showPrice ? (
                  <>
                    {plan.highlight && plan.oldPriceAnnual && isAnnual && (
                      <span className={`text-sm line-through ${plan.highlight ? 'text-white/60' : 'text-text/50'}`}>
                        {plan.oldPriceAnnual} {plan.unitAnnual}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl lg:text-3xl font-bold ${plan.highlight ? 'text-white dark:text-pink-400' : 'text-pink-primary dark:text-pink-400'}`}>
                        {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                      </span>
                      <span className={`text-sm ${plan.highlight ? 'text-white/80 dark:text-[#f5f5f5]/80' : 'text-text/60 dark:text-[#f5f5f5]/60'}`}>
                        {isAnnual ? (plan.unitAnnual || t('pricing.plans.groups.unitAnnual')) : plan.unit}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className={`text-sm ${plan.highlight ? 'text-white/80 dark:text-[#f5f5f5]/80' : 'text-text/60 dark:text-[#f5f5f5]/60'}`}>
                    {t('pricing.priceOnRequest')}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className={`text-sm flex items-center gap-2.5 ${plan.highlight ? 'text-white/90 dark:text-[#f5f5f5]/90' : 'text-text/80 dark:text-[#f5f5f5]/80'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/20 dark:bg-pink-400/20' : 'bg-pink-primary/15 dark:bg-pink-400/15'}`}>
                      <svg className={`w-3 h-3 ${plan.highlight ? 'text-white' : 'text-pink-primary dark:text-pink-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to={getCtaLink(plan.id)}
                className={`block w-full min-h-touch py-3 rounded-xl text-center font-medium transition-all duration-300 btn-hover shadow-pink-soft touch-manipulation flex items-center justify-center ${
                  plan.highlight
                    ? 'bg-white/90 dark:bg-white/10 backdrop-blur-sm text-pink-dark dark:text-[#f5f5f5] border-2 border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 hover:border-white'
                    : 'bg-gradient-to-r from-pink-dark to-pink-primary dark:from-pink-500 dark:to-pink-400 text-white hover:from-pink-primary hover:to-pink-dark dark:hover:from-pink-400 dark:hover:to-pink-600 btn-glow'
                }`}
              >
                {t('pricing.freeSession')}
              </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
