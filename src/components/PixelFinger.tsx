import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  /** Starting position (absolute px) */
  startX: number;
  startY: number;
  /** Ending position (absolute px) */
  endX: number;
  endY: number;
  /** Whether to show the finger */
  visible: boolean;
  /** Called when the finger animation completes one cycle */
  onAnimationComplete?: () => void;
}

/** 24×24 pixel-art pointing finger, rendered as an inline SVG and scaled up */
function FingerSvg() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Finger pointing right-down — pixel art style */}
      <rect x="10" y="2" width="2" height="2" fill="#FFD4A3" />
      <rect x="12" y="2" width="2" height="2" fill="#FFD4A3" />
      <rect x="8" y="4" width="2" height="2" fill="#FFD4A3" />
      <rect x="10" y="4" width="2" height="2" fill="#FFBB80" />
      <rect x="12" y="4" width="2" height="2" fill="#FFBB80" />
      <rect x="14" y="4" width="2" height="2" fill="#FFD4A3" />
      <rect x="8" y="6" width="2" height="2" fill="#FFD4A3" />
      <rect x="10" y="6" width="2" height="2" fill="#FFBB80" />
      <rect x="12" y="6" width="2" height="2" fill="#FFBB80" />
      <rect x="14" y="6" width="2" height="2" fill="#FFD4A3" />
      <rect x="8" y="8" width="2" height="2" fill="#FFD4A3" />
      <rect x="10" y="8" width="2" height="2" fill="#FFBB80" />
      <rect x="12" y="8" width="2" height="2" fill="#FFBB80" />
      <rect x="14" y="8" width="2" height="2" fill="#FFD4A3" />
      <rect x="4" y="10" width="2" height="2" fill="#FFD4A3" />
      <rect x="6" y="10" width="2" height="2" fill="#FFD4A3" />
      <rect x="8" y="10" width="2" height="2" fill="#FFBB80" />
      <rect x="10" y="10" width="2" height="2" fill="#FFBB80" />
      <rect x="12" y="10" width="2" height="2" fill="#FFBB80" />
      <rect x="14" y="10" width="2" height="2" fill="#FFD4A3" />
      <rect x="2" y="12" width="2" height="2" fill="#FFD4A3" />
      <rect x="4" y="12" width="2" height="2" fill="#FFBB80" />
      <rect x="6" y="12" width="2" height="2" fill="#FFBB80" />
      <rect x="8" y="12" width="2" height="2" fill="#FFBB80" />
      <rect x="10" y="12" width="2" height="2" fill="#FFBB80" />
      <rect x="12" y="12" width="2" height="2" fill="#FFBB80" />
      <rect x="14" y="12" width="2" height="2" fill="#FFD4A3" />
      <rect x="4" y="14" width="2" height="2" fill="#FFD4A3" />
      <rect x="6" y="14" width="2" height="2" fill="#FFBB80" />
      <rect x="8" y="14" width="2" height="2" fill="#FFBB80" />
      <rect x="10" y="14" width="2" height="2" fill="#FFBB80" />
      <rect x="12" y="14" width="2" height="2" fill="#FFD4A3" />
      <rect x="6" y="16" width="2" height="2" fill="#FFD4A3" />
      <rect x="8" y="16" width="2" height="2" fill="#FFBB80" />
      <rect x="10" y="16" width="2" height="2" fill="#FFD4A3" />
      <rect x="8" y="18" width="2" height="2" fill="#FFD4A3" />
      {/* Outline pixels for definition */}
      <rect x="10" y="0" width="4" height="2" fill="#C07040" opacity="0.3" />
      <rect x="6" y="10" width="2" height="2" fill="#C07040" opacity="0.15" />
    </svg>
  );
}

export default function PixelFinger({ startX, startY, endX, endY, visible, onAnimationComplete }: Props) {
  const [animKey, setAnimKey] = useState(0);

  // Restart animation when positions change
  useEffect(() => {
    if (visible) setAnimKey((k) => k + 1);
  }, [startX, startY, endX, endY, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={animKey}
          className="fixed pointer-events-none"
          style={{ zIndex: 80 }}
          initial={{ x: startX - 24, y: startY - 8, opacity: 0, scale: 0.8 }}
          animate={{
            x: [startX - 24, startX - 24, endX - 24, endX - 24 + 6, endX - 24],
            y: [startY - 8, startY - 8, endY - 8, endY - 8 + 6, endY - 8],
            opacity: [0, 1, 1, 1, 1],
            scale: [0.8, 1, 1, 1.1, 1],
          }}
          transition={{
            duration: 1.6,
            times: [0, 0.15, 0.7, 0.85, 1],
            ease: 'easeInOut',
          }}
          onAnimationComplete={onAnimationComplete}
        >
          <FingerSvg />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
