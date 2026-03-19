/**
 * HeroMotionWrapper – hero illustration motion
 * - Vertical floating (slow)
 * - Micro parallax on scroll (max 10px, desktop only)
 * - Respects prefers-reduced-motion
 * - GPU: transform only, translate3d
 */
import { useState, useEffect, useRef } from 'react';

export default function HeroMotionWrapper({ children }) {
  const ref = useRef(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const maxParallax = 10;
        const factor = Math.min(scrollY / 400, 1);
        setParallaxY(-factor * maxParallax);
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="hero-motion-parallax"
      style={{
        transform: `translate3d(0, ${parallaxY}px, 0)`,
      }}
    >
      <div className="hero-motion-float">{children}</div>
    </div>
  );
}
