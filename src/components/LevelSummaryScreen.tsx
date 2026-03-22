import { motion } from 'framer-motion';
import type { ChapterStats, Priority } from '../types/contact';
import type { Difficulty } from '../config/chapters';
import { DIFFICULTY_LABELS, PRIORITY_LABELS, SPEED_BONUS } from '../config/labels';
import { JOURNEY_TEXT } from '../config/textJourney';
import PixelConfetti from './PixelConfetti';

interface Props {
  chapterIndex: number;
  arrivedCity: string;
  flavorText: string;
  stats: ChapterStats;
  difficulty: Difficulty;
  onNext: () => void;
  isLastChapter: boolean;
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
  stats,
  difficulty,
  onNext,
  isLastChapter,
}: Props) {
  const stars = getStars(stats.secondsElapsed);
  const totalChapters = 8;
  const totalSorted = stats.kept + stats.skipped;
  const keepPct = totalSorted > 0 ? Math.round((stats.kept / totalSorted) * 100) : 0;
  const diffCfg = DIFFICULTY_LABELS[difficulty];

  const speedBonusText = stats.secondsElapsed <= 30 ? SPEED_BONUS.flash : stats.secondsElapsed <= 60 ? SPEED_BONUS.fast : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #2d0d45 100%)',
      }}
    >
      {/* Pixel confetti */}
      <PixelConfetti />

      {/* Difficulty badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        className="absolute top-6 left-6 px-3 py-1 rounded-full text-xs font-bold"
        style={{ backgroundColor: diffCfg.color + '30', color: diffCfg.color }}
      >
        {diffCfg.text}
      </motion.div>

      {/* Stars */}
      <div className="flex items-end gap-3 mb-4">
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

      {/* Title — "הגעת ל-<city>" */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-3xl font-black mb-1 text-center"
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FF6B35)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {JOURNEY_TEXT.arrivedTitle(arrivedCity)}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-white/50 text-sm max-w-[280px] leading-relaxed text-center mb-4"
      >
        {flavorText}
      </motion.p>

      {/* Character sprite */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, type: 'spring', stiffness: 200 }}
        className="mb-4"
        style={{
          width: 86,
          height: 96,
          backgroundImage: 'url(/Ilan_sprite.png)',
          backgroundSize: '400% 300%',
          backgroundPosition: '0% 0%',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 4px 12px rgba(255, 107, 53, 0.4))',
          animation: 'ilan-ride-sprite 2s linear infinite',
        }}
      />

      {/* Speed bonus badge */}
      {speedBonusText && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 400 }}
          className="mb-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FF6B35)',
            color: '#0d0d1a',
          }}
        >
          {speedBonusText}
        </motion.div>
      )}

      {/* Rich stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="w-full max-w-[300px] mb-3"
      >
        {/* Row 1: Contacts + Time */}
        <div className="flex items-center justify-center gap-6 mb-3 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <span>{JOURNEY_TEXT.contactsLabel(totalSorted)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱</span>
            <span>{formatTime(stats.secondsElapsed)}</span>
          </div>
        </div>

        {/* Row 2: Keep/Skip ratio bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-white/50 mb-1">
            <span>{JOURNEY_TEXT.keptLabel(stats.kept)}</span>
            <span>{JOURNEY_TEXT.skippedLabel(stats.skipped)}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/10 flex">
            <div
              className="h-full rounded-l-full"
              style={{
                width: `${keepPct}%`,
                background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
              }}
            />
            <div
              className="h-full rounded-r-full"
              style={{
                width: `${100 - keepPct}%`,
                background: 'linear-gradient(90deg, #EF4444, #F87171)',
              }}
            />
          </div>
        </div>

        {/* Row 3: Priority breakdown pills */}
        {stats.kept > 0 && (
          <div className="flex items-center justify-center gap-2">
            {(['high', 'medium', 'low'] as Priority[]).map((p) => {
              const count = stats.priorityBreakdown[p] ?? 0;
              if (count === 0) return null;
              const cfg = PRIORITY_LABELS[p];
              return (
                <div
                  key={p}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                  style={{ background: cfg.bg }}
                >
                  <span>{count}</span>
                  <span>{cfg.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Chapter indicator */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="text-white/40 text-xs mb-6"
      >
        {JOURNEY_TEXT.chapterOf(chapterIndex, totalChapters)}
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
        {isLastChapter ? JOURNEY_TEXT.nextButton.results : JOURNEY_TEXT.nextButton.map}
      </motion.button>
    </motion.div>
  );
}
