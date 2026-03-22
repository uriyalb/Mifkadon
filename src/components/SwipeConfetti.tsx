import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#2196F3', '#64B5F6', '#FFD700', '#E53935', '#22C55E', '#42A5F5', '#BBDEFB', '#FFF176'];
const PARTICLE_COUNT = 100;

interface Particle {
  id: number;
  // Percentage-based start position (vw/vh)
  startVw: number;
  startVh: number;
  // Pixel offsets for mid and end positions (relative to start)
  midOffsetX: number;
  midOffsetY: number;
  endOffsetX: number;
  endOffsetY: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
  round: boolean;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Spawn from left or right side
    const fromLeft = i % 2 === 0;
    const startVw = fromLeft
      ? 5 + Math.random() * 20    // 5-25vw from left
      : 75 + Math.random() * 20;  // 75-95vw from left
    const startVh = 5 + Math.random() * 15; // 5-20vh from top

    // Drift toward center
    const driftX = fromLeft
      ? 30 + Math.random() * 80   // drift rightward
      : -(30 + Math.random() * 80); // drift leftward
    const sway = (Math.random() - 0.5) * 40;

    // Float downward
    const fallMid = 100 + Math.random() * 150;
    const fallEnd = fallMid + 100 + Math.random() * 200;

    return {
      id: i,
      startVw,
      startVh,
      midOffsetX: driftX * 0.5 + sway,
      midOffsetY: fallMid,
      endOffsetX: driftX + sway * 1.5,
      endOffsetY: fallEnd,
      size: 5 + Math.floor(Math.random() * 7),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 540 - 270,
      delay: Math.random() * 0.5,
      duration: 1.8 + Math.random() * 1.2,
      round: Math.random() > 0.5,
    };
  });
}

interface Props {
  trigger: number;
}

export default function SwipeConfetti({ trigger }: Props) {
  const [bursts, setBursts] = useState<Array<{ key: number; particles: Particle[] }>>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const burst = { key: trigger, particles: createParticles() };
    setBursts((prev) => [...prev, burst]);
    const t = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.key !== burst.key));
    }, 4500);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" style={{ imageRendering: 'pixelated' }}>
      <AnimatePresence>
        {bursts.map((burst) =>
          burst.particles.map((p) => (
            <motion.div
              key={`${burst.key}-${p.id}`}
              initial={{
                x: `${p.startVw}vw`,
                y: `${p.startVh}vh`,
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: [
                  `${p.startVw}vw`,
                  `calc(${p.startVw}vw + ${p.midOffsetX}px)`,
                  `calc(${p.startVw}vw + ${p.endOffsetX}px)`,
                ],
                y: [
                  `${p.startVh}vh`,
                  `calc(${p.startVh}vh + ${p.midOffsetY}px)`,
                  `calc(${p.startVh}vh + ${p.endOffsetY}px)`,
                ],
                opacity: [1, 1, 1, 0.7, 0],
                rotate: p.rotate,
                scale: [1, 1.1, 1, 0.8, 0.4],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeOut',
                x: { duration: p.duration, times: [0, 0.4, 1], ease: 'easeInOut' },
                y: { duration: p.duration, times: [0, 0.4, 1], ease: [0.15, 0, 0.5, 1] },
                opacity: { duration: p.duration, times: [0, 0.08, 0.4, 0.75, 1] },
                scale: { duration: p.duration, times: [0, 0.1, 0.4, 0.75, 1] },
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.round ? 1 : 0,
              }}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
