/**
 * AnimatedBackground – soft pastel gradient blobs
 * - 5 blobs with slow float + gentle scale
 * - 20–30s loops, very low opacity (0.1–0.2)
 * - Respects prefers-reduced-motion
 * - GPU-friendly: transform + opacity only
 */
export default function AnimatedBackground() {
  const blobs = [
    {
      id: 1,
      gradient: 'radial-gradient(circle, rgba(231,84,128,0.15) 0%, rgba(231,84,128,0.05) 50%, transparent 70%)',
      size: 'min(80vw, 400px)',
      top: '10%',
      left: '5%',
    },
    {
      id: 2,
      gradient: 'radial-gradient(circle, rgba(250,218,221,0.2) 0%, rgba(250,218,221,0.06) 50%, transparent 70%)',
      size: 'min(60vw, 320px)',
      top: '60%',
      left: '90%',
    },
    {
      id: 3,
      gradient: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, rgba(244,114,182,0.04) 50%, transparent 70%)',
      size: 'min(70vw, 360px)',
      top: '85%',
      left: '20%',
    },
    {
      id: 4,
      gradient: 'radial-gradient(circle, rgba(194,24,91,0.1) 0%, rgba(194,24,91,0.03) 50%, transparent 70%)',
      size: 'min(50vw, 280px)',
      top: '35%',
      left: '75%',
    },
    {
      id: 5,
      gradient: 'radial-gradient(circle, rgba(251,207,232,0.18) 0%, rgba(251,207,232,0.05) 50%, transparent 70%)',
      size: 'min(55vw, 300px)',
      top: '70%',
      left: '95%',
    },
  ];

  return (
    <div
      className="animated-bg fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="animated-bg__blob absolute rounded-full blur-xl md:blur-2xl"
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            background: blob.gradient,
          }}
        />
      ))}
    </div>
  );
}
