import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEBUG_CONFETTI as DEBUG } from '../config/debug';

const COLORS = ['#2196F3', '#64B5F6', '#FFD700', '#E53935', '#22C55E', '#42A5F5', '#BBDEFB', '#FFF176'];
const PARTICLE_COUNT = 100;

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
}

function createParticles(): Particle[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const fromLeft = i % 2 === 0;
    // Start from top-left or top-right region
    const x = fromLeft
      ? vw * (0.1 + Math.random() * 0.15)
      : vw * (0.75 + Math.random() * 0.15);
    const y = vh * (0.05 + Math.random() * 0.1);

    // Drift toward center + fall down
    const dx = fromLeft
      ? 30 + Math.random() * 100
      : -(30 + Math.random() * 100);
    const dy = 200 + Math.random() * 300;

    return {
      id: i,
      x,
      y,
      dx: dx + (Math.random() - 0.5) * 40,
      dy,
      size: 5 + Math.floor(Math.random() * 7),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 540 - 270,
      delay: Math.random() * 0.5,
      duration: 1.8 + Math.random() * 1.2,
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
    console.log('[SwipeConfetti] trigger fired:', trigger);
    const particles = createParticles();
    if (DEBUG) {
      console.log('[SwipeConfetti] particles created:', particles.length, 'sample:', particles.slice(0, 3));
    }
    const burst = { key: trigger, particles };
    setBursts((prev) => [...prev, burst]);
    const t = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.key !== burst.key));
    }, 4500);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 70,
        pointerEvents: 'none',
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      <AnimatePresence>
        {bursts.map((burst) =>
          burst.particles.map((p) => (
            <motion.div
              key={`${burst.key}-${p.id}`}
              initial={{ x: p.x, y: p.y, opacity: 1, rotate: 0, scale: 1 }}
              animate={{
                x: p.x + p.dx,
                y: p.y + p.dy,
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
                top: 0,
                left: 0,
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
