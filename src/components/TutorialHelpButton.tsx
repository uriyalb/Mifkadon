import { motion } from 'framer-motion';

interface Props {
  onClick: () => void;
}

export default function TutorialHelpButton({ onClick }: Props) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold text-sm flex items-center justify-center shadow-md hover:bg-white/30 active:scale-90 transition-all"
      title="הדרכה"
    >
      ?
    </motion.button>
  );
}
