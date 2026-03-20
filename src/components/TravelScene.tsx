import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty } from '../config/chapters';
import { DIFFICULTY_LABELS } from '../config/labels';

interface Props {
  fromCity: string;
  toCity: string;
  pct: number; // 0–100
  current: number; // contacts swiped in this chapter
  total: number;   // total contacts in this chapter
  difficulty: Difficulty;
}

// Inline SVG data URLs for pixel-art building silhouettes
const FAR_BUILDINGS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='70' fill='none'%3E%3Crect x='0' y='30' width='28' height='40' fill='%23150b30'/%3E%3Crect x='3' y='33' width='4' height='3' fill='%23ff8c42' opacity='0.3'/%3E%3Crect x='12' y='38' width='4' height='3' fill='%23ffb347' opacity='0.25'/%3E%3Crect x='35' y='15' width='18' height='55' fill='%231a0e3d'/%3E%3Crect x='38' y='18' width='3' height='3' fill='%23ff6b35' opacity='0.35'/%3E%3Crect x='46' y='28' width='3' height='3' fill='%23ffb347' opacity='0.2'/%3E%3Crect x='60' y='25' width='40' height='45' fill='%23150b30'/%3E%3Crect x='65' y='28' width='4' height='3' fill='%23ff8c42' opacity='0.3'/%3E%3Crect x='78' y='33' width='4' height='3' fill='%23ff6b35' opacity='0.25'/%3E%3Crect x='85' y='43' width='4' height='3' fill='%23ffb347' opacity='0.3'/%3E%3Crect x='108' y='20' width='22' height='50' fill='%231a0e3d'/%3E%3Crect x='112' y='24' width='3' height='3' fill='%23ff8c42' opacity='0.3'/%3E%3Crect x='120' y='34' width='3' height='3' fill='%23ffb347' opacity='0.2'/%3E%3Crect x='138' y='35' width='32' height='35' fill='%23150b30'/%3E%3Crect x='142' y='38' width='4' height='3' fill='%23ff6b35' opacity='0.25'/%3E%3Crect x='155' y='45' width='4' height='3' fill='%23ff8c42' opacity='0.3'/%3E%3Crect x='178' y='12' width='15' height='58' fill='%231a0e3d'/%3E%3Crect x='181' y='16' width='3' height='3' fill='%23ffb347' opacity='0.35'/%3E%3Crect x='200' y='28' width='35' height='42' fill='%23150b30'/%3E%3Crect x='205' y='32' width='4' height='3' fill='%23ff6b35' opacity='0.3'/%3E%3Crect x='220' y='40' width='4' height='3' fill='%23ff8c42' opacity='0.2'/%3E%3Crect x='242' y='22' width='20' height='48' fill='%231a0e3d'/%3E%3Crect x='246' y='26' width='3' height='3' fill='%23ffb347' opacity='0.3'/%3E%3Crect x='270' y='32' width='38' height='38' fill='%23150b30'/%3E%3Crect x='275' y='36' width='4' height='3' fill='%23ff6b35' opacity='0.25'/%3E%3Crect x='290' y='42' width='4' height='3' fill='%23ff8c42' opacity='0.3'/%3E%3Crect x='316' y='18' width='16' height='52' fill='%231a0e3d'/%3E%3Crect x='319' y='22' width='3' height='3' fill='%23ffb347' opacity='0.35'/%3E%3Crect x='340' y='30' width='30' height='40' fill='%23150b30'/%3E%3Crect x='345' y='34' width='4' height='3' fill='%23ff6b35' opacity='0.3'/%3E%3Crect x='360' y='44' width='4' height='3' fill='%23ff8c42' opacity='0.2'/%3E%3Crect x='378' y='24' width='22' height='46' fill='%231a0e3d'/%3E%3Crect x='382' y='28' width='3' height='3' fill='%23ffb347' opacity='0.25'/%3E%3C/svg%3E")`;

