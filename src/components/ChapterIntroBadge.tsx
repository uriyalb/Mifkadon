import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Difficulty } from '../config/chapters';
import { DIFFICULTY_LABELS } from '../config/labels';
import { JOURNEY_TEXT } from '../config/textJourney';

interface Props {
  chapterIndex: number;
  difficulty: Difficulty;
}

export default function ChapterIntroBadge({ chapterIndex, difficulty }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, [chapterIndex]);

  const cfg = DIFFICULTY_LABELS[difficulty];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-20 left-1/2 z-[55] -translate-x-1/2 px-5 py-2.5 rounded-2xl text-white font-bold text-base shadow-xl pointer-events-none"
          style={{ background: cfg.bg }}
        >
          {JOURNEY_TEXT.chapterIntro(chapterIndex, cfg.text)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
