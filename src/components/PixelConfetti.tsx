import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEBUG_CONFETTI as DEBUG } from '../config/debug';

const COLORS = ['#FFD700', '#E53935', '#EF5350', '#22C55E', '#EAB308', '#84CC16'];
const PARTICLE_COUNT = 40;

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
  const x = window.innerWidth * 0.5;
  const y = window.innerHeight * 0.4;

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 80 + Math.random() * 200;
    return {
      id: i,
      x,
      y,
      dx: Math.cos(angle) * velocity,
      dy: Math.sin(angle) * velocity + 300 + Math.random() * 200,
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
    console.log('[PixelConfetti] mounted, particles:', particles.length);
    if (DEBUG) {
      console.log('[PixelConfetti] sample:', particles.slice(0, 3));
    }
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 60,
            pointerEvents: 'none',
            overflow: 'hidden',
            imageRendering: 'pixelated',
          }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
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
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
