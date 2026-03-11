
import { motion, MotionValue, useTransform, animate } from 'framer-motion';
import type { Contact, Priority } from '../types/contact';
import ContactAvatar from './ContactAvatar';

interface Props {
  contact: Contact;
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  onSwipeRight: (priority: Priority) => void;
  onSwipeLeft: () => void;
  isTop: boolean;
  stackIndex: number; // 0 = top (draggable), 1 = behind, 2 = further
}

const SWIPE_THRESHOLD = 120;
const PRIORITY_THRESHOLD = 80;

function getPriority(y: number): Priority {
  if (y < -PRIORITY_THRESHOLD) return 'high';
  if (y > PRIORITY_THRESHOLD) return 'low';
  return 'medium';
}

const SOURCE_LABEL: Record<string, string> = {
  google: 'Google Contacts',
  facebook: 'Facebook',
  instagram: 'Instagram',
  manual: 'ידני',
};

export default function SwipeCard({ contact, dragX, dragY, onSwipeRight, onSwipeLeft, isTop, stackIndex }: Props) {
  const rotate = useTransform(dragX, [-300, 0, 300], [-18, 0, 18]);

  // Keep overlay: appears when dragging right
  const keepOpacity = useTransform(dragX, [0, 60, 140], [0, 0.7, 1]);
  // Skip overlay: appears when dragging left
  const skipOpacity = useTransform(dragX, [-140, -60, 0], [1, 0.7, 0]);

  const scale = stackIndex === 0 ? 1 : stackIndex === 1 ? 0.95 : 0.9;
  const translateY = stackIndex === 0 ? 0 : stackIndex === 1 ? 12 : 22;

  const handleDragEnd = async (_: unknown, info: { offset: { x: number; y: number } }) => {
    if (!isTop) return;
    const { x: ox, y: oy } = info.offset;

    if (ox > SWIPE_THRESHOLD) {
      const priority = getPriority(oy);
      const exitY = priority === 'high' ? -200 : priority === 'low' ? 200 : 0;
      await Promise.all([
        animate(dragX, 700, { duration: 0.28, ease: 'easeIn' }),
        animate(dragY, exitY, { duration: 0.28, ease: 'easeIn' }),
      ]);
      onSwipeRight(priority);
      // Reset for next card
      dragX.set(0);
      dragY.set(0);
    } else if (ox < -SWIPE_THRESHOLD) {
      await Promise.all([
        animate(dragX, -700, { duration: 0.28, ease: 'easeIn' }),
        animate(dragY, 0, { duration: 0.28, ease: 'easeIn' }),
      ]);
      onSwipeLeft();
      dragX.set(0);
      dragY.set(0);
    } else {
      // Snap back
      await Promise.all([
        animate(dragX, 0, { type: 'spring', stiffness: 300, damping: 25 }),
        animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 25 }),
      ]);
    }
  };

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
        style={isTop ? { x: dragX, y: dragY, rotate } : {}}
        onDragEnd={handleDragEnd}
        className="w-[340px] max-w-[90vw] bg-white rounded-3xl card-shadow overflow-hidden cursor-grab active:cursor-grabbing"
        whileTap={isTop ? { cursor: 'grabbing' } : {}}
      >
        {/* Keep overlay */}
        {isTop && (
          <motion.div
            style={{ opacity: keepOpacity }}
            className="absolute inset-0 rounded-3xl z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-[#FF2D78]/20 rounded-3xl" />
            <div className="rotate-[-20deg] border-4 border-[#FF2D78] rounded-2xl px-6 py-2 z-30">
              <span className="text-[#FF2D78] font-black text-3xl tracking-widest">שמור ❤️</span>
            </div>
          </motion.div>
        )}

        {/* Skip overlay */}
        {isTop && (
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute inset-0 rounded-3xl z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-[#2D9CFF]/20 rounded-3xl" />
            <div className="rotate-[20deg] border-4 border-[#2D9CFF] rounded-2xl px-6 py-2 z-30">
              <span className="text-[#2D9CFF] font-black text-3xl tracking-widest">דלג 👋</span>
            </div>
          </motion.div>
        )}

        {/* Photo banner */}
        <div className="h-52 bg-gradient-to-br from-pink-100 to-rose-50 flex items-center justify-center relative overflow-hidden">
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
              <div className="flex items-center gap-2 text-sm text-gray-600 justify-end">
                <span dir="ltr">{contact.phone}</span>
                <span>📱</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 justify-end">
                <span className="truncate max-w-[200px]">{contact.email}</span>
                <span>✉️</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {SOURCE_LABEL[contact.source] ?? contact.source}
            </span>
          </div>
        </div>

        {/* Bottom hint (top card only) */}
        {isTop && (
          <div className="px-5 pb-4 text-center" dir="rtl">
            <p className="text-xs text-gray-400">
              גרור לימין לשמירה • גרור שמאלה לדילוג
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              גובה הגרירה קובע את העדיפות: 🔥 למעלה / ⭐ אמצע / ✓ למטה
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
