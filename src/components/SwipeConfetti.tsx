import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#2196F3', '#64B5F6', '#FFD700', '#E53935', '#22C55E', '#42A5F5', '#BBDEFB', '#FFF176'];
const PARTICLE_COUNT = 100;

interface Particle {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
}

function createParticles(): Particle[] {
  const w = window.innerWidth;
  const h = window.innerHeight;

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Spawn from left or right side of the screen
    const fromLeft = i % 2 === 0;
    const startX = fromLeft
      ? Math.random() * w * 0.15          // left 15%
      : w - Math.random() * w * 0.15;     // right 15%
    const startY = Math.random() * h * 0.3 - h * 0.05; // top area, slightly above screen

    // Horizontal drift toward center with some randomness
    const driftX = fromLeft
      ? 40 + Math.random() * 160   // drift rightward
      : -(40 + Math.random() * 160); // drift leftward
    const sway = (Math.random() - 0.5) * 80; // gentle random sway

    // Float downward naturally
    const fallDistance = h * 0.5 + Math.random() * h * 0.5;

    return {
      id: i,
      startX,
      startY,
      midX: startX + driftX * 0.6 + sway,
      midY: startY + fallDistance * 0.4,
      endX: startX + driftX + sway * 2,
      endY: startY + fallDistance,
      size: 5 + Math.floor(Math.random() * 7),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 540 - 270,
      delay: Math.random() * 0.6,
      duration: 2.0 + Math.random() * 1.5,
    };
  });
}

interface Props {
  trigger: number; // increment to trigger new burst
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
                x: p.startX,
                y: p.startY,
                opacity: 0,
                rotate: 0,
                scale: 0.5,
              }}
              animate={{
                x: [p.startX, p.midX, p.endX],
                y: [p.startY, p.midY, p.endY],
                opacity: [0, 1, 1, 0.7, 0],
                rotate: p.rotate,
                scale: [0.5, 1.1, 1, 0.8, 0.4],
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
                borderRadius: Math.random() > 0.5 ? 0 : 1,
              }}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
