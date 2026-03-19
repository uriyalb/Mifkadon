import { motion } from 'framer-motion';

interface Props {
  chapterIndex: number;
  arrivedCity: string;
  flavorText: string;
  contactsSorted: number;
  secondsElapsed: number;
  onNext: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getStars(seconds: number): number {
  if (seconds <= 60) return 3;
  if (seconds <= 180) return 2;
  return 1;
}

export default function LevelSummaryScreen({
  chapterIndex,
  arrivedCity,
  flavorText,
  contactsSorted,
  secondsElapsed,
  onNext,
}: Props) {
  const stars = getStars(secondsElapsed);
  const totalChapters = 8;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #2d0d45 100%)',
      }}
    >
      {/* Stars */}
      <div className="flex items-end gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={
              i <= stars
                ? { scale: 1, rotate: 0, opacity: 1 }
                : { scale: 0.8, rotate: 0, opacity: 0.2 }
            }
            transition={{
              delay: 0.3 + i * 0.2,
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
              damping: 15,
            }}
            className="flex items-center justify-center"
            style={{
              width: i === 2 ? 64 : 48,
              height: i === 2 ? 64 : 48,
              marginBottom: i === 2 ? 8 : 0,
            }}
          >
            <span
              style={{
                fontSize: i === 2 ? 48 : 36,
                filter: i <= stars
                  ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))'
                  : 'grayscale(1)',
              }}
            >
              ⭐
            </span>
          </motion.div>
        ))}
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-4xl font-black mb-2 text-center"
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FF6B35)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        כל הכבוד!
      </motion.h2>

      {/* Arrived at */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="text-center mb-6"
      >
        <p className="text-white/90 text-lg font-bold mb-1">
          הגעת ל: <span className="text-amber-300">{arrivedCity}</span>
        </p>
        <p className="text-white/50 text-sm max-w-[280px] leading-relaxed">{flavorText}</p>
      </motion.div>

      {/* Character sprite (static, celebratory) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, type: 'spring', stiffness: 200 }}
        className="mb-6"
        style={{
          width: 86,
          height: 96,
          backgroundImage: 'url(/Ilan_sprite.png)',
          backgroundSize: '200% 200%',
          backgroundPosition: '0% 0%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 4px 12px rgba(255, 107, 53, 0.4))',
          animation: 'ilan-ride-sprite 0.667s steps(1) infinite',
        }}
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="flex items-center gap-6 mb-2 text-white/70 text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span>{contactsSorted} אנשי קשר</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">⏱</span>
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </motion.div>

      {/* Chapter indicator */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="text-white/40 text-xs mb-8"
      >
        פרק {chapterIndex + 1} מתוך {totalChapters}
      </motion.p>

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-shadow hover:shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #FF2D78, #FF6BA8)',
          boxShadow: '0 8px 32px rgba(255, 45, 120, 0.4)',
        }}
      >
        {chapterIndex + 1 >= totalChapters ? 'לתוצאות' : 'המשך למסע'}
      </motion.button>
    </motion.div>
  );
}
