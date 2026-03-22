import { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionValue, useMotionValueEvent, AnimatePresence, motion } from 'framer-motion';
import type { Priority } from '../types/contact';
import { WALKTHROUGH_CARDS, WALKTHROUGH_COMPLETE, WALKTHROUGH_FEEDBACK } from '../config/tutorialConfig';
import CardStack from './CardStack';
import PriorityZones from './PriorityZones';
import PixelFinger from './PixelFinger';
import PixelConfetti from './PixelConfetti';

interface Props {
  onComplete: () => void;
}

type Phase = 'playing' | 'complete';

export default function WalkthroughOverlay({ onComplete }: Props) {
  const [cardIndex, setCardIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [shakeKey, setShakeKey] = useState(0);
  const [showFinger, setShowFinger] = useState(false);
  const [wrongToast, setWrongToast] = useState(false);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const cardAreaRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCard = cardIndex < WALKTHROUGH_CARDS.length ? WALKTHROUGH_CARDS[cardIndex] : null;
  const remaining = WALKTHROUGH_CARDS.slice(cardIndex).map((c) => c.contact);

  // Capture touch start Y for PriorityZones positioning
  useEffect(() => {
    const el = cardAreaRef.current;
    if (!el) return;
    const handler = (e: PointerEvent) => setDragStartY(e.clientY);
    el.addEventListener('pointerdown', handler);
    return () => el.removeEventListener('pointerdown', handler);
  }, []);

  useMotionValueEvent(dragX, 'change', (x) => {
    if (x === 0) setDragStartY(null);
  });

  // Show finger after initial delay, and re-show after idle
  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (phase === 'playing') {
        setShowFinger(true);
      }
    }, WALKTHROUGH_FEEDBACK.fingerIdleDelay);
  }, [phase]);

  // Show finger on first card mount and when cardIndex changes
  useEffect(() => {
    if (phase !== 'playing') return;
    setShowFinger(false);
    const t = setTimeout(() => {
      setShowFinger(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cardIndex, shakeKey, phase]);

  // Hide finger when user starts dragging
  useMotionValueEvent(dragX, 'change', (x) => {
    if (Math.abs(x) > 5 && showFinger) {
      setShowFinger(false);
      startIdleTimer();
    }
  });

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (wrongToastTimer.current) clearTimeout(wrongToastTimer.current);
    };
  }, []);

  const isCorrectAction = useCallback((direction: 'right' | 'left', priority?: Priority): boolean => {
    if (!currentCard) return false;
    const { correctAction } = currentCard;
    if (correctAction.type === 'skip') return direction === 'left';
    if (correctAction.type === 'keep') {
      return direction === 'right' && priority === correctAction.priority;
    }
    return false;
  }, [currentCard]);

  const handleSwipeRight = useCallback((_contact: unknown, priority: Priority) => {
    if (!currentCard) return;
    if (isCorrectAction('right', priority)) {
      // Correct! Advance to next card
      if (cardIndex + 1 >= WALKTHROUGH_CARDS.length) {
        setPhase('complete');
      } else {
        setCardIndex((i) => i + 1);
      }
    } else {
      // Wrong priority — shake and replay finger
      setWrongToast(true);
      if (wrongToastTimer.current) clearTimeout(wrongToastTimer.current);
      wrongToastTimer.current = setTimeout(() => setWrongToast(false), 1500);
      setShakeKey((k) => k + 1);
    }
  }, [currentCard, cardIndex, isCorrectAction]);

  const handleSwipeLeft = useCallback((_contact: unknown) => {
    if (!currentCard) return;
    if (isCorrectAction('left')) {
      // Correct!
      if (cardIndex + 1 >= WALKTHROUGH_CARDS.length) {
        setPhase('complete');
      } else {
        setCardIndex((i) => i + 1);
      }
    } else {
      // Wrong — shake and replay finger
      setWrongToast(true);
      if (wrongToastTimer.current) clearTimeout(wrongToastTimer.current);
      wrongToastTimer.current = setTimeout(() => setWrongToast(false), 1500);
      setShakeKey((k) => k + 1);
    }
  }, [currentCard, cardIndex, isCorrectAction]);

  // Compute finger target positions based on card center
  const getFingerPositions = useCallback(() => {
    const el = cardAreaRef.current;
    if (!el || !currentCard) return { startX: 0, startY: 0, endX: 0, endY: 0 };

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const { correctAction } = currentCard;
    if (correctAction.type === 'skip') {
      return { startX: cx, startY: cy, endX: cx - 180, endY: cy };
    }
    // keep with priority
    const endX = cx + 180;
    const endY = correctAction.priority === 'high' ? cy - 100
      : correctAction.priority === 'low' ? cy + 100
      : cy;
    return { startX: cx, startY: cy, endX, endY };
  }, [currentCard]);

  const fingerPos = getFingerPositions();

  if (phase === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-[100dvh] overflow-hidden flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 40%, #FFB3D1 70%, #FFF0F6 100%)' }}
      >
        <PixelConfetti />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black text-white mb-2">{WALKTHROUGH_COMPLETE.title}</h1>
          <p className="text-lg text-white/80 mb-8">{WALKTHROUGH_COMPLETE.subtitle}</p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            onClick={onComplete}
            className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}
          >
            {WALKTHROUGH_COMPLETE.continueLabel}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 40%, #FFB3D1 70%, #FFF0F6 100%)' }}
    >
      {/* Progress indicator */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-white/60 text-xs font-bold">הדרכה</span>
          <div className="flex gap-1.5">
            {WALKTHROUGH_CARDS.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i < cardIndex ? 'bg-white' : i === cardIndex ? 'bg-white/80 ring-2 ring-white/40' : 'bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hint banner */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div
            key={cardIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="shrink-0 px-4 pb-2"
          >
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center" dir="rtl">
              <span className="text-white text-sm font-bold">{currentCard.hint}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card area */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative px-4">
        <motion.div
          key={shakeKey}
          ref={cardAreaRef}
          className="relative w-[340px] max-w-[90vw]"
          animate={shakeKey > 0 ? {
            x: [0, -10, 10, -10, 10, 0],
          } : {}}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence>
            {remaining.length > 0 && (
              <CardStack
                key={`stack-${cardIndex}`}
                contacts={remaining}
                dragX={dragX}
                dragY={dragY}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                onSwipeUp={() => {}}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Priority zones */}
      <PriorityZones dragX={dragX} dragY={dragY} dragStartY={dragStartY} />

      {/* Pixel finger */}
      <PixelFinger
        startX={fingerPos.startX}
        startY={fingerPos.startY}
        endX={fingerPos.endX}
        endY={fingerPos.endY}
        visible={showFinger && phase === 'playing'}
        onAnimationComplete={() => {}}
      />

      {/* Wrong action toast */}
      <AnimatePresence>
        {wrongToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap"
          >
            {WALKTHROUGH_FEEDBACK.wrongAction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
