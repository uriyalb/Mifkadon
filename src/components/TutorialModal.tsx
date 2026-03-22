import { motion, AnimatePresence } from 'framer-motion';
import { TUTORIAL_TEXT, MECHANIC_LABELS } from '../config/tutorialConfig';

interface Props {
  open: boolean;
  onStartWalkthrough: () => void;
  onSkip: () => void;
}

export default function TutorialModal({ open, onStartWalkthrough, onSkip }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            dir="rtl"
          >
            {/* Header banner */}
            <div
              className="px-6 pt-8 pb-6 text-center"
              style={{ background: 'linear-gradient(135deg, #FF2D78 0%, #FF6BA8 100%)' }}
            >
              <h2 className="text-2xl font-black text-white leading-tight">
                {TUTORIAL_TEXT.title}
              </h2>
            </div>

            {/* Description */}
            <div className="px-6 pt-5 pb-2 space-y-2">
              {TUTORIAL_TEXT.description.map((line, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>

            {/* Sorting mechanic diagram */}
            <div className="px-6 py-4">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3" dir="ltr">
                {/* Skip side */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">←</div>
                  <div className="text-xs font-bold text-red-500">{MECHANIC_LABELS.skipLabel}</div>
                </div>

                {/* Card icon */}
                <div className="w-14 h-20 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center">
                  <span className="text-lg">📇</span>
                </div>

                {/* Keep side with priorities */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">→</div>
                  <div className="text-xs font-bold text-green-600 mb-1">{MECHANIC_LABELS.keepLabel}</div>
                  <div className="space-y-0.5 text-[10px]">
                    <div className="text-green-600 font-semibold">{MECHANIC_LABELS.highLabel}</div>
                    <div className="text-lime-600 font-semibold">{MECHANIC_LABELS.mediumLabel}</div>
                    <div className="text-yellow-600 font-semibold">{MECHANIC_LABELS.lowLabel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="px-6 pb-6 space-y-3">
              <button
                onClick={onStartWalkthrough}
                className="w-full h-14 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #FF2D78, #FF6BA8)' }}
              >
                {TUTORIAL_TEXT.startWalkthrough}
              </button>
              <button
                onClick={onSkip}
                className="w-full h-12 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-base hover:bg-gray-200 active:scale-95 transition-all"
              >
                {TUTORIAL_TEXT.skipToGame}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
