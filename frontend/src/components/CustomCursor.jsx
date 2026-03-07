import { useEffect, useState, useRef } from 'react';

const LERP = 0.15;
const SELECTORS = 'a, button, [role="button"], input[type="submit"], input[type="button"], [data-clickable]';

export default function CustomCursor() {
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const raf = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) return;

    setActive(true);
    document.body.classList.add('custom-cursor-active');

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onHover = (e) => {
      const el = e.target.closest(SELECTORS);
      setHover(!!el);
    };

    const tick = () => {
      const { x: tx, y: ty } = target.current;
      const { x: px, y: py } = pos.current;
      pos.current = {
        x: px + (tx - px) * LERP,
        y: py + (ty - py) * LERP,
      };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onHover);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onHover);
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  if (!active) return null;

  return (
    <div
      ref={dotRef}
      className="custom-cursor-dot fixed left-0 top-0 z-[9999] pointer-events-none will-change-transform"
      style={{
        width: 12,
        height: 12,
        marginLeft: -6,
        marginTop: -6,
        transform: 'translate(-100px, -100px)',
      }}
      aria-hidden="true"
    >
      <span
        className={`block w-full h-full rounded-full bg-pink-primary dark:bg-pink-400 border-2 border-white dark:border-[#1a1a1a] shadow-[0_0_12px_rgba(231,84,128,0.5)] dark:shadow-[0_0_14px_rgba(244,114,182,0.6)] transition-transform duration-200 origin-center ${
          hover ? 'scale-[1.6] border-pink-dark dark:border-pink-300' : 'scale-100'
        }`}
      />
    </div>
  );
}
