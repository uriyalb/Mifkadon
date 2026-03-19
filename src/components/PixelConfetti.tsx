import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#FFD700', '#FF2D78', '#FF6BA8', '#22C55E', '#EAB308', '#84CC16'];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  x: number;
  y: number;
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
    const angle = (Math.random() * Math.PI * 2);
    const velocity = 80 + Math.random() * 200;
    return {
      id: i,
      x: 0,
      y: 0,
      targetX: Math.cos(angle) * velocity,
      targetY: Math.sin(angle) * velocity + 300 + Math.random() * 200,
      size: 4 + Math.floor(Math.random() * 5),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.2,
    };
  });
}

export default function PixelConfetti() {
  const [particles] = useState(createParticles);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none overflow-hidden"
          style={{ imageRendering: 'pixelated' }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: '50vw',
                y: '40vh',
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: `calc(50vw + ${p.targetX}px)`,
                y: `calc(40vh + ${p.targetY}px)`,
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
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
