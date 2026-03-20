import { useState } from 'react';
import { motion, MotionValue, useMotionValueEvent } from 'framer-motion';

interface Props {
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
}

type Priority = 'high' | 'medium' | 'low';

const ZONES: {
  priority: Priority;
  label: string;
  hint: string;
  glowClass: string;
  bgClass: string;
  roundedClass: string;
}[] = [
  {
    priority: 'high',
    label: 'טופס בטוח',
    hint: '↑',
    glowClass: 'zone-glow-high',
    bgClass: 'gradient-high',
    roundedClass: 'rounded-tr-2xl',
  },
  {
    priority: 'medium',
    label: 'סיכוי טוב',
    hint: '→',
    glowClass: 'zone-glow-medium',
    bgClass: 'gradient-medium',
    roundedClass: '',
  },
  {
    priority: 'low',
    label: 'דרושה עבודה',
    hint: '↓',
    glowClass: 'zone-glow-low',
    bgClass: 'gradient-low',
    roundedClass: 'rounded-br-2xl',
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
      className="absolute right-0 top-0 bottom-0 flex flex-col pointer-events-none z-[45]"
      initial={{ x: 150, opacity: 0 }}
      animate={{ x: isVisible ? 0 : 150, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      {ZONES.map((zone) => {
        const isActive = activePriority === zone.priority;
        return (
          <motion.div
            key={zone.priority}
            animate={{
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{ duration: 0.12 }}
            className={`
              flex-1 flex flex-col items-center justify-center
              w-24 text-white shadow-xl
              ${zone.bgClass}
              ${zone.roundedClass}
              ${isActive ? zone.glowClass : ''}
            `}
          >
            <span className="text-xs font-black text-center leading-tight px-1">{zone.label}</span>
            <span className="text-sm font-bold mt-0.5 text-white/80">{zone.hint}</span>
            {isActive && (
              <motion.div
                layoutId="zone-indicator"
                className={`absolute inset-0 border-2 border-white/70 ${zone.roundedClass}`}
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
