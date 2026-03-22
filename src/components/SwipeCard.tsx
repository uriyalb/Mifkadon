
import { useState } from 'react';
import { motion, MotionValue, useTransform, useMotionValueEvent, animate } from 'framer-motion';
import type { Contact, Priority } from '../types/contact';
import ContactAvatar from './ContactAvatar';
import { SOURCE_LABELS, PRIORITY_LABELS } from '../config/labels';
import { SWIPE_TEXT } from '../config/textSwipe';
import { SWIPE_THRESHOLD, ZONE_REVEAL_THRESHOLD, SWIPE_UP_THRESHOLD, getPriority } from '../config/swipeThresholds';

interface Props {
  contact: Contact;
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  onSwipeRight: (priority: Priority) => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  isTop: boolean;
  stackIndex: number; // 0 = top (draggable), 1 = behind, 2 = further
}

export default function SwipeCard({ contact, dragX, dragY, onSwipeRight, onSwipeLeft, onSwipeUp, isTop, stackIndex }: Props) {
  const [activePriority, setActivePriority] = useState<Priority>('medium');

  const rotate = useTransform(dragX, [-300, 0, 300], [-18, 0, 18]);

  // Keep overlay: appears when dragging right
  const keepOpacity = useTransform(dragX, [0, 40, 100], [0, 0.7, 1]);
  // Skip overlay: appears when dragging left
  const skipOpacity = useTransform(dragX, [-100, -40, 0], [1, 0.7, 0]);

  // Registered overlay: appears when dragging up (while not dragging right)
  const registeredOpacity = useTransform(
    [dragY, dragX] as MotionValue[],
    ([y, x]: number[]) => {
      if (x > ZONE_REVEAL_THRESHOLD) return 0; // right-swipe mode, don't show
      if (y >= 0) return 0;
      const absY = Math.abs(y);
      if (absY < 30) return 0;
      return Math.min(1, (absY - 30) / 50);
    }
  );

  // Commitment feedback: card clearly shrinks once past swipe threshold
  const commitScale = useTransform(
    dragX,
    [-120, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, 120],
    [0.82, 0.88, 1, 0.88, 0.82]
  );
  // Commitment ring opacities — appear right as threshold is crossed
  const rightRingOpacity = useTransform(dragX, [50, 100], [0, 1]);
  const leftRingOpacity = useTransform(dragX, [-100, -50], [1, 0]);
  // Registered ring: shows blue glow when dragging up
  const upRingOpacity = useTransform(
    [dragY, dragX] as MotionValue[],
    ([y, x]: number[]) => {
      if (x > ZONE_REVEAL_THRESHOLD) return 0;
      if (y >= 0) return 0;
      return Math.min(1, Math.abs(y) / SWIPE_UP_THRESHOLD);
    }
  );

  // Track priority from vertical drag position
  useMotionValueEvent(dragY, 'change', (y) => {
    if (dragX.get() > ZONE_REVEAL_THRESHOLD) {
      const p = getPriority(y);
      if (p !== activePriority) {
        setActivePriority(p);
      }
    }
  });

  // Reset priority when drag returns to center
  useMotionValueEvent(dragX, 'change', (x) => {
    if (x <= ZONE_REVEAL_THRESHOLD) {
      setActivePriority('medium');
    }
  });

  const scale = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.95 : 0.9;
  const translateY = stackIndex === 0 ? 0 : stackIndex === 1 ? 12 : 22;

  const handleDragEnd = async (_: unknown, info: { offset: { x: number; y: number } }) => {
    if (!isTop) return;
    const { x: ox, y: oy } = info.offset;

    // Swipe up: upward drag dominates and horizontal is below threshold
    if (oy < -SWIPE_UP_THRESHOLD && Math.abs(ox) < SWIPE_THRESHOLD) {
      await Promise.all([
        animate(dragY, -700, { duration: 0.18, ease: 'easeIn' }),
        animate(dragX, 0, { duration: 0.18, ease: 'easeIn' }),
      ]);
      onSwipeUp();
      dragX.set(0);
      dragY.set(0);
    } else if (ox > SWIPE_THRESHOLD) {
      const priority = getPriority(oy);
      const exitY = priority === 'high' ? -200 : priority === 'low' ? 200 : 0;
      await Promise.all([
        animate(dragX, 700, { duration: 0.18, ease: 'easeIn' }),
        animate(dragY, exitY, { duration: 0.18, ease: 'easeIn' }),
      ]);
      onSwipeRight(priority);
      dragX.set(0);
      dragY.set(0);
    } else if (ox < -SWIPE_THRESHOLD) {
      await Promise.all([
        animate(dragX, -700, { duration: 0.18, ease: 'easeIn' }),
        animate(dragY, 0, { duration: 0.18, ease: 'easeIn' }),
      ]);
      onSwipeLeft();
      dragX.set(0);
      dragY.set(0);
    } else {
      // Snap back
      await Promise.all([
        animate(dragX, 0, { type: 'spring', stiffness: 280, damping: 30 }),
        animate(dragY, 0, { type: 'spring', stiffness: 280, damping: 30 }),
      ]);
    }
  };

  const priorityColor = PRIORITY_LABELS[activePriority].color;
  const priorityOverlayBg = PRIORITY_LABELS[activePriority].overlayBg;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center no-select"
      style={{ zIndex: 10 - stackIndex }}
      animate={{ scale, y: translateY }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <motion.div
        drag={isTop}
        dragElastic={0.7}
        dragMomentum={false}
        style={isTop ? { x: dragX, y: dragY, rotate, scale: commitScale } : {}}
        onDragEnd={handleDragEnd}
        className="w-[340px] max-w-[90vw] bg-white rounded-3xl card-shadow overflow-hidden cursor-grab active:cursor-grabbing"
        whileTap={isTop ? { cursor: 'grabbing' } : {}}
      >
        {/* Commitment ring — color matches priority when keeping */}
        {isTop && (
          <motion.div
            style={{
              opacity: rightRingOpacity,
              boxShadow: `0 0 0 3px ${priorityColor}, 0 0 20px ${priorityOverlayBg}, 0 0 44px ${priorityOverlayBg}`,
            }}
            className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          />
        )}
        {/* Commitment ring — red glow (skip) */}
        {isTop && (
          <motion.div
            style={{
              opacity: leftRingOpacity,
              boxShadow: '0 0 0 3px #EF4444, 0 0 20px rgba(239,68,68,0.65), 0 0 44px rgba(239,68,68,0.35)',
            }}
            className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          />
        )}
        {/* Commitment ring — blue glow (registered / swipe up) */}
        {isTop && (
          <motion.div
            style={{
              opacity: upRingOpacity,
              boxShadow: '0 0 0 3px #2196F3, 0 0 20px rgba(33,150,243,0.65), 0 0 44px rgba(33,150,243,0.35)',
            }}
            className="absolute inset-0 rounded-3xl pointer-events-none z-10"
          />
        )}

        {/* Keep overlay — priority-aware with dynamic color */}
        {isTop && (
          <motion.div
            style={{ opacity: keepOpacity }}
            className="absolute inset-0 rounded-3xl z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Background tint — color driven by active priority */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{ backgroundColor: priorityOverlayBg }}
              transition={{ duration: 0.15 }}
            />
            {/* Label: "שמור" + priority name with zone-change pulse */}
            <div
              className="rotate-[-20deg] border-4 rounded-2xl px-6 py-2 z-30"
              style={{ borderColor: priorityColor }}
            >
              <motion.span
                key={activePriority}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="font-black text-3xl tracking-widest block text-center"
                style={{ color: priorityColor }}
              >
                {SWIPE_TEXT.overlays.keep}
              </motion.span>
              <motion.span
                key={`sub-${activePriority}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="text-base font-bold block text-center mt-0.5"
                style={{ color: priorityColor }}
              >
                {PRIORITY_LABELS[activePriority].text} {PRIORITY_LABELS[activePriority].hint}
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* Skip overlay */}
        {isTop && (
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute inset-0 rounded-3xl z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-[#EF4444]/20 rounded-3xl" />
            <div className="rotate-[20deg] border-4 border-[#EF4444] rounded-2xl px-6 py-2 z-30">
              <span className="text-[#EF4444] font-black text-3xl tracking-widest">{SWIPE_TEXT.overlays.skip}</span>
            </div>
          </motion.div>
        )}

        {/* Registered overlay — bright blue, appears on upward drag */}
        {isTop && (
          <motion.div
            style={{ opacity: registeredOpacity }}
            className="absolute inset-0 rounded-3xl z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-[#2196F3]/20 rounded-3xl" />
            <div className="border-4 border-[#2196F3] rounded-2xl px-6 py-2 z-30">
              <span className="text-[#2196F3] font-black text-2xl tracking-widest block text-center">
                {SWIPE_TEXT.overlays.registered}
              </span>
              <span className="text-[#2196F3] font-bold text-sm block text-center mt-0.5">
                ↑↑
              </span>
            </div>
          </motion.div>
        )}

        {/* Photo banner */}
        <div className="h-52 bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
          <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} size="xl" source={contact.source} />
        </div>

        {/* Contact info */}
        <div className="p-5 text-right" dir="rtl">
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{contact.name}</h2>

          {contact.organizationName && (
            <p className="text-sm text-gray-500 mt-0.5">
              {contact.jobTitle ? `${contact.jobTitle} @ ` : ''}{contact.organizationName}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-1.5">
            {contact.phone && (
              <div className="flex items-center text-sm text-gray-500 justify-end">
                <span dir="ltr" className="font-mono tracking-wide">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center text-sm text-gray-500 justify-end">
                <span className="truncate max-w-[220px]">{contact.email}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {SOURCE_LABELS[contact.source] ?? contact.source}
            </span>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
