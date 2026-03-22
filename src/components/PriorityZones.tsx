import { useState } from 'react';
import { motion, MotionValue, useMotionValueEvent } from 'framer-motion';
import type { Priority } from '../types/contact';
import { PRIORITY_LABELS } from '../config/labels';
import { ZONE_REVEAL_THRESHOLD, getPriority, getPriorityThreshold } from '../config/swipeThresholds';

interface Props {
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  dragStartY: number | null;
}

const ZONES: {
  priority: Priority;
  glowClass: string;
  bgClass: string;
  position: 'top' | 'middle' | 'bottom';
}[] = [
  { priority: 'high',   glowClass: 'zone-glow-high',   bgClass: 'gradient-high',   position: 'top' },
  { priority: 'medium', glowClass: 'zone-glow-medium', bgClass: 'gradient-medium', position: 'middle' },
  { priority: 'low',    glowClass: 'zone-glow-low',    bgClass: 'gradient-low',    position: 'bottom' },
];

export default function PriorityZones({ dragX, dragY, dragStartY }: Props) {
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

  // Each zone's visual height matches the actual drag threshold
  const threshold = getPriorityThreshold();
  const zoneHeight = Math.max(64, threshold);
  const totalHeight = zoneHeight * 3;

  // Center the panel on the touch start Y, clamped to viewport
  const MARGIN = 20;
  const centerY = dragStartY ?? window.innerHeight / 2;
  const rawTop = centerY - totalHeight / 2;
  const clampedTop = Math.max(MARGIN, Math.min(rawTop, window.innerHeight - totalHeight - MARGIN));

  return (
    <motion.div
      className="fixed right-0 flex flex-col pointer-events-none"
      style={{ top: clampedTop, height: totalHeight, zIndex: 60 }}
      initial={{ x: 150, opacity: 0 }}
      animate={{ x: isVisible ? 0 : 150, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      {ZONES.map((zone) => {
        const isActive = activePriority === zone.priority;
        const roundedClass = zone.position === 'top'
          ? 'rounded-tl-2xl'
          : zone.position === 'bottom'
            ? 'rounded-bl-2xl'
            : '';

        return (
          <motion.div
            key={zone.priority}
            animate={{ opacity: isActive ? 1 : 0.35 }}
            transition={{ duration: 0.12 }}
            className={`
              flex-1 flex flex-col items-center justify-center relative
              w-24 text-white shadow-xl
              ${zone.bgClass}
              ${roundedClass}
              ${isActive ? zone.glowClass : ''}
            `}
          >
            <span className="text-xs font-black text-center leading-tight px-1">
              {PRIORITY_LABELS[zone.priority].zoneName}
            </span>
            <span className="text-sm font-bold mt-0.5 text-white/80">
              {PRIORITY_LABELS[zone.priority].hint}
            </span>
            {isActive && (
              <motion.div
                layoutId="zone-indicator"
                className={`absolute inset-0 border-2 border-white/70 ${roundedClass}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
