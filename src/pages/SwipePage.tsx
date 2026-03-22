import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMotionValue, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact, Priority, ChapterStats } from '../types/contact';
import { updateContactRow, clearContactRow } from '../services/googleSheets';
import CardStack from '../components/CardStack';
import PriorityZones from '../components/PriorityZones';
import TravelScene from '../components/TravelScene';
import LevelSummaryScreen from '../components/LevelSummaryScreen';
import JourneyMap from '../components/JourneyMap';
import ChapterIntroBadge from '../components/ChapterIntroBadge';
import Header from '../components/Header';
import { JOURNEY } from '../data/journeyRoute';
import { CHAPTERS } from '../config/chapters';
import { PRIORITY_LABELS, SHEET_STATUS } from '../config/labels';
import { SWIPE_TEXT } from '../config/textSwipe';

interface Props {
  onFinish: () => void;
  onBack: () => void;
}

interface LastSwipe {
  contact: Contact;
  direction: 'right' | 'left';
  rowIndex: number;
  priority?: Priority;
}

type ChapterPhase = 'swiping' | 'summary' | 'map';

const MAX_HISTORY = 10;

export default function SwipePage({ onFinish, onBack }: Props) {
  const { user } = useAuth();
  const { session, spreadsheetId, swipeRight, swipeLeft, undoSwipe, setSyncState, chapterSizes } = useSession();

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const cardAreaRef = useRef<HTMLDivElement>(null);

  // Capture touch start Y for positioning priority zones near the finger
  useEffect(() => {
    const el = cardAreaRef.current;
    if (!el) return;
    const handler = (e: PointerEvent) => setDragStartY(e.clientY);
    el.addEventListener('pointerdown', handler);
    return () => el.removeEventListener('pointerdown', handler);
  }, []);

  // Reset dragStartY when drag ends (card snaps back to x=0)
  useMotionValueEvent(dragX, 'change', (x) => {
    if (x === 0) setDragStartY(null);
  });

  // Active chapter is managed locally so we control when it advances
  const [activeChapter, setActiveChapter] = useState(() => {
    if (!session) return 0;
    const processed = session.selected.length + session.dismissed.length;
    let cumulative = 0;
    for (let i = 0; i < chapterSizes.length; i++) {
      cumulative += chapterSizes[i];
      if (processed < cumulative) return i;
    }
    return chapterSizes.length - 1;
  });

  const [chapterPhase, setChapterPhase] = useState<ChapterPhase>('swiping');
  const [remaining, setRemaining] = useState<Contact[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<LastSwipe[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-chapter stats tracking
  const chapterStartTimeRef = useRef<number>(Date.now());
  const chapterStatsRef = useRef<{ kept: number; skipped: number; priorities: Record<Priority, number> }>({
    kept: 0, skipped: 0, priorities: { high: 0, medium: 0, low: 0 },
  });
  const [completedStats, setCompletedStats] = useState<ChapterStats | null>(null);

  // Mid-chapter milestone tracking
  const milestoneShownRef = useRef(false);

  // Priority picker on keep button
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const pickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLastChapter = activeChapter >= chapterSizes.length - 1;

  // Compute contacts for the active chapter
  const allContacts = session?.contacts ?? [];
  const allSwiped = useMemo(() => {
    if (!session) return new Set<string>();
    return new Set([
      ...session.selected.map((c) => c.id),
      ...session.dismissed,
    ]);
  }, [session]);

  // Load chapter contacts
  useEffect(() => {
    if (!session || chapterSizes.length === 0) return;
    const processed = session.selected.length + session.dismissed.length;
    const chapterSize = chapterSizes[activeChapter] ?? 0;
    const processedBefore = chapterSizes.slice(0, activeChapter).reduce((a, b) => a + b, 0);
    const chapterProcessed = Math.max(0, processed - processedBefore);
    const contactsNeeded = Math.max(0, chapterSize - chapterProcessed);

    // Get unswiped contacts and take only what this chapter needs
    const unswiped = allContacts.filter((c) => !allSwiped.has(c.id));
    setRemaining(unswiped.slice(0, contactsNeeded));

    // Reset chapter-local state
    chapterStartTimeRef.current = Date.now();
    chapterStatsRef.current = { kept: 0, skipped: 0, priorities: { high: 0, medium: 0, low: 0 } };
    milestoneShownRef.current = false;
    setSwipeHistory([]);
  }, [activeChapter, chapterSizes.length]); // Only re-run when chapter changes, not on every swipe

  useEffect(() => {
    return () => {
      if (showDoneTimerRef.current !== null) clearTimeout(showDoneTimerRef.current);
      if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
      if (pickerTimerRef.current !== null) clearTimeout(pickerTimerRef.current);
    };
  }, []);

  const total = session?.contacts.length ?? 0;
  const swiped = (session?.selected.length ?? 0) + (session?.dismissed.length ?? 0);

  // Chapter-local progress for the travel scene
  const chapterTotal = chapterSizes[activeChapter] ?? total;
  const processedBefore = chapterSizes.slice(0, activeChapter).reduce((a, b) => a + b, 0);
  const chapterSwiped = Math.max(0, Math.min(swiped - processedBefore, chapterTotal));
  const fromCity = JOURNEY[activeChapter]?.name ?? JOURNEY[0].name;
  const cityName = JOURNEY[activeChapter + 1]?.name ?? JOURNEY[JOURNEY.length - 1].name;
  const scenePct = chapterTotal === 0 ? 0 : Math.round((chapterSwiped / chapterTotal) * 100);
  const difficulty = CHAPTERS[activeChapter]?.difficulty ?? 'easy';

  const getRowIndex = useCallback(
    (contact: Contact) => contact.sheetRow ?? ((session?.contacts.findIndex((c) => c.id === contact.id) ?? 0) + 1),
    [session]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // Check for mid-chapter milestone
  const checkMilestone = useCallback(() => {
    if (milestoneShownRef.current) return;
    const done = chapterStatsRef.current.kept + chapterStatsRef.current.skipped;
    if (chapterTotal > 4 && done === Math.floor(chapterTotal / 2)) {
      milestoneShownRef.current = true;
      showToast(SWIPE_TEXT.toasts.halfChapter);
    }
  }, [chapterTotal, showToast]);

  const handleChapterComplete = useCallback(() => {
    const elapsed = Math.round((Date.now() - chapterStartTimeRef.current) / 1000);
    const s = chapterStatsRef.current;
    setCompletedStats({
      kept: s.kept,
      skipped: s.skipped,
      priorityBreakdown: { ...s.priorities },
      secondsElapsed: elapsed,
    });
    setChapterPhase('summary');
  }, []);

  const handleSwipeRight = useCallback((contact: Contact, priority: Priority) => {
    const rowIndex = getRowIndex(contact);
    swipeRight(contact, priority);
    chapterStatsRef.current.kept++;
    chapterStatsRef.current.priorities[priority]++;
    setSwipeHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { contact, direction: 'right', rowIndex, priority }]);
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        if (showDoneTimerRef.current !== null) clearTimeout(showDoneTimerRef.current);
        showDoneTimerRef.current = setTimeout(handleChapterComplete, 400);
      }
      return next;
    });
    checkMilestone();
    if (user && spreadsheetId) {
      setSyncState('syncing');
      updateContactRow(user.accessToken, spreadsheetId, rowIndex, SHEET_STATUS.approved, priority)
        .then(() => setSyncState('idle'))
        .catch((e) => setSyncState('error', (e as Error).message));
    }
  }, [swipeRight, getRowIndex, user, spreadsheetId, setSyncState, handleChapterComplete, checkMilestone]);

  const handleSwipeLeft = useCallback((contact: Contact) => {
    const rowIndex = getRowIndex(contact);
    swipeLeft(contact);
    chapterStatsRef.current.skipped++;
    setSwipeHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { contact, direction: 'left', rowIndex }]);
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        if (showDoneTimerRef.current !== null) clearTimeout(showDoneTimerRef.current);
        showDoneTimerRef.current = setTimeout(handleChapterComplete, 400);
      }
      return next;
    });
    checkMilestone();
    if (user && spreadsheetId) {
      setSyncState('syncing');
      updateContactRow(user.accessToken, spreadsheetId, rowIndex, SHEET_STATUS.rejected)
        .then(() => setSyncState('idle'))
        .catch((e) => setSyncState('error', (e as Error).message));
    }
  }, [swipeLeft, getRowIndex, user, spreadsheetId, setSyncState, handleChapterComplete, checkMilestone]);

  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0) {
      showToast(SWIPE_TEXT.toasts.undoLimit);
      return;
    }
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));
    undoSwipe(last.contact, last.direction);

    // Undo chapter stats
    if (last.direction === 'right') {
      chapterStatsRef.current.kept = Math.max(0, chapterStatsRef.current.kept - 1);
      if (last.priority) {
        chapterStatsRef.current.priorities[last.priority] = Math.max(0, chapterStatsRef.current.priorities[last.priority] - 1);
      }
    } else {
      chapterStatsRef.current.skipped = Math.max(0, chapterStatsRef.current.skipped - 1);
    }

    setRemaining((prev) => [last.contact, ...prev]);
    if (user && spreadsheetId) {
      setSyncState('syncing');
      clearContactRow(user.accessToken, spreadsheetId, last.rowIndex)
        .then(() => setSyncState('idle'))
        .catch((e) => setSyncState('error', (e as Error).message));
    }
  }, [swipeHistory, undoSwipe, user, spreadsheetId, setSyncState, showToast]);

  // Summary → Map (or Results for last chapter)
  const handleSummaryNext = useCallback(() => {
    if (isLastChapter) {
      onFinish();
    } else {
      setChapterPhase('map');
    }
  }, [isLastChapter, onFinish]);

  // Map → Next chapter swiping
  const handleMapContinue = useCallback(() => {
    setActiveChapter((prev) => prev + 1);
    setChapterPhase('swiping');
    setCompletedStats(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (chapterPhase !== 'swiping') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { handleUndo(); return; }
      if (remaining.length === 0) return;
      const top = remaining[0];
      if (e.key === 'ArrowRight') handleSwipeRight(top, 'medium');
      else if (e.key === 'ArrowLeft') handleSwipeLeft(top);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [remaining, handleSwipeRight, handleSwipeLeft, handleUndo, chapterPhase]);

  const canAct = remaining.length > 0 && chapterPhase === 'swiping';
  const canUndo = swipeHistory.length > 0;

  const openPriorityPicker = useCallback(() => {
    if (!canAct) return;
    setShowPriorityPicker(true);
    if (pickerTimerRef.current !== null) clearTimeout(pickerTimerRef.current);
    pickerTimerRef.current = setTimeout(() => {
      // Auto-dismiss after 5s, default to medium
      setShowPriorityPicker((prev) => {
        if (prev && remaining.length > 0) handleSwipeRight(remaining[0], 'medium');
        return false;
      });
    }, 5000);
  }, [canAct, remaining, handleSwipeRight]);

  const pickPriority = useCallback((priority: Priority) => {
    if (pickerTimerRef.current !== null) clearTimeout(pickerTimerRef.current);
    setShowPriorityPicker(false);
    if (remaining.length > 0) handleSwipeRight(remaining[0], priority);
  }, [remaining, handleSwipeRight]);

  const dismissPicker = useCallback(() => {
    if (pickerTimerRef.current !== null) clearTimeout(pickerTimerRef.current);
    setShowPriorityPicker(false);
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 40%, #FFB3D1 70%, #FFF0F6 100%)' }}>
      <Header />

      {/* Travel scene — pixel art parallax progress indicator */}
      {chapterPhase === 'swiping' && (
        <div className="shrink-0 px-2">
          <TravelScene
            fromCity={fromCity}
            toCity={cityName}
            pct={scenePct}
            current={chapterSwiped}
            total={chapterTotal}
            difficulty={difficulty}
          />
        </div>
      )}

      {/* Difficulty badge intro */}
      {chapterPhase === 'swiping' && (
        <ChapterIntroBadge
          key={activeChapter}
          chapterIndex={activeChapter}
          difficulty={difficulty}
        />
      )}

      {chapterPhase === 'swiping' && (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative px-4">
          <div ref={cardAreaRef} className="relative w-[340px] max-w-[90vw]">
            <AnimatePresence>
              {remaining.length > 0 ? (
                <CardStack
                  key="stack"
                  contacts={remaining}
                  dragX={dragX}
                  dragY={dragY}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Priority zones — full page overlay, above everything */}
      {chapterPhase === 'swiping' && (
        <PriorityZones dragX={dragX} dragY={dragY} dragStartY={dragStartY} />
      )}

      {/* Level summary overlay */}
      <AnimatePresence>
        {chapterPhase === 'summary' && completedStats && (
          <LevelSummaryScreen
            chapterIndex={activeChapter}
            arrivedCity={cityName}
            flavorText={JOURNEY[activeChapter + 1]?.flavor ?? ''}
            stats={completedStats}
            difficulty={difficulty}
            onNext={handleSummaryNext}
            isLastChapter={isLastChapter}
          />
        )}
      </AnimatePresence>

      {/* Journey map overlay */}
      <AnimatePresence>
        {chapterPhase === 'map' && (
          <JourneyMap
            completedChapter={activeChapter}
            cities={JOURNEY}
            onContinue={handleMapContinue}
            isLastChapter={isLastChapter}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white text-sm px-4 py-2 rounded-xl shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {chapterPhase === 'swiping' && (
        <div className="shrink-0 px-4 pb-2 flex flex-col items-center gap-3">
          <div className="relative w-full max-w-[340px]" style={{ zIndex: 55 }}>
            {/* Priority picker — floats above buttons and card */}
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
                  {/* Countdown bar — shrinks over 5s */}
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
            {/* Skip — left side matches left-swipe */}
            <button
              onClick={() => { dismissPicker(); canAct && handleSwipeLeft(remaining[0]); }}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl bg-red-500/30 border-2 border-red-400 text-red-100 font-bold text-lg flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-red-500/50 active:enabled:scale-95"
            >
              <span className="text-xl leading-none">✕</span>
              <span>{SWIPE_TEXT.buttons.skip}</span>
            </button>

            {/* Undo — center */}
            <button
              onClick={() => { dismissPicker(); handleUndo(); }}
              disabled={!canUndo}
              className="flex-none w-16 h-14 rounded-2xl glass border border-pink-200 flex items-center justify-center text-[#FF2D78] text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-pink-50 active:enabled:scale-95"
              title={SWIPE_TEXT.buttons.undoTitle}
            >
              {SWIPE_TEXT.buttons.undo}
            </button>

            {/* Keep — right side matches right-swipe, opens priority picker */}
            <button
              onClick={openPriorityPicker}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl gradient-pink text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:opacity-90 active:enabled:scale-95"
            >
              <span>{SWIPE_TEXT.buttons.keep}</span>
              <span className="text-xl leading-none">✓</span>
            </button>
          </div>
          </div>

          {/* Back link */}
          <button
            onClick={onBack}
            className="text-white/70 text-xs hover:text-white transition-colors pb-safe-bottom pb-2"
          >
            {SWIPE_TEXT.backLink}
          </button>
        </div>
      )}
    </div>
  );
}
