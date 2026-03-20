// ── Shared UI labels ────────────────────────────────────────────────────────
//
// Single source of truth for labels that appear in multiple components:
// difficulty levels, priority classifications, contact source names, etc.

import type { Difficulty } from './chapters';
import type { Priority } from '../types/contact';

export const DIFFICULTY_LABELS: Record<Difficulty, { text: string; color: string; bg: string }> = {
  easy:   { text: 'קל',     color: '#22C55E', bg: 'linear-gradient(135deg, #22C55E, #4ADE80)' },
  medium: { text: 'בינוני', color: '#EAB308', bg: 'linear-gradient(135deg, #EAB308, #FDE047)' },
  hard:   { text: 'קשה',    color: '#EF4444', bg: 'linear-gradient(135deg, #EF4444, #F87171)' },
};

export const PRIORITY_LABELS: Record<Priority, { text: string; zoneName: string; bg: string; hint: string }> = {
  high:   { text: 'גבוהה',  zoneName: 'טופס בטוח',  bg: 'linear-gradient(135deg, #22C55E, #4ADE80)', hint: '↑' },
  medium: { text: 'בינונית', zoneName: 'סיכוי טוב',  bg: 'linear-gradient(135deg, #84CC16, #BEF264)', hint: '→' },
  low:    { text: 'נמוכה',  zoneName: 'דרושה עבודה', bg: 'linear-gradient(135deg, #EAB308, #FDE047)', hint: '↓' },
};

export const SOURCE_LABELS: Record<string, string> = {
  google: 'Google Contacts',
  facebook: 'Facebook',
  instagram: 'Instagram',
  manual: 'ידני',
  phone: 'אנשי קשר',
};

export const SHEET_STATUS = {
  approved: 'אושר',
  rejected: 'נדחה',
} as const;

export const SPEED_BONUS = {
  flash: 'בזק!',
  fast: 'מהיר!',
} as const;
