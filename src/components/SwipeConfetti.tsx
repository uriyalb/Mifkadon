import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#2196F3', '#64B5F6', '#FFD700', '#FF2D78', '#22C55E', '#42A5F5'];
const PARTICLE_COUNT = 30;

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 60 + Math.random() * 160;
    return {
      id: i,
      targetX: Math.cos(angle) * velocity,
      targetY: Math.sin(angle) * velocity - 80, // bias upward
      size: 3 + Math.floor(Math.random() * 5),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.2,
      duration: 0.8 + Math.random() * 0.6,
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
    }, 2000);
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
                x: '50vw',
                y: '45vh',
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: `calc(50vw + ${p.targetX}px)`,
                y: `calc(45vh + ${p.targetY}px)`,
                opacity: 0,
                rotate: p.rotate,
                scale: 0.3,
              }}
              exit={{ opacity: 0 }}
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
