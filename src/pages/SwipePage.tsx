import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact, Priority } from '../types/contact';
import { updateContactRow, clearContactRow } from '../services/googleSheets';
import CardStack from '../components/CardStack';
import PriorityZones from '../components/PriorityZones';
import TravelScene from '../components/TravelScene';
import LevelSummaryScreen from '../components/LevelSummaryScreen';
import Header from '../components/Header';
import { JOURNEY } from '../data/journeyRoute';

interface Props {
  onFinish: () => void;
  onBack: () => void;
}

interface LastSwipe {
  contact: Contact;
  direction: 'right' | 'left';
  rowIndex: number;
}

const MAX_HISTORY = 10;

export default function SwipePage({ onFinish, onBack }: Props) {
  const { user } = useAuth();
  const { session, spreadsheetId, swipeRight, swipeLeft, undoSwipe, setSyncState, currentChapter, chapterSizes } = useSession();

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const [remaining, setRemaining] = useState<Contact[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState<LastSwipe[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the 400ms "all done" delay so it can be cancelled if the component
  // unmounts before the timeout fires (e.g. the user navigates away mid-animation).
  const showDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedAtDone, setElapsedAtDone] = useState(0);

  useEffect(() => {
    return () => {
      if (showDoneTimerRef.current !== null) clearTimeout(showDoneTimerRef.current);
      if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (session) {
      const swiped = new Set([
        ...session.selected.map((c) => c.id),
        ...session.dismissed,
      ]);
      const pending = session.contacts.filter((c) => !swiped.has(c.id));
      setRemaining(pending);
    }
  }, []); // init once

  const total = session?.contacts.length ?? 0;
  const swiped = total - remaining.length;

  // Chapter-local progress for the travel scene
  const chapterTotal = chapterSizes[currentChapter] ?? total;
  const processedBefore = chapterSizes.slice(0, currentChapter).reduce((a, b) => a + b, 0);
  const chapterSwiped = Math.max(0, Math.min(swiped - processedBefore, chapterTotal));
  const fromCity = JOURNEY[currentChapter]?.name ?? JOURNEY[0].name;
  const cityName = JOURNEY[currentChapter + 1]?.name ?? JOURNEY[JOURNEY.length - 1].name;
  const scenePct = chapterTotal === 0 ? 0 : Math.round((chapterSwiped / chapterTotal) * 100);

  const getRowIndex = useCallback(
    // Use sheetRow if present (resume from sheet — the only correct row index).
    // Fall back to findIndex+1 for fresh imports where contacts are written in-order.
    (contact: Contact) => contact.sheetRow ?? ((session?.contacts.findIndex((c) => c.id === contact.id) ?? 0) + 1),
    [session]
  );

  const handleSwipeRight = useCallback((contact: Contact, priority: Priority) => {
    const rowIndex = getRowIndex(contact);
    swipeRight(contact, priority);
    setSwipeHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { contact, direction: 'right', rowIndex }]);
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        if (showDoneTimerRef.current !== null) clearTimeout(showDoneTimerRef.current);
        showDoneTimerRef.current = setTimeout(() => {
          setElapsedAtDone(Math.round((Date.now() - startTimeRef.current) / 1000));
          setShowDone(true);
        }, 400);
      }
      return next;
    });
    if (user && spreadsheetId) {
      setSyncState('syncing');
      updateContactRow(user.accessToken, spreadsheetId, rowIndex, 'אושר', priority)
        .then(() => setSyncState('idle'))
        .catch((e) => setSyncState('error', (e as Error).message));
    }
  }, [swipeRight, getRowIndex, user, spreadsheetId, setSyncState]);

  const handleSwipeLeft = useCallback((contact: Contact) => {
    const rowIndex = getRowIndex(contact);
    swipeLeft(contact);
    setSwipeHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { contact, direction: 'left', rowIndex }]);
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        if (showDoneTimerRef.current !== null) clearTimeout(showDoneTimerRef.current);
        showDoneTimerRef.current = setTimeout(() => {
          setElapsedAtDone(Math.round((Date.now() - startTimeRef.current) / 1000));
          setShowDone(true);
        }, 400);
      }
      return next;
    });
    if (user && spreadsheetId) {
      setSyncState('syncing');
      updateContactRow(user.accessToken, spreadsheetId, rowIndex, 'נדחה')
        .then(() => setSyncState('idle'))
        .catch((e) => setSyncState('error', (e as Error).message));
    }
  }, [swipeLeft, getRowIndex, user, spreadsheetId, setSyncState]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0) {
      showToast('ניתן לחזור עד 10 כרטיסים בלבד');
      return;
    }
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));
    undoSwipe(last.contact, last.direction);
    setRemaining((prev) => [last.contact, ...prev]);
    setShowDone(false);
    if (user && spreadsheetId) {
      setSyncState('syncing');
      clearContactRow(user.accessToken, spreadsheetId, last.rowIndex)
        .then(() => setSyncState('idle'))
        .catch((e) => setSyncState('error', (e as Error).message));
    }
  }, [swipeHistory, undoSwipe, user, spreadsheetId, setSyncState, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { handleUndo(); return; }
      if (remaining.length === 0) return;
      const top = remaining[0];
      if (e.key === 'ArrowRight') handleSwipeRight(top, 'medium');
      else if (e.key === 'ArrowLeft') handleSwipeLeft(top);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [remaining, handleSwipeRight, handleSwipeLeft, handleUndo]);

  const canAct = remaining.length > 0 && !showDone;
  const canUndo = swipeHistory.length > 0;

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 40%, #FFB3D1 70%, #FFF0F6 100%)' }}>
      <Header />

      {/* Travel scene — pixel art parallax progress indicator */}
      <div className="shrink-0 px-2">
        <TravelScene fromCity={fromCity} toCity={cityName} pct={scenePct} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="relative w-[340px] max-w-[90vw]">
          <PriorityZones dragX={dragX} dragY={dragY} />

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

      {/* Level summary overlay */}
      <AnimatePresence>
        {showDone && (
          <LevelSummaryScreen
            chapterIndex={currentChapter}
            arrivedCity={cityName}
            flavorText={JOURNEY[currentChapter + 1]?.flavor ?? ''}
            contactsSorted={chapterSwiped}
            secondsElapsed={elapsedAtDone}
            onNext={onFinish}
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
      {!showDone && (
        <div className="shrink-0 px-4 pb-2 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 w-full max-w-[340px]" dir="ltr">
            {/* Skip — left side matches left-swipe */}
            <button
              onClick={() => canAct && handleSwipeLeft(remaining[0])}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl bg-red-500/30 border-2 border-red-400 text-red-100 font-bold text-lg flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-red-500/50 active:enabled:scale-95"
            >
              <span className="text-xl leading-none">✕</span>
              <span>דלג</span>
            </button>

            {/* Undo — center */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex-none w-16 h-14 rounded-2xl glass border border-pink-200 flex items-center justify-center text-[#FF2D78] text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-pink-50 active:enabled:scale-95"
              title="חזור (↑)"
            >
              חזור
            </button>

            {/* Keep — right side matches right-swipe */}
            <button
              onClick={() => canAct && handleSwipeRight(remaining[0], 'medium')}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl gradient-pink text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:opacity-90 active:enabled:scale-95"
            >
              <span>שמור</span>
              <span className="text-xl leading-none">✓</span>
            </button>
          </div>

          {/* Back link */}
          <button
            onClick={onBack}
            className="text-white/70 text-xs hover:text-white transition-colors pb-safe-bottom pb-2"
          >
            חזור לייבוא
          </button>
        </div>
      )}
    </div>
  );
}
