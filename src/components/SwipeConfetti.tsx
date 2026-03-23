import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEBUG_CONFETTI as DEBUG } from '../config/debug';

const COLORS = ['#2196F3', '#64B5F6', '#FFD700', '#E53935', '#22C55E', '#42A5F5', '#BBDEFB', '#FFF176'];
const PARTICLE_COUNT = 100;

interface Particle {
  id: number;
  startVw: number;
  startVh: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
}

function createParticles(): Particle[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const startVw = fromLeft
      ? 10 + Math.random() * 15   // 10-25vw
      : 75 + Math.random() * 15;  // 75-90vw
    const startVh = 5 + Math.random() * 10; // 5-15vh

    // Convert to pixels for consistent Framer Motion interpolation
    const startX = (startVw / 100) * vw;
    const startY = (startVh / 100) * vh;

    // Drift toward center + fall down
    const driftX = fromLeft
      ? 30 + Math.random() * 100
      : -(30 + Math.random() * 100);
    const fallY = 200 + Math.random() * 300;

    return {
      id: i,
      startVw: startX,
      startVh: startY,
      targetX: driftX + (Math.random() - 0.5) * 40,
      targetY: fallY,
      size: 5 + Math.floor(Math.random() * 7),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 540 - 270,
      delay: Math.random() * 0.5,
      duration: 1.8 + Math.random() * 1.2,
    };
  });

  if (DEBUG) {
    console.log('[SwipeConfetti] createParticles', {
      viewport: { width: vw, height: vh },
      count: particles.length,
      sample: particles.slice(0, 3).map((p) => ({
        id: p.id,
        start: { x: p.startVw, y: p.startVh },
        target: { x: p.startVw + p.targetX, y: p.startVh + p.targetY },
        size: p.size,
        color: p.color,
        duration: p.duration,
        delay: p.delay,
      })),
    });
  }

  return particles;
}

interface Props {
  trigger: number;
}

export default function SwipeConfetti({ trigger }: Props) {
  const [bursts, setBursts] = useState<Array<{ key: number; particles: Particle[] }>>([]);

  useEffect(() => {
    if (trigger === 0) return;
    if (DEBUG) console.log('[SwipeConfetti] trigger fired:', trigger);
    const burst = { key: trigger, particles: createParticles() };
    setBursts((prev) => [...prev, burst]);
    const t = setTimeout(() => {
      if (DEBUG) console.log('[SwipeConfetti] burst cleanup:', burst.key);
      setBursts((prev) => prev.filter((b) => b.key !== burst.key));
    }, 4500);
    return () => clearTimeout(t);
  }, [trigger]);

  if (DEBUG && bursts.length > 0) {
    console.log('[SwipeConfetti] rendering', bursts.length, 'burst(s),', bursts.reduce((n, b) => n + b.particles.length, 0), 'particles total');
  }

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" style={{ imageRendering: 'pixelated' }}>
      <AnimatePresence>
        {bursts.map((burst) =>
          burst.particles.map((p) => (
            <motion.div
              key={`${burst.key}-${p.id}`}
              initial={{
                x: p.startVw,
                y: p.startVh,
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: p.startVw + p.targetX,
                y: p.startVh + p.targetY,
                opacity: 0,
                rotate: p.rotate,
                scale: 0.5,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
