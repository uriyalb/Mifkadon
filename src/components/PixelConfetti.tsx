import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEBUG_CONFETTI as DEBUG } from '../config/debug';

const COLORS = ['#FFD700', '#E53935', '#EF5350', '#22C55E', '#EAB308', '#84CC16'];
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
  const startX = window.innerWidth * 0.5;
  const startY = window.innerHeight * 0.4;
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.random() * Math.PI * 2);
    const velocity = 80 + Math.random() * 200;
    return {
      id: i,
      x: startX,
      y: startY,
      targetX: Math.cos(angle) * velocity,
      targetY: Math.sin(angle) * velocity + 300 + Math.random() * 200,
      size: 4 + Math.floor(Math.random() * 5),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.2,
    };
  });

  if (DEBUG) {
    console.log('[PixelConfetti] createParticles', {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      origin: { x: startX, y: startY },
      count: particles.length,
      sample: particles.slice(0, 3).map((p) => ({
        id: p.id,
        start: { x: p.x, y: p.y },
        target: { x: p.x + p.targetX, y: p.y + p.targetY },
        size: p.size,
        color: p.color,
        duration: p.duration,
      })),
    });
  }

  return particles;
}

export default function PixelConfetti() {
  const [particles] = useState(createParticles);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (DEBUG) console.log('[PixelConfetti] mounted, visible=true');
    const t = setTimeout(() => {
      if (DEBUG) console.log('[PixelConfetti] auto-dismiss after 3.5s');
      setVisible(false);
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  if (DEBUG) {
    console.log('[PixelConfetti] render, visible:', visible, 'particles:', particles.length);
  }

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
                x: p.x,
                y: p.y,
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: p.x + p.targetX,
                y: p.y + p.targetY,
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
