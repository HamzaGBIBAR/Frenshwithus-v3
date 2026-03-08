/**
 * FireParticles – purple floating particles across the full background
 * - Many small particles that rise and drift like embers
 * - Respects prefers-reduced-motion (particles static or reduced)
 * - Fixed, behind content (z-0), pointer-events-none
 */
import { useMemo } from 'react';

const PARTICLE_COUNT = 60;
const PURPLE_COLORS = [
  'rgba(139, 92, 246, 0.85)',   // violet-500
  'rgba(167, 139, 250, 0.75)',   // violet-400
  'rgba(196, 181, 253, 0.65)',   // violet-300
  'rgba(124, 58, 237, 0.7)',     // violet-600
];

function seed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

function seededRandom(s, min, max) {
  const x = Math.sin(s) * 10000;
  const t = x - Math.floor(x);
  return min + t * (max - min);
}

export default function FireParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const s = seed(`particle-${i}`);
      return {
        id: i,
        left: seededRandom(s, 0, 100),
        size: seededRandom(s + 1, 4, 12),
        duration: 8 + seededRandom(s + 2, 0, 12),
        delay: seededRandom(s + 3, 0, 8),
        color: PURPLE_COLORS[i % PURPLE_COLORS.length],
      };
    });
  }, []);

  return (
    <div
      className="fire-particles fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="fire-particle absolute rounded-full will-change-transform"
          style={{
            left: `${p.left}%`,
            bottom: '-5%',
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `fireParticleRise ${p.duration}s ease-in infinite`,
            animationDelay: `-${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
