import { useState } from 'react';
import { motion } from 'framer-motion';
import type { JourneyCity } from '../data/journeyRoute';
import { CHAPTERS } from '../config/chapters';
import { DIFFICULTY_LABELS } from '../config/labels';
import { JOURNEY_TEXT } from '../config/textJourney';

interface Props {
  completedChapter: number; // 0-indexed chapter just completed
  cities: JourneyCity[];
  onContinue: () => void;
  isLastChapter: boolean;
}

// Node vertical positions (top=Jerusalem, bottom=Ashdod), reversed so index 0=bottom
function getNodeY(index: number, total: number): number {
  const padding = 60;
  const usable = 520 - padding * 2;
  return padding + usable - (index / (total - 1)) * usable;
}

// Slight horizontal zigzag to make the path interesting
function getNodeX(index: number): number {
  const base = 160;
  const offsets = [0, 30, -25, 35, -30, 25, -35, 30, 0];
  return base + (offsets[index] ?? 0);
}

// Build SVG path through all nodes
function buildPath(cities: JourneyCity[]): string {
  const total = cities.length;
  let d = '';
  for (let i = 0; i < total; i++) {
    const x = getNodeX(i);
    const y = getNodeY(i, total);
    if (i === 0) {
      d += `M ${x} ${y}`;
    } else {
      const prevX = getNodeX(i - 1);
      const prevY = getNodeY(i - 1, total);
      const midY = (prevY + y) / 2;
      d += ` C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
    }
  }
  return d;
}

export default function JourneyMap({ completedChapter, cities, onContinue, isLastChapter }: Props) {
  const total = cities.length;
  const arrivedIndex = completedChapter + 1; // city index the player just arrived at
  const [ilanArrived, setIlanArrived] = useState(false);

  const pathD = buildPath(cities);
  const nextCity = cities[arrivedIndex + 1]?.name;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 40%, #2d0d45 100%)',
      }}
    >
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-white/90 mb-2 text-center"
      >
        {JOURNEY_TEXT.mapTitle}
      </motion.h2>

      {/* Map container */}
      <div className="relative" style={{ width: 320, height: 520 }} dir="ltr">
        {/* SVG path */}
        <svg
          className="absolute inset-0"
          width={320}
          height={520}
          style={{ shapeRendering: 'crispEdges' }}
        >
          {/* Background path (full, dimmed) */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={3}
            strokeDasharray="8 6"
          />
          {/* Completed path (gold) */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="#FFD700"
            strokeWidth={3}
            strokeDasharray="8 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: arrivedIndex / (total - 1) }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
          />
        </svg>

        {/* City nodes */}
        {cities.map((city, i) => {
          const x = getNodeX(i);
          const y = getNodeY(i, total);
          const isCompleted = i <= arrivedIndex;
          const isCurrent = i === arrivedIndex;
          const size = isCurrent ? 28 : 20;

          // Difficulty label between cities (for legs, not start/end)
          const legDifficulty = i > 0 && i <= CHAPTERS.length ? CHAPTERS[i - 1] : null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute"
              style={{ left: x - size / 2, top: y - size / 2 }}
            >
              {/* Node circle */}
              <motion.div
                animate={isCurrent && ilanArrived ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: isCompleted ? '#FFD700' : 'rgba(255,255,255,0.15)',
                  boxShadow: isCurrent && ilanArrived
                    ? '0 0 16px rgba(255,215,0,0.6), 0 0 32px rgba(255,215,0,0.3)'
                    : isCompleted
                      ? '0 0 8px rgba(255,215,0,0.3)'
                      : 'none',
                }}
              >
                {isCompleted && !isCurrent && (
                  <span style={{ fontSize: 10, color: '#0d0d1a' }}>✓</span>
                )}
              </motion.div>

              {/* City name label */}
              <div
                className="absolute whitespace-nowrap text-[11px] font-bold"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  ...(i % 2 === 0
                    ? { left: size + 8 }
                    : { right: size + 8 }),
                  color: isCompleted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                }}
                dir="rtl"
              >
                {city.name}
              </div>

              {/* Difficulty badge on the leg (positioned between nodes) */}
              {legDifficulty && (
                <div
                  className="absolute text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    top: -16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: DIFFICULTY_LABELS[legDifficulty.difficulty].color + '30',
                    color: DIFFICULTY_LABELS[legDifficulty.difficulty].color,
                    opacity: isCompleted ? 0.8 : 0.3,
                  }}
                >
                  {DIFFICULTY_LABELS[legDifficulty.difficulty].text}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Ilan sprite animating to arrived city */}
        <motion.div
          initial={{
            left: getNodeX(arrivedIndex - 1) - 20,
            top: getNodeY(arrivedIndex - 1, total) - 48,
          }}
          animate={{
            left: getNodeX(arrivedIndex) - 20,
            top: getNodeY(arrivedIndex, total) - 48,
          }}
          transition={{
            duration: 1.8,
            delay: 1.0,
            type: 'spring',
            stiffness: 60,
            damping: 18,
          }}
          onAnimationComplete={() => setIlanArrived(true)}
          className="absolute z-10"
          style={{
            width: 40,
            height: 48,
            backgroundImage: 'url(/Ilan_sprite.png)',
            backgroundSize: '300% 400%',
            backgroundPosition: '0% 0%',
            backgroundRepeat: 'no-repeat',
            animation: 'ilan-ride-sprite 2s steps(1) infinite',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 2px 8px rgba(255, 107, 53, 0.5))',
          }}
        />
      </div>

      {/* Flavor text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: ilanArrived ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="text-white/50 text-sm text-center max-w-[260px] mt-2 leading-relaxed"
      >
        {cities[arrivedIndex]?.flavor}
      </motion.p>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: ilanArrived ? 1 : 0, y: ilanArrived ? 0 : 20 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="mt-4 px-8 py-3 rounded-2xl text-white font-bold text-base shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #FF2D78, #FF6BA8)',
          boxShadow: '0 8px 32px rgba(255, 45, 120, 0.4)',
          pointerEvents: ilanArrived ? 'auto' : 'none',
        }}
      >
        {isLastChapter ? JOURNEY_TEXT.mapButton.results : JOURNEY_TEXT.mapButton.next(nextCity!)}
      </motion.button>
    </motion.div>
  );
}
