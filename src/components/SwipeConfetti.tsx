import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#2196F3', '#64B5F6', '#FFD700', '#E53935', '#22C55E', '#42A5F5', '#BBDEFB', '#FFF176'];
const PARTICLE_COUNT = 50;

interface Particle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
}

function createParticles(): Particle[] {
  // Origin near the card center
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.4;

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 120 + Math.random() * 280;
    return {
      id: i,
      startX: cx + (Math.random() - 0.5) * 40,
      startY: cy + (Math.random() - 0.5) * 40,
      targetX: Math.cos(angle) * velocity,
      targetY: Math.sin(angle) * velocity + 60, // slight gravity bias
      size: 5 + Math.floor(Math.random() * 7),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.15,
      duration: 1.2 + Math.random() * 0.8,
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
    }, 3000);
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
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: p.startX + p.targetX,
                y: p.startY + p.targetY,
                opacity: [1, 1, 0.8, 0],
                rotate: p.rotate,
                scale: [1, 1.2, 0.6],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 0.61, 0.36, 1],
                opacity: { duration: p.duration, times: [0, 0.3, 0.7, 1] },
                scale: { duration: p.duration, times: [0, 0.2, 1] },
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
