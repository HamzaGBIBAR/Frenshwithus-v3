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
      className="custom-cursor-dot fixed left-0 top-0 pointer-events-none will-change-transform"
      style={{
        zIndex: 2147483647, /* max z-index — always on top of every modal/overlay */
        width: 16,
        height: 16,
        marginLeft: -8,
        marginTop: -8,
        transform: 'translate(-100px, -100px)',
      }}
      aria-hidden="true"
    >
      {/* Outer white ring — stays visible on any background */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 3px rgba(231,84,128,0.6)',
        }}
      />
      <span
        className={`block w-full h-full rounded-full transition-transform duration-200 origin-center ${
          hover ? 'scale-[1.5]' : 'scale-100'
        }`}
        style={{
          background: hover
            ? 'radial-gradient(circle, #ff6fa8 0%, #e75480 60%)'
            : 'radial-gradient(circle, #ff6fa8 0%, #c2185b 100%)',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.95), 0 0 10px rgba(231,84,128,0.7), 0 2px 6px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}
