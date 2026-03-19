import { useState, useEffect } from 'react';

/**
 * FloatingLetters – decorative letters A, R, Y, O, P, V
 * - Animated with scroll (parallax)
 * - Floating + glow + breathing
 * - Respects prefers-reduced-motion
 */
const LETTERS = [
  { char: 'A', top: '8%', left: '8%', delay: '0s', duration: '22s', speed: 0.15 },
  { char: 'R', top: '15%', right: '12%', left: 'auto', delay: '-3s', duration: '26s', speed: 0.08 },
  { char: 'Y', top: '25%', left: '5%', delay: '-6s', duration: '24s', speed: 0.2 },
  { char: 'M', top: '45%', right: '8%', left: 'auto', delay: '-9s', duration: '20s', speed: 0.12 },
  { char: 'P', top: '55%', left: '10%', delay: '-12s', duration: '28s', speed: 0.18 },
  { char: 'V', top: '70%', right: '15%', left: 'auto', delay: '-15s', duration: '23s', speed: 0.1 },
  { char: 'A', top: '85%', left: '15%', delay: '-18s', duration: '25s', speed: 0.22 },
  { char: 'O', top: '35%', right: '5%', left: 'auto', delay: '-7s', duration: '21s', speed: 0.14 },
];

export default function FloatingLetters() {
  const [scrollY, setScrollY] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduceMotion(mq.matches);
    setReduceMotion(mq.matches);
    mq.addEventListener('change', handler);

    let ticking = false;
    const handleScroll = () => {
      if (mq.matches) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="floating-letters fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {LETTERS.map((item, i) => {
        const parallaxY = reduceMotion ? 0 : scrollY * (item.speed ?? 0.15);
        return (
          <span
            key={`${item.char}-${i}`}
            className="floating-letter-wrapper absolute"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              transform: `translate3d(0, ${-parallaxY}px, 0)`,
            }}
          >
            <span
              className="floating-letter floating-letter--petite font-heading font-bold select-none text-pink-primary/15 dark:text-pink-400/12"
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.75rem)',
                animationDelay: item.delay,
                animationDuration: item.duration,
              }}
            >
              {item.char}
            </span>
          </span>
        );
      })}
    </div>
  );
}