const NEAR_BUILDINGS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='90' fill='none'%3E%3Crect x='0' y='20' width='35' height='70' fill='%230d0825'/%3E%3Crect x='5' y='25' width='5' height='4' fill='%23ff6b35' opacity='0.5'/%3E%3Crect x='15' y='25' width='5' height='4' fill='%23ffb347' opacity='0.4'/%3E%3Crect x='5' y='35' width='5' height='4' fill='%23ff8c42' opacity='0.35'/%3E%3Crect x='15' y='35' width='5' height='4' fill='%23ff6b35' opacity='0.45'/%3E%3Crect x='5' y='45' width='5' height='4' fill='%23ffb347' opacity='0.3'/%3E%3Crect x='15' y='45' width='5' height='4' fill='%23ff8c42' opacity='0.4'/%3E%3Crect x='40' y='5' width='25' height='85' fill='%230a0620'/%3E%3Crect x='44' y='10' width='4' height='4' fill='%23ff6b35' opacity='0.5'/%3E%3Crect x='54' y='10' width='4' height='4' fill='%23ffb347' opacity='0.35'/%3E%3Crect x='44' y='22' width='4' height='4' fill='%23ff8c42' opacity='0.45'/%3E%3Crect x='54' y='22' width='4' height='4' fill='%23ff6b35' opacity='0.3'/%3E%3Crect x='44' y='34' width='4' height='4' fill='%23ffb347' opacity='0.5'/%3E%3Crect x='54' y='34' width='4' height='4' fill='%23ff8c42' opacity='0.4'/%3E%3Crect x='44' y='46' width='4' height='4' fill='%23ff6b35' opacity='0.35'/%3E%3Crect x='54' y='46' width='4' height='4' fill='%23ffb347' opacity='0.45'/%3E%3Crect x='70' y='30' width='45' height='60' fill='%230d0825'/%3E%3Crect x='76' y='35' width='5' height='4' fill='%23ffb347' opacity='0.45'/%3E%3Crect x='88' y='35' width='5' height='4' fill='%23ff6b35' opacity='0.35'/%3E%3Crect x='76' y='45' width='5' height='4' fill='%23ff8c42' opacity='0.5'/%3E%3Crect x='88' y='45' width='5' height='4' fill='%23ff6b35' opacity='0.4'/%3E%3Crect x='100' y='55' width='5' height='4' fill='%23ffb347' opacity='0.3'/%3E%3Crect x='122' y='10' width='20' height='80' fill='%230a0620'/%3E%3Crect x='126' y='14' width='4' height='4' fill='%23ff6b35' opacity='0.5'/%3E%3Crect x='134' y='14' width='4' height='4' fill='%23ff8c42' opacity='0.35'/%3E%3Crect x='126' y='26' width='4' height='4' fill='%23ffb347' opacity='0.45'/%3E%3Crect x='134' y='26' width='4' height='4' fill='%23ff6b35' opacity='0.4'/%3E%3Crect x='126' y='38' width='4' height='4' fill='%23ff8c42' opacity='0.5'/%3E%3Crect x='126' y='50' width='4' height='4' fill='%23ffb347' opacity='0.3'/%3E%3Crect x='150' y='25' width='40' height='65' fill='%230d0825'/%3E%3Crect x='156' y='30' width='5' height='4' fill='%23ff6b35' opacity='0.45'/%3E%3Crect x='168' y='30' width='5' height='4' fill='%23ffb347' opacity='0.35'/%3E%3Crect x='156' y='42' width='5' height='4' fill='%23ff8c42' opacity='0.5'/%3E%3Crect x='168' y='42' width='5' height='4' fill='%23ff6b35' opacity='0.4'/%3E%3Crect x='178' y='54' width='5' height='4' fill='%23ffb347' opacity='0.3'/%3E%3Crect x='198' y='15' width='22' height='75' fill='%230a0620'/%3E%3Crect x='202' y='20' width='4' height='4' fill='%23ff6b35' opacity='0.5'/%3E%3Crect x='210' y='20' width='4' height='4' fill='%23ff8c42' opacity='0.35'/%3E%3Crect x='202' y='32' width='4' height='4' fill='%23ffb347' opacity='0.45'/%3E%3Crect x='210' y='32' width='4' height='4' fill='%23ff6b35' opacity='0.4'/%3E%3Crect x='202' y='44' width='4' height='4' fill='%23ff8c42' opacity='0.5'/%3E%3Crect x='228' y='28' width='36' height='62' fill='%230d0825'/%3E%3Crect x='234' y='33' width='5' height='4' fill='%23ffb347' opacity='0.4'/%3E%3Crect x='246' y='33' width='5' height='4' fill='%23ff6b35' opacity='0.45'/%3E%3Crect x='234' y='45' width='5' height='4' fill='%23ff8c42' opacity='0.35'/%3E%3Crect x='246' y='45' width='5' height='4' fill='%23ffb347' opacity='0.5'/%3E%3Crect x='272' y='8' width='18' height='82' fill='%230a0620'/%3E%3Crect x='276' y='13' width='4' height='4' fill='%23ff6b35' opacity='0.5'/%3E%3Crect x='276' y='25' width='4' height='4' fill='%23ffb347' opacity='0.4'/%3E%3Crect x='284' y='25' width='4' height='4' fill='%23ff8c42' opacity='0.35'/%3E%3Crect x='276' y='37' width='4' height='4' fill='%23ff6b35' opacity='0.45'/%3E%3Crect x='298' y='22' width='32' height='68' fill='%230d0825'/%3E%3Crect x='304' y='27' width='5' height='4' fill='%23ff8c42' opacity='0.45'/%3E%3Crect x='316' y='27' width='5' height='4' fill='%23ffb347' opacity='0.35'/%3E%3Crect x='304' y='39' width='5' height='4' fill='%23ff6b35' opacity='0.5'/%3E%3Crect x='316' y='39' width='5' height='4' fill='%23ff8c42' opacity='0.4'/%3E%3Crect x='338' y='18' width='22' height='72' fill='%230a0620'/%3E%3Crect x='342' y='23' width='4' height='4' fill='%23ffb347' opacity='0.5'/%3E%3Crect x='342' y='35' width='4' height='4' fill='%23ff6b35' opacity='0.4'/%3E%3Crect x='350' y='35' width='4' height='4' fill='%23ff8c42' opacity='0.35'/%3E%3C/svg%3E")`;

