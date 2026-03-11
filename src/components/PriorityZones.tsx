import { useState } from 'react';
import { motion, MotionValue, useMotionValueEvent } from 'framer-motion';

interface Props {
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
}

type Priority = 'high' | 'medium' | 'low';

const ZONES: { priority: Priority; label: string; emoji: string; colorClass: string; glowClass: string; bgClass: string }[] = [
  {
    priority: 'high',
    label: 'גבוהה',
    emoji: '🔥',
    colorClass: 'text-red-500',
    glowClass: 'zone-glow-high',
    bgClass: 'gradient-high',
  },
  {
    priority: 'medium',
    label: 'בינונית',
    emoji: '⭐',
    colorClass: 'text-yellow-500',
    glowClass: 'zone-glow-medium',
    bgClass: 'gradient-medium',
  },
  {
    priority: 'low',
    label: 'נמוכה',
    emoji: '✓',
    colorClass: 'text-emerald-500',
    glowClass: 'zone-glow-low',
    bgClass: 'gradient-low',
  },
];

const PRIORITY_THRESHOLD = 80;

function getActivePriority(y: number): Priority {
  if (y < -PRIORITY_THRESHOLD) return 'high';
  if (y > PRIORITY_THRESHOLD) return 'low';
  return 'medium';
}

export default function PriorityZones({ dragX, dragY }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [activePriority, setActivePriority] = useState<Priority>('medium');

  useMotionValueEvent(dragX, 'change', (x) => {
    setIsVisible(x > 30);
  });

  useMotionValueEvent(dragY, 'change', (y) => {
    if (dragX.get() > 30) {
      setActivePriority(getActivePriority(y));
    }
  });

  return (
    <motion.div
      className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-6 pr-2 pointer-events-none z-10"
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: isVisible ? 0 : 120, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {ZONES.map((zone) => {
        const isActive = activePriority === zone.priority;
        return (
          <motion.div
            key={zone.priority}
            animate={{
              scale: isActive ? 1.15 : 0.9,
              opacity: isActive ? 1 : 0.55,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`
              flex flex-col items-center justify-center
              w-16 h-20 rounded-2xl text-white shadow-lg
              ${zone.bgClass}
              ${isActive ? zone.glowClass : ''}
            `}
          >
            <span className="text-2xl">{zone.emoji}</span>
            <span className="text-[10px] font-bold mt-1 text-center leading-tight">{zone.label}</span>
            {isActive && (
              <motion.div
                layoutId="zone-indicator"
                className="absolute inset-0 rounded-2xl border-2 border-white/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
