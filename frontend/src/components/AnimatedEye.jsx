/**
 * MeEyeBadge – Structured eye with depth
 * - Horizontal oval badge with inner shadow for depth
 * - Darker circular pupil behind centered "US"
 * - Eyelid matches navbar/hero background, slides down smoothly
 * - 250ms blink, random 3–5s interval
 * - Subtle pupil movement on hover (2–3px)
 */
import { useEffect, useRef } from 'react';

export default function AnimatedEye({ variant = 'hero', className = '', show = true }) {
  const badgeRef = useRef(null);
  const isNavbar = variant === 'navbar';

  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;
    const interval = 3000 + Math.random() * 2000;
    el.style.setProperty('--blink-interval', `${interval}ms`);
  }, []);

  return (
    <span
      ref={badgeRef}
      className={`
        me-eye-badge relative inline-flex items-center justify-center
        overflow-hidden cursor-default
        ${isNavbar ? 'px-2 py-1 min-w-[2.85rem] text-xs' : 'px-2.5 py-1.5 min-w-[3.2rem] sm:min-w-[3.6rem] text-sm sm:text-base lg:text-lg'}
        font-bold text-white tracking-tight leading-none
        transition-opacity duration-300
        group/me-eye
        ${!show && 'opacity-0'}
        ${className}
      `}
      data-variant={variant}
      aria-label="Us"
      style={{ '--blink-interval': '4000ms' }}
    >
      {/* Darker circular pupil – soft, centered behind text */}
      <span className="me-eye-pupil" aria-hidden />
      {/* US text – centered above pupil */}
      <span className="me-eye-text relative z-[1]">
        US
      </span>
      {/* Eyelid – ::after in CSS */}
    </span>
  );
}
