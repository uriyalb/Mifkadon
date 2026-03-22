import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty } from '../config/chapters';
import { DIFFICULTY_LABELS } from '../config/labels';
import { CHAPTER_THEMES, SKYLINE_STRUCTURES, generateSvgDataUrl } from '../config/sceneThemes';

interface Props {
  fromCity: string;
  toCity: string;
  pct: number; // 0–100
  current: number; // contacts swiped in this chapter
  total: number;   // total contacts in this chapter
  difficulty: Difficulty;
  chapterIndex: number;
}

export default function TravelScene({ fromCity, toCity, pct, current, total, difficulty, chapterIndex }: Props) {
  const clampedPct = Math.max(0, Math.min(100, pct));
  const diffCfg = DIFFICULTY_LABELS[difficulty];

  // Resolve theme for this chapter
  const theme = CHAPTER_THEMES[chapterIndex] ?? CHAPTER_THEMES[0];
  const structures = SKYLINE_STRUCTURES[theme.structureKey];
  const { palette } = theme;

  const farBuildingsSvg = useMemo(
    () => generateSvgDataUrl(structures.far, palette.farBuildingColors, palette.windowColors),
    [chapterIndex],
  );
  const nearBuildingsSvg = useMemo(
    () => generateSvgDataUrl(structures.near, palette.nearBuildingColors, palette.windowColors),
    [chapterIndex],
  );

  return (
    <div className="w-full select-none" dir="ltr" style={{ height: 150 }}>
      {/* City labels row — LTR so progress goes left→right matching the character */}
      <div className="flex items-center justify-between px-3 pb-1">
        <span className="text-[11px] font-bold text-white/90 drop-shadow-sm">{fromCity}</span>

        {/* Progress counter + difficulty badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: diffCfg.color + '30', color: diffCfg.color }}
          >
            {diffCfg.text}
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={current}
              initial={{ scale: 1.4, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
              className="text-[11px] font-bold text-white/80 bg-white/10 rounded-full px-2 py-0.5 tabular-nums"
            >
              {current} / {total}
            </motion.span>
          </AnimatePresence>
        </div>

        <span className="text-[11px] font-bold text-amber-300/90 drop-shadow-sm">{toCity}</span>
      </div>

      {/* Scene container */}
      <div
        className="relative w-full overflow-hidden rounded-xl mx-auto"
        style={{ height: 130, maxWidth: '100%' }}
      >
        {/* Sky layer */}
        <div
          className="absolute inset-0"
          style={{ background: palette.skyGradient }}
        />

        {/* Stars */}
        <div className="absolute inset-0" style={{ opacity: palette.starOpacity }}>
          <div className="absolute w-1 h-1 bg-white rounded-full" style={{ top: 8, left: '12%' }} />
          <div className="absolute w-[2px] h-[2px] bg-white rounded-full" style={{ top: 15, left: '35%' }} />
          <div className="absolute w-1 h-1 bg-white/70 rounded-full" style={{ top: 6, left: '55%' }} />
          <div className="absolute w-[2px] h-[2px] bg-white rounded-full" style={{ top: 18, left: '72%' }} />
          <div className="absolute w-1 h-1 bg-white/50 rounded-full" style={{ top: 10, left: '88%' }} />
          <div className="absolute w-[2px] h-[2px] bg-white/80 rounded-full" style={{ top: 22, left: '22%' }} />
          <div className="absolute w-1 h-1 bg-white/60 rounded-full" style={{ top: 4, left: '42%' }} />
          <div className="absolute w-[2px] h-[2px] bg-white/70 rounded-full" style={{ top: 12, left: '65%' }} />
        </div>

        {/* Far buildings layer - parallax (slow) */}
        <div
          className="absolute bottom-[18px] left-0"
          style={{
            width: '200%',
            height: structures.far.svgHeight,
            backgroundImage: farBuildingsSvg,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom',
            backgroundSize: `${structures.far.svgWidth}px ${structures.far.svgHeight}px`,
            animation: 'travel-scroll-far 25s linear infinite',
            imageRendering: 'pixelated',
          }}
        />

        {/* Near buildings layer - parallax (faster) */}
        <div
          className="absolute bottom-[18px] left-0"
          style={{
            width: '200%',
            height: structures.near.svgHeight,
            backgroundImage: nearBuildingsSvg,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom',
            backgroundSize: `${structures.near.svgWidth}px ${structures.near.svgHeight}px`,
            animation: 'travel-scroll-near 12s linear infinite',
            imageRendering: 'pixelated',
          }}
        />

        {/* Road */}
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: 18,
            background: `linear-gradient(180deg, ${palette.roadGradient[0]} 0%, ${palette.roadGradient[1]} 100%)`,
          }}
        >
          {/* Road markings */}
          <div
            className="absolute top-[8px] left-0 h-[2px]"
            style={{
              width: '200%',
              backgroundImage: `repeating-linear-gradient(to right, ${palette.roadMarkingColor} 0px, ${palette.roadMarkingColor} 16px, transparent 16px, transparent 32px)`,
              animation: 'travel-scroll-near 12s linear infinite',
            }}
          />
        </div>

        {/* Character sprite — 3×4 grid (344×288, each frame ~114×72) */}
        <div
          className="absolute z-10"
          style={{
            width: 86,
            height: 96,
            bottom: theme.characterBottom,
            left: `clamp(4px, calc(${clampedPct}% - 43px), calc(100% - 90px))`,
            transition: 'left 300ms ease-out',
            backgroundImage: 'url(/Ilan_sprite.png)',
            backgroundSize: '400% 300%',
            backgroundRepeat: 'no-repeat',
            animation: 'ilan-ride-sprite 2s linear infinite',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        />

        {/* Progress bar at bottom of road */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${clampedPct}%`,
              background: 'linear-gradient(90deg, #FF2D78, #FFD700)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
