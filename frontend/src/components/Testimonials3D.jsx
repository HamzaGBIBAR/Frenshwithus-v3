import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const COUNTRY_FLAGS = ['🇫🇷', '🇺🇸', '🇨🇦', '🇲🇦', '🇬🇧', '🇩🇪', '🇪🇸', '🇧🇪', '🇨🇭', '🇮🇹', '🇳🇱', '🇦🇺', '🇯🇵', '🇧🇷', '🇮🇳'];
const COUNTRY_NAMES = ['France', 'USA', 'Canada', 'Morocco', 'UK', 'Germany', 'Spain', 'Belgium', 'Switzerland', 'Italy', 'Netherlands', 'Australia', 'Japan', 'Brazil', 'India'];

/**
 * Testimonials 3D – floating cards in circular motion, glassmorphism, premium animations.
 * Desktop: 3D circular carousel with depth, hover pause.
 * Mobile: swipe carousel with touch support.
 */
export default function Testimonials3D() {
  const { t } = useTranslation();
  const itemsRaw = t('testimonials.items', { returnObjects: true });
  const extraRaw = t('testimonials.extraItems', { returnObjects: true });
  const items = [...(Array.isArray(itemsRaw) ? itemsRaw : []), ...(Array.isArray(extraRaw) ? extraRaw : [])]
    .filter(Boolean)
    .slice(0, 9)
    .map((item, i) => ({
      ...item,
      country: item.country || COUNTRY_NAMES[i % COUNTRY_NAMES.length],
      flag: item.flag || COUNTRY_FLAGS[i % COUNTRY_FLAGS.length],
    }));

  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const isMobile = useRef(false);

  const checkMobile = useCallback(() => {
    isMobile.current = window.matchMedia('(max-width: 1023px)').matches;
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  useEffect(() => {
    if (items.length === 0 || isMobile.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setRotation(0);
      return;
    }

    const animate = (time) => {
      lastTimeRef.current = lastTimeRef.current || time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!isPaused && !reduced) {
        setRotation((r) => r + delta * 0.02);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [items.length, isPaused]);

  const handleSwipe = () => {
    if (touchEnd === null || touchStart === null) return;
    const diff = touchStart - touchEnd;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        setMobileIndex((i) => Math.min(i + 1, items.length - 1));
      } else {
        setMobileIndex((i) => Math.max(i - 1, 0));
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => handleSwipe();

  if (items.length === 0) return null;

  const n = items.length;
  const cardWidth = 320;
  const gap = 24;
  const oneSetWidth = n * cardWidth + (n - 1) * gap;
  const offset = ((rotation % 360) / 360) * oneSetWidth;
  const focalIndex = hoveredIndex !== null ? hoveredIndex : Math.round(((rotation % 360) / 360) * n) % n;
  const desktopItems = [...items, ...items];

  return (
    <div className="relative w-full min-h-[420px] lg:min-h-[480px] flex items-center justify-center overflow-hidden">
      {/* Desktop: horizontal floating carousel (2D, reliable) */}
      <div
        className="hidden lg:flex absolute inset-0 items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          setHoveredIndex(null);
        }}
      >
        <div
          className="flex items-center gap-6 will-change-transform"
          style={{
            transform: `translateX(-${offset}px)`,
            transition: isPaused ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
        >
          {desktopItems.map((item, i) => {
            const idx = i % n;
            const distFromFocal = Math.min(
              Math.abs(idx - focalIndex),
              Math.abs(idx - focalIndex + n),
              Math.abs(idx - focalIndex - n)
            );
            const depthFactor = 1 - Math.min(distFromFocal / (n / 2), 1) * 0.5;
            const scale = hoveredIndex === idx ? 1.08 : 0.88 + depthFactor * 0.12;
            const opacity = hoveredIndex === idx ? 1 : 0.75 + depthFactor * 0.2;
            const isFront = hoveredIndex === idx || (hoveredIndex === null && distFromFocal < 1.5);

            return (
              <div
                key={`${item.name}-${i}`}
                className="flex-shrink-0 cursor-pointer select-none transition-all duration-300 ease-out"
                style={{
                  width: cardWidth,
                  transform: `scale(${scale})`,
                  opacity,
                  zIndex: isFront ? 20 : 10,
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Card item={item} isHighlighted={isFront} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: swipe carousel */}
      <div
        className="lg:hidden w-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translateX(-${mobileIndex * 100}%)`,
          }}
        >
          {items.map((item, i) => (
            <div key={`m-${item.name}-${i}`} className="flex-shrink-0 w-full px-4">
              <Card item={item} isHighlighted={i === mobileIndex} />
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMobileIndex(i)}
                aria-label={`Review ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === mobileIndex ? 'bg-pink-primary dark:bg-pink-400 scale-125' : 'bg-pink-soft/60 dark:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ item, isHighlighted }) {
  const initials = item.name?.split(' ').map((n) => n[0]).join('') || '?';
  return (
    <blockquote
      className={`
        testimonial-3d-card relative rounded-2xl p-6 overflow-hidden
        transition-all duration-400 ease-out
        bg-white dark:bg-[#1e1e1e]
        border border-pink-soft/40 dark:border-white/10
        ${isHighlighted
          ? 'shadow-xl dark:shadow-2xl shadow-pink-primary/10 dark:shadow-pink-400/5 ring-2 ring-pink-primary/30 dark:ring-pink-400/25'
          : 'shadow-lg dark:shadow-xl shadow-black/5 dark:shadow-black/30'
        }
      `}
    >
      {/* Decorative quote mark */}
      <span
        className="absolute top-4 right-4 text-6xl font-serif leading-none select-none pointer-events-none opacity-[0.07] dark:opacity-[0.08] text-pink-primary dark:text-pink-400"
        aria-hidden
      >
        &ldquo;
      </span>

      <div className="relative">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm
              bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600
              ring-2 ring-pink-soft/50 dark:ring-pink-400/20"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" role="img" aria-label={item.country}>
                {item.flag}
              </span>
              <span className="text-xs font-medium text-text/55 dark:text-[#f5f5f5]/55">{item.country}</span>
            </div>
            <div className="flex items-center gap-0.5 mb-0.5" aria-label={`${item.rating ?? 5} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < (item.rating ?? 5) ? 'text-amber-500 dark:text-amber-400' : 'text-text/15 dark:text-[#f5f5f5]/15'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="font-semibold text-text dark:text-[#f5f5f5] text-sm">{item.name}</p>
            {(item.role || item.date) && (
              <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50 mt-0.5">
                {[item.role, item.date].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <p className="text-text/90 dark:text-[#f5f5f5]/90 text-sm leading-relaxed italic">
          &quot;{item.quote}&quot;
        </p>
      </div>
    </blockquote>
  );
}
