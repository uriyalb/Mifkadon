// ── Tutorial & Walkthrough configuration ────────────────────────────────────
//
// Single source of truth for the tutorial modal text, walkthrough dummy cards,
// per-card hints, and completion message. All Hebrew (RTL).

import type { Contact, Priority } from '../types/contact';

// ── Modal text ──────────────────────────────────────────────────────────────

export const TUTORIAL_TEXT = {
  title: 'ברוכים הבאים למפקדון!',
  description: [
    'במפקדון תמיינו את אנשי הקשר שלכם לפי פוטנציאל התמיכה שלהם.',
    'גררו כרטיס ימינה כדי לשמור, או שמאלה כדי לדלג.',
    'בגרירה ימינה, בחרו עדיפות: גבוהה (למעלה), בינונית (מרכז), או נמוכה (למטה).',
  ],
  startWalkthrough: 'התחל הדרכה',
  skipToGame: 'דלג למשחק',
} as const;

// ── Sorting mechanic diagram labels ─────────────────────────────────────────

export const MECHANIC_LABELS = {
  keepLabel: 'שמור',
  skipLabel: 'דלג',
  highLabel: 'גבוהה ↑',
  mediumLabel: 'בינונית →',
  lowLabel: 'נמוכה ↓',
} as const;

// ── Walkthrough cards ───────────────────────────────────────────────────────

export type WalkthroughAction =
  | { type: 'keep'; priority: Priority }
  | { type: 'skip' };

export interface WalkthroughCard {
  contact: Contact;
  correctAction: WalkthroughAction;
  hint: string;
}

export const WALKTHROUGH_CARDS: WalkthroughCard[] = [
  {
    contact: { id: 'tut-1', name: 'רון תומך', phone: '050-1111111', source: 'google' },
    correctAction: { type: 'keep', priority: 'high' },
    hint: 'גררו ימינה ולמעלה — עדיפות גבוהה',
  },
  {
    contact: { id: 'tut-2', name: 'דנה מעורבת', phone: '052-2222222', source: 'facebook' },
    correctAction: { type: 'keep', priority: 'medium' },
    hint: 'גררו ימינה — עדיפות בינונית',
  },
  {
    contact: { id: 'tut-3', name: 'איש זר', phone: '054-3333333', source: 'manual' },
    correctAction: { type: 'skip' },
    hint: 'גררו שמאלה כדי לדלג',
  },
  {
    contact: { id: 'tut-4', name: 'קשר רחוק', phone: '053-4444444', source: 'instagram' },
    correctAction: { type: 'keep', priority: 'low' },
    hint: 'גררו ימינה ולמטה — עדיפות נמוכה',
  },
  {
    contact: { id: 'tut-5', name: 'לא רלוונטי', phone: '058-5555555', source: 'google' },
    correctAction: { type: 'skip' },
    hint: 'גררו שמאלה כדי לדלג',
  },
];

// ── Walkthrough completion ──────────────────────────────────────────────────

export const WALKTHROUGH_COMPLETE = {
  title: 'כל הכבוד!',
  subtitle: 'סיימתם את ההדרכה בהצלחה',
  continueLabel: 'בואו נתחיל!',
} as const;

// ── Error feedback ──────────────────────────────────────────────────────────

export const WALKTHROUGH_FEEDBACK = {
  wrongAction: 'לא נכון, נסו שוב!',
  fingerIdleDelay: 3000, // ms before finger reappears after idle
} as const;
