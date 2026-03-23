import { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionValue, useMotionValueEvent, AnimatePresence, motion } from 'framer-motion';
import type { Priority } from '../types/contact';
import { WALKTHROUGH_CARDS, WALKTHROUGH_FEEDBACK } from '../config/tutorialConfig';
import CardStack from './CardStack';
import PriorityZones from './PriorityZones';
import PixelFinger from './PixelFinger';
import TravelScene from './TravelScene';
import Header from './Header';
import { JOURNEY } from '../data/journeyRoute';
import { PRIORITY_LABELS } from '../config/labels';
import { SWIPE_TEXT } from '../config/textSwipe';

interface Props {
  onComplete: () => void;
}

export default function WalkthroughOverlay({ onComplete }: Props) {
  const [cardIndex, setCardIndex] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [showFinger, setShowFinger] = useState(false);
  const [wrongToast, setWrongToast] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const cardAreaRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCard = cardIndex < WALKTHROUGH_CARDS.length ? WALKTHROUGH_CARDS[cardIndex] : null;
  const remaining = WALKTHROUGH_CARDS.slice(cardIndex).map((c) => c.contact);

  // Progress as percentage for TravelScene
  const scenePct = Math.round((cardIndex / WALKTHROUGH_CARDS.length) * 100);
  const fromCity = JOURNEY[0]?.name ?? 'תחילת המסע';
  const toCity = JOURNEY[1]?.name ?? 'יעד ראשון';

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
      setShowFinger(true);
    }, WALKTHROUGH_FEEDBACK.fingerIdleDelay);
  }, []);

  // Show finger on first card mount and when cardIndex changes
  useEffect(() => {
    setShowFinger(false);
    const t = setTimeout(() => {
      setShowFinger(true);
    }, 1000);
    return () => clearTimeout(t);
  }, [cardIndex, shakeKey]);

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
      if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    };
  }, []);

  const showWrongFeedback = useCallback(() => {
    setWrongToast(true);
    if (wrongToastTimer.current) clearTimeout(wrongToastTimer.current);
    wrongToastTimer.current = setTimeout(() => setWrongToast(false), 1500);
    setShakeKey((k) => k + 1);
  }, []);

  const advanceCard = useCallback(() => {
    if (cardIndex + 1 >= WALKTHROUGH_CARDS.length) {
      onComplete();
    } else {
      setCardIndex((i) => i + 1);
    }
  }, [cardIndex, onComplete]);

  const handleSwipeRight = useCallback((_contact: unknown, priority: Priority) => {
    if (!currentCard) return;
    const { correctAction } = currentCard;
    if (correctAction.type === 'keep' && priority === correctAction.priority) {
      advanceCard();
    } else {
      showWrongFeedback();
    }
  }, [currentCard, advanceCard, showWrongFeedback]);

  const handleSwipeLeft = useCallback((_contact: unknown) => {
    if (!currentCard) return;
    if (currentCard.correctAction.type === 'skip') {
      advanceCard();
    } else {
      showWrongFeedback();
    }
  }, [currentCard, advanceCard, showWrongFeedback]);

  const handleSwipeUp = useCallback((_contact: unknown) => {
    if (!currentCard) return;
    if (currentCard.correctAction.type === 'registered') {
      advanceCard();
    } else {
      showWrongFeedback();
    }
  }, [currentCard, advanceCard, showWrongFeedback]);

  // Button-triggered keep with priority picker
  const openPriorityPicker = useCallback(() => {
    if (!currentCard) return;
    setShowPriorityPicker(true);
    if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    pickerTimerRef.current = setTimeout(() => {
      setShowPriorityPicker(false);
    }, 5000);
  }, [currentCard]);

  const pickPriority = useCallback((priority: Priority) => {
    if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    setShowPriorityPicker(false);
    handleSwipeRight(null, priority);
  }, [handleSwipeRight]);

  const dismissPicker = useCallback(() => {
    if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    setShowPriorityPicker(false);
  }, []);

  // Button-triggered skip
  const handleSkipButton = useCallback(() => {
    dismissPicker();
    if (remaining.length > 0) handleSwipeLeft(remaining[0]);
  }, [remaining, handleSwipeLeft, dismissPicker]);

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
    if (correctAction.type === 'registered') {
      return { startX: cx, startY: cy, endX: cx, endY: cy - 200 };
    }
    // keep with priority
    const endX = cx + 180;
    const endY = correctAction.priority === 'high' ? cy - 100
      : correctAction.priority === 'low' ? cy + 100
      : cy;
    return { startX: cx, startY: cy, endX, endY };
  }, [currentCard]);

  const fingerPos = getFingerPositions();

  const canAct = remaining.length > 0;

  return (
    <div
      className="h-[100dvh] overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #E53935 0%, #EF5350 40%, #FFCDD2 70%, #FFF5F5 100%)' }}
    >
      <Header />

      {/* Travel scene — mirrors SwipePage exactly */}
      <div className="shrink-0 px-2">
        <TravelScene
          fromCity={fromCity}
          toCity={toCity}
          pct={scenePct}
          current={cardIndex}
          total={WALKTHROUGH_CARDS.length}
          difficulty="easy"
          chapterIndex={0}
        />

        {/* Progress indicator row */}
        <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-white/60 tabular-nums relative" dir="rtl">
          <span className="text-white/70 font-bold">הדרכה</span>
          <span className="text-white/30">|</span>
          <div className="flex gap-1.5 items-center">
            {WALKTHROUGH_CARDS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i < cardIndex
                    ? 'w-2 h-2 bg-white'
                    : i === cardIndex
                    ? 'w-2.5 h-2.5 bg-white ring-2 ring-white/40'
                    : 'w-2 h-2 bg-white/25'
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
            className="shrink-0 px-4 pb-2 pt-1"
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
          animate={shakeKey > 0 ? { x: [0, -10, 10, -10, 10, 0] } : {}}
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
                onSwipeUp={handleSwipeUp}
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
        visible={showFinger}
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

      {/* Action buttons — identical to SwipePage */}
      <div className="shrink-0 px-4 pb-2 flex flex-col items-center gap-3">
        <div className="relative w-full max-w-[340px]" style={{ zIndex: 55 }}>
          {/* Priority picker */}
          <AnimatePresence>
            {showPriorityPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 flex flex-col gap-1.5"
                style={{ zIndex: 55 }}
                dir="ltr"
              >
                <div className="flex items-center gap-2 justify-center">
                  {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => pickPriority(p)}
                      className="flex-1 h-12 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center"
                      style={{ background: PRIORITY_LABELS[p].bg }}
                    >
                      <span className="text-sm leading-tight">{PRIORITY_LABELS[p].zoneName}</span>
                      <span className="text-[10px] opacity-75 leading-tight">{PRIORITY_LABELS[p].text}</span>
                    </button>
                  ))}
                </div>
                {/* Countdown bar */}
                <motion.div
                  className="h-0.5 mx-4 rounded-full bg-white/50"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  style={{ transformOrigin: 'right' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3" dir="ltr">
            {/* Skip */}
            <button
              onClick={handleSkipButton}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl bg-red-500/30 border-2 border-red-400 text-red-100 font-bold text-lg flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-red-500/50 active:enabled:scale-95"
            >
              <span className="text-xl leading-none">✕</span>
              <span>{SWIPE_TEXT.buttons.skip}</span>
            </button>

            {/* Undo — disabled in walkthrough (no real state to undo) */}
            <button
              disabled
              className="flex-none w-16 h-14 rounded-2xl glass border border-red-200 flex items-center justify-center text-[#E53935] text-sm font-bold opacity-30 cursor-not-allowed"
              title={SWIPE_TEXT.buttons.undoTitle}
            >
              {SWIPE_TEXT.buttons.undo}
            </button>

            {/* Keep */}
            <button
              onClick={() => { dismissPicker(); openPriorityPicker(); }}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl gradient-pink text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:opacity-90 active:enabled:scale-95"
            >
              <span>{SWIPE_TEXT.buttons.keep}</span>
              <span className="text-xl leading-none">✓</span>
            </button>
          </div>
        </div>

        {/* Spacer for safe area */}
        <div className="pb-safe-bottom pb-2" />
      </div>
    </div>
  );
}
