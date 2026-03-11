import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import type { Contact, Priority } from '../types/contact';
import { updateContactRow } from '../services/googleSheets';
import CardStack from '../components/CardStack';
import PriorityZones from '../components/PriorityZones';
import ProgressBar from '../components/ProgressBar';
import Header from '../components/Header';

interface Props {
  onFinish: () => void;
  onBack: () => void;
}

export default function SwipePage({ onFinish, onBack }: Props) {
  const { user } = useAuth();
  const { session, spreadsheetId, swipeRight, swipeLeft } = useSession();

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const [remaining, setRemaining] = useState<Contact[]>([]);
  const [currentRowOffset, setCurrentRowOffset] = useState(2); // row 2 = first contact in sheet
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    if (session) {
      // Show contacts that haven't been swiped yet
      const swiped = new Set([
        ...session.selected.map((c) => c.id),
        ...session.dismissed,
      ]);
      const pending = session.contacts.filter((c) => !swiped.has(c.id));
      setRemaining(pending);
      setCurrentRowOffset(2 + session.selected.length + session.dismissed.length);
    }
  }, []); // init once

  const total = session?.contacts.length ?? 0;
  const swiped = total - remaining.length;

  const handleSwipeRight = useCallback((contact: Contact, priority: Priority) => {
    swipeRight(contact, priority);
    setRemaining((prev) => prev.slice(1));

    // Update spreadsheet row (fire-and-forget)
    if (user && spreadsheetId) {
      const rowIndex = remaining.findIndex((c) => c.id === contact.id);
      updateContactRow(user.accessToken, spreadsheetId, currentRowOffset + rowIndex, 'אושר', priority);
    }

    // Check if done
    setRemaining((prev) => {
      if (prev.length === 0) {
        setTimeout(() => setShowDone(true), 400);
      }
      return prev;
    });
  }, [swipeRight, user, spreadsheetId, remaining, currentRowOffset]);

  const handleSwipeLeft = useCallback((contact: Contact) => {
    swipeLeft(contact);
    setRemaining((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setTimeout(() => setShowDone(true), 400);
      }
      return next;
    });

    if (user && spreadsheetId) {
      const rowIndex = remaining.findIndex((c) => c.id === contact.id);
      updateContactRow(user.accessToken, spreadsheetId, currentRowOffset + rowIndex, 'נדחה');
    }
  }, [swipeLeft, user, spreadsheetId, remaining, currentRowOffset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (remaining.length === 0) return;
      const top = remaining[0];
      if (e.key === 'ArrowRight') {
        handleSwipeRight(top, 'medium');
      } else if (e.key === 'ArrowLeft') {
        handleSwipeLeft(top);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [remaining, handleSwipeRight, handleSwipeLeft]);

  useEffect(() => {
    if (showDone) {
      const t = setTimeout(onFinish, 2000);
      return () => clearTimeout(t);
    }
  }, [showDone, onFinish]);

  const progressBar = (
    <ProgressBar current={swiped} total={total} />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header showProgress={progressBar} />

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4">
        {/* Priority zones (slide in from right on right swipe) */}
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

      {/* Back button */}
      <div className="px-4 pb-safe-bottom pb-4">
        <button
          onClick={onBack}
          className="text-white/60 text-sm hover:text-white transition-colors"
        >
          ← חזור לייבוא
        </button>
      </div>
    </div>
  );
}
