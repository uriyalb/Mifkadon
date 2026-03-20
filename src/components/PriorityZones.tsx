import { useState } from 'react';
import { motion, MotionValue, useMotionValueEvent } from 'framer-motion';

interface Props {
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
}

type Priority = 'high' | 'medium' | 'low';

const ZONES: { priority: Priority; label: string; hint: string; colorClass: string; glowClass: string; bgClass: string }[] = [
  {
    priority: 'high',
    label: 'טופס בטוח',
    hint: '↑ בטוח',
    colorClass: 'text-green-600',
    glowClass: 'zone-glow-high',
    bgClass: 'gradient-high',
  },
  {
    priority: 'medium',
    label: 'סיכוי טוב',
    hint: 'ישר',
    colorClass: 'text-lime-600',
    glowClass: 'zone-glow-medium',
    bgClass: 'gradient-medium',
  },
  {
    priority: 'low',
    label: 'דרושה עבודה',
    hint: '↓ נמוך',
    colorClass: 'text-yellow-600',
    glowClass: 'zone-glow-low',
    bgClass: 'gradient-low',
  },
];

const PRIORITY_THRESHOLD = 50;

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
      className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 justify-center pointer-events-none z-[45]"
      initial={{ x: 150, opacity: 0 }}
      animate={{ x: isVisible ? -16 : 150, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
    >
      {ZONES.map((zone) => {
        const isActive = activePriority === zone.priority;
        return (
          <motion.div
            key={zone.priority}
            animate={{
              scale: isActive ? 1.18 : 0.88,
              opacity: isActive ? 1 : 0.35,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`
              relative flex flex-col items-center justify-center
              w-20 h-16 rounded-2xl text-white shadow-xl
              ${zone.bgClass}
              ${isActive ? zone.glowClass : ''}
            `}
          >
            <span className="text-[11px] font-black text-center leading-tight px-1">{zone.label}</span>
            <span className="text-[9px] font-semibold mt-0.5 text-white/70">{zone.hint}</span>
            {isActive && (
              <motion.div
                layoutId="zone-indicator"
                className="absolute inset-0 rounded-2xl border-2 border-white/70"
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