export default function TravelScene({ fromCity, toCity, pct, current, total, difficulty }: Props) {
  const clampedPct = Math.max(0, Math.min(100, pct));
  const diffCfg = DIFFICULTY_LABELS[difficulty];

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
          style={{
            background: 'linear-gradient(180deg, #0d0d1a 0%, #1a1040 35%, #2d1060 60%, #4a1a6b 80%, #ff6b35 100%)',
          }}
        />

        {/* Stars */}
        <div className="absolute inset-0" style={{ opacity: 0.6 }}>
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
          className="absolute bottom-[18px] left-0 h-[70px]"
          style={{
            width: '200%',
            backgroundImage: FAR_BUILDINGS,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom',
            backgroundSize: '400px 70px',
            animation: 'travel-scroll-far 25s linear infinite',
            imageRendering: 'pixelated',
          }}
        />

        {/* Near buildings layer - parallax (faster) */}
        <div
          className="absolute bottom-[18px] left-0 h-[90px]"
          style={{
            width: '200%',
            backgroundImage: NEAR_BUILDINGS,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom',
            backgroundSize: '360px 90px',
            animation: 'travel-scroll-near 12s linear infinite',
            imageRendering: 'pixelated',
          }}
        />

        {/* Road */}
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: 18,
            background: 'linear-gradient(180deg, #1a1225 0%, #0f0a18 100%)',
          }}
        >
          {/* Road markings */}
          <div
            className="absolute top-[8px] left-0 h-[2px]"
            style={{
              width: '200%',
              backgroundImage: 'repeating-linear-gradient(to right, #333 0px, #333 16px, transparent 16px, transparent 32px)',
              animation: 'travel-scroll-near 12s linear infinite',
            }}
          />
        </div>

        {/* Character sprite — 2×2 grid (172×192, each frame 86×96) */}
        <div
          className="absolute z-10"
          style={{
            width: 86,
            height: 96,
            bottom: 14,
            left: `clamp(4px, calc(${clampedPct}% - 43px), calc(100% - 90px))`,
            transition: 'left 300ms ease-out',
            backgroundImage: 'url(/Ilan_sprite.png)',
            backgroundSize: '200% 200%',
            backgroundRepeat: 'no-repeat',
            animation: 'ilan-ride-sprite 0.667s steps(1) infinite',
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
