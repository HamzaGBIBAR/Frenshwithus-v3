import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const GROUPS_COUNT = 5;
const ROTATE_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 500;

/**
 * Testimonials carousel – 5 groups on a loop with fade out/in.
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

  useEffect(() => {
    if (groups.length <= 1) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const interval = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setCurrentGroup((g) => (g + 1) % groups.length);
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
      setIsFadingOut(false);
    }, FADE_DURATION_MS);
  };

  if (groups.length === 0) return null;

  const currentItems = groups[currentGroup] || groups[0];

  return (
    <div className="relative">
      <div
        className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-opacity duration-500 ease-out ${
          isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {currentItems.map((item, index) => (
          <blockquote
            key={`${item.name}-${currentGroup}-${index}`}
            className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 border-s-4 border-s-pink-primary dark:border-s-pink-400 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(231,84,128,0.2)] dark:hover:shadow-[0_12px_40px_rgba(231,84,128,0.15)] hover:scale-[1.02] animate-fade-in"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-pink-soft dark:bg-pink-400/20 flex items-center justify-center flex-shrink-0 text-pink-primary dark:text-pink-400 font-semibold text-sm">
                {item.name?.split(' ').map((n) => n[0]).join('') || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1" aria-label={`${item.rating ?? 5} out of 5 stars`}>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${i < (item.rating ?? 5) ? 'text-gold' : 'text-text/30 dark:text-[#f5f5f5]/30'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="font-medium text-text dark:text-[#f5f5f5] text-sm">{item.name}</p>
                {item.role && <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{item.role}</p>}
                {item.date && <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{item.date}</p>}
              </div>
            </div>
            <p className="text-text/80 dark:text-[#f5f5f5]/80 italic text-sm leading-relaxed">
              &quot;{item.quote}&quot;
            </p>
          </blockquote>
        ))}
      </div>

      {groups.length > 1 && (
        <nav
          className="flex justify-center gap-2 mt-6 sm:mt-8"
          aria-label={t('testimonials.paginationLabel')}
        >
          {groups.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToGroup(idx)}
              aria-current={idx === currentGroup ? 'true' : undefined}
              aria-label={`${t('testimonials.group')} ${idx + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentGroup
                  ? 'bg-pink-primary dark:bg-pink-400 scale-125'
                  : 'bg-pink-soft/60 dark:bg-white/30 hover:bg-pink-soft dark:hover:bg-white/50'
              }`}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
