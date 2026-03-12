import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact, Priority } from '../types/contact';
import { updateContactRow, clearContactRow } from '../services/googleSheets';
import CardStack from '../components/CardStack';
import PriorityZones from '../components/PriorityZones';
import ProgressBar from '../components/ProgressBar';
import Header from '../components/Header';

interface Props {
  onFinish: () => void;
  onBack: () => void;
}

interface LastSwipe {
  contact: Contact;
  direction: 'right' | 'left';
  rowIndex: number; // 1-based, as expected by updateContactRow / clearContactRow
}

export default function SwipePage({ onFinish, onBack }: Props) {
  const { user } = useAuth();
  const { session, spreadsheetId, swipeRight, swipeLeft, undoSwipe } = useSession();

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const [remaining, setRemaining] = useState<Contact[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(null);

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

  // Row index (1-based, matching updateContactRow convention) for a given contact
  const getRowIndex = useCallback(
    (contact: Contact) => (session?.contacts.findIndex((c) => c.id === contact.id) ?? 0) + 1,
    [session]
  );

  const handleSwipeRight = useCallback((contact: Contact, priority: Priority) => {
    const rowIndex = getRowIndex(contact);
    swipeRight(contact, priority);
    setLastSwipe({ contact, direction: 'right', rowIndex });
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) setTimeout(() => setShowDone(true), 400);
      return next;
    });
    if (user && spreadsheetId) {
      updateContactRow(user.accessToken, spreadsheetId, rowIndex, 'אושר', priority);
    }
  }, [swipeRight, getRowIndex, user, spreadsheetId]);

  const handleSwipeLeft = useCallback((contact: Contact) => {
    const rowIndex = getRowIndex(contact);
    swipeLeft(contact);
    setLastSwipe({ contact, direction: 'left', rowIndex });
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) setTimeout(() => setShowDone(true), 400);
      return next;
    });
    if (user && spreadsheetId) {
      updateContactRow(user.accessToken, spreadsheetId, rowIndex, 'נדחה');
    }
  }, [swipeLeft, getRowIndex, user, spreadsheetId]);

  const handleUndo = useCallback(() => {
    if (!lastSwipe) return;
    undoSwipe(lastSwipe.contact, lastSwipe.direction);
    setRemaining((prev) => [lastSwipe.contact, ...prev]);
    setShowDone(false);
    if (user && spreadsheetId) {
      clearContactRow(user.accessToken, spreadsheetId, lastSwipe.rowIndex);
    }
    setLastSwipe(null);
  }, [lastSwipe, undoSwipe, user, spreadsheetId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        handleUndo();
        return;
      }
      if (remaining.length === 0) return;
      const top = remaining[0];
      if (e.key === 'ArrowRight') handleSwipeRight(top, 'medium');
      else if (e.key === 'ArrowLeft') handleSwipeLeft(top);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [remaining, handleSwipeRight, handleSwipeLeft, handleUndo]);

  useEffect(() => {
    if (showDone) {
      const t = setTimeout(onFinish, 2000);
      return () => clearTimeout(t);
    }
  }, [showDone, onFinish]);

  const progressBar = <ProgressBar current={swiped} total={total} />;

  const canAct = remaining.length > 0 && !showDone;

  return (
    <div className="min-h-screen flex flex-col">
      <Header showProgress={progressBar} />

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="relative w-[340px] max-w-[90vw]">
          <PriorityZones dragX={dragX} dragY={dragY} />

          <AnimatePresence mode="wait">
            {showDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[520px] text-center"
              >
                <motion.div
                  animate={{ scale: [0.8, 1.15, 1] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-24 h-24 rounded-full gradient-pink flex items-center justify-center mb-6 shadow-xl"
                >
                  <span className="text-white font-black text-5xl leading-none">✓</span>
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2">כל הכבוד!</h2>
                <p className="text-white/80 text-lg">סיימת למיין את כל אנשי הקשר</p>
                <p className="text-white/60 text-sm mt-2">עובר לתוצאות...</p>
              </motion.div>
            ) : remaining.length > 0 ? (
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

      {/* Action buttons */}
      {!showDone && (
        <div className="px-4 pb-2 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 w-full max-w-[340px]">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={!lastSwipe}
              className="flex-none w-14 h-14 rounded-2xl glass border border-white/20 flex items-center justify-center text-white/80 text-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-white/10 active:enabled:scale-95"
              title="בטל (↑)"
            >
              ↩
            </button>

            {/* Skip */}
            <button
              onClick={() => canAct && handleSwipeLeft(remaining[0])}
              disabled={!canAct}
              className="flex-1 h-14 rounded-2xl border-2 border-red-400/60 text-red-300 font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-red-500/10 active:enabled:scale-95"
            >
              <span className="text-xl leading-none">✕</span>
              <span>דלג</span>
            </button>

            {/* Keep */}
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
            className="text-white/40 text-xs hover:text-white/70 transition-colors pb-safe-bottom pb-2"
          >
            ← חזור לייבוא
          </button>
        </div>
      )}
    </div>
  );
}
