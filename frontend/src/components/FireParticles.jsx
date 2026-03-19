/**
 * FireParticles – rose/pink floating particles across the full background
 * - Few particles, low opacity, rise and drift like embers
 * - Respects prefers-reduced-motion (particles static or reduced)
 * - Fixed, behind content (z-0), pointer-events-none
 */
import { useMemo } from 'react';

const PARTICLE_COUNT = 22;
const ROSE_COLORS = [
  'rgba(231, 84, 128, 0.45)',   // pink-primary
  'rgba(250, 218, 221, 0.4)',   // pink-soft
  'rgba(244, 114, 182, 0.4)',   // pink
  'rgba(194, 24, 91, 0.35)',    // pink-dark
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
        color: ROSE_COLORS[i % ROSE_COLORS.length],
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
