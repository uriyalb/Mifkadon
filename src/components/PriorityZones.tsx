import { useState } from 'react';
import { motion, MotionValue, useMotionValueEvent } from 'framer-motion';
import type { Priority } from '../types/contact';
import { ZONE_REVEAL_THRESHOLD, getPriority } from '../config/swipeThresholds';

interface Props {
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
}

const ZONES: { priority: Priority; bgClass: string; glowClass: string }[] = [
  { priority: 'high',   bgClass: 'gradient-high',   glowClass: 'zone-strip-glow-high' },
  { priority: 'medium', bgClass: 'gradient-medium', glowClass: 'zone-strip-glow-medium' },
  { priority: 'low',    bgClass: 'gradient-low',    glowClass: 'zone-strip-glow-low' },
];

export default function PriorityZones({ dragX, dragY }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [activePriority, setActivePriority] = useState<Priority>('medium');

  useMotionValueEvent(dragX, 'change', (x) => {
    setIsVisible(x > ZONE_REVEAL_THRESHOLD);
  });

  useMotionValueEvent(dragY, 'change', (y) => {
    if (dragX.get() > ZONE_REVEAL_THRESHOLD) {
      setActivePriority(getPriority(y));
    }
  });

  return (
    <motion.div
      className="fixed right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
      style={{ height: '36vh', zIndex: 60 }}
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: isVisible ? 0 : 30, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {ZONES.map((zone) => {
        const isActive = activePriority === zone.priority;
        return (
          <motion.div
            key={zone.priority}
            animate={{
              opacity: isActive ? 1 : 0.3,
              scale: isActive ? 1.2 : 1,
            }}
            transition={{ duration: 0.12 }}
            className={`
              flex-1 w-4 rounded-full
              ${zone.bgClass}
              ${isActive ? zone.glowClass : ''}
            `}
          />
        );
      })}
    </motion.div>
  );
}
