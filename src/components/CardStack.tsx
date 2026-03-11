
import { AnimatePresence } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import type { Contact, Priority } from '../types/contact';
import SwipeCard from './SwipeCard';

interface Props {
  contacts: Contact[];
  dragX: MotionValue<number>;
  dragY: MotionValue<number>;
  onSwipeRight: (contact: Contact, priority: Priority) => void;
  onSwipeLeft: (contact: Contact) => void;
}

export default function CardStack({ contacts, dragX, dragY, onSwipeRight, onSwipeLeft }: Props) {
  const visibleCards = contacts.slice(0, 3);

  return (
    <div className="relative w-[340px] max-w-[90vw] h-[520px]">
      <AnimatePresence>
        {visibleCards.map((contact, idx) => (
          <SwipeCard
            key={contact.id}
            contact={contact}
            dragX={dragX}
            dragY={dragY}
            stackIndex={idx}
            isTop={idx === 0}
            onSwipeRight={(priority) => onSwipeRight(contact, priority)}
            onSwipeLeft={() => onSwipeLeft(contact)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
