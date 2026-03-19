import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const GROUPS_COUNT = 5;
const ROTATE_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 500;

/**
 * Testimonials carousel – glass cards, staggered entrance, premium animations.
 */
export default function TestimonialsCarousel() {
  const { t } = useTranslation();
  const items = t('testimonials.items', { returnObjects: true });
  const extraItems = t('testimonials.extraItems', { returnObjects: true });
  const allItems = useMemo(() => {
    const main = Array.isArray(items) ? items : [];
    const extra = Array.isArray(extraItems) ? extraItems : [];
    return [...main, ...extra];
  }, [items, extraItems]);

  const groups = useMemo(() => {
    const total = allItems.length;
    const baseSize = Math.floor(total / GROUPS_COUNT);
    const remainder = total % GROUPS_COUNT;
    const gs = [];
    let idx = 0;
    for (let i = 0; i < GROUPS_COUNT; i++) {
      const size = baseSize + (i < remainder ? 1 : 0);
      gs.push(allItems.slice(idx, idx + size).filter(Boolean));
      idx += size;
    }
    return gs.filter((g) => g.length > 0);
  }, [allItems]);

  const [currentGroup, setCurrentGroup] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (groups.length <= 1) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const interval = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setCurrentGroup((g) => (g + 1) % groups.length);
        setKey((k) => k + 1);
        setIsFadingOut(false);
      }, FADE_DURATION_MS);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [groups.length]);

  const goToGroup = (idx) => {
    if (idx === currentGroup) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setCurrentGroup(idx);
      setKey((k) => k + 1);
      setIsFadingOut(false);
    }, FADE_DURATION_MS);
  };

  if (groups.length === 0) return null;

  const currentItems = groups[currentGroup] || groups[0];

  return (
    <div className="relative">
      <div
        className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 transition-all duration-500 ease-out ${
          isFadingOut ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {currentItems.map((item, index) => (
          <blockquote
            key={`${key}-${item.name}-${index}`}
            className="testimonial-glass-card testimonial-card-entrance group relative rounded-2xl p-6 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02]"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient left accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, var(--pink-primary) 0%, var(--pink-dark) 100%)',
              }}
            />
            {/* Subtle gradient accent top-right */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.07] dark:opacity-[0.06] pointer-events-none"
              style={{
                background: 'radial-gradient(circle, var(--pink-primary) 0%, transparent 70%)',
                transform: 'translate(30%, -30%)',
              }}
            />

            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--pink-primary) 0%, var(--pink-dark) 100%)',
                    boxShadow: '0 8px 20px rgba(231, 84, 128, 0.35)',
                  }}
                >
                  {item.name?.split(' ').map((n) => n[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="flex items-center gap-0.5 mb-1.5"
                    aria-label={`${item.rating ?? 5} out of 5 stars`}
                  >
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-base transition-transform duration-200 group-hover:scale-110 ${
                          i < (item.rating ?? 5) ? 'text-gold testimonial-star-glow' : 'text-text/25 dark:text-[#f5f5f5]/25'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="font-semibold text-text dark:text-[#f5f5f5] text-sm">{item.name}</p>
                  {(item.role || item.date) && (
                    <p className="text-xs text-text/55 dark:text-[#f5f5f5]/55 mt-0.5">
                      {[item.role, item.date].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-text/85 dark:text-[#f5f5f5]/85 text-sm leading-relaxed italic pl-1 border-l-2 border-pink-soft dark:border-pink-400/40 border-l-pink-primary/30 dark:border-l-pink-400/30">
                &quot;{item.quote}&quot;
              </p>
            </div>
          </blockquote>
        ))}
      </div>

      {groups.length > 1 && (
        <nav
          className="flex justify-center gap-3 mt-8 sm:mt-10"
          aria-label={t('testimonials.paginationLabel')}
        >
          {groups.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToGroup(idx)}
              aria-current={idx === currentGroup ? 'true' : undefined}
              aria-label={`${t('testimonials.group')} ${idx + 1}`}
              className={`testimonial-pagination-dot rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary dark:focus-visible:ring-pink-400 focus-visible:ring-offset-2 ${
                idx === currentGroup
                  ? 'active w-3 h-3 bg-pink-primary dark:bg-pink-400 scale-110'
                  : 'w-2.5 h-2.5 bg-pink-soft/80 dark:bg-white/40 hover:bg-pink-primary/60 dark:hover:bg-pink-400/60 hover:scale-110'
              }`}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
