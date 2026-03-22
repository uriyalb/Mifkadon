import type { Priority } from '../types/contact';

/** Minimum horizontal drag (px) to commit a keep/skip swipe */
export const SWIPE_THRESHOLD = 50;

/** Minimum horizontal drag (px) before priority zones appear */
export const ZONE_REVEAL_THRESHOLD = 30;

/** Vertical threshold for priority zone boundaries — 8% of viewport height */
export function getPriorityThreshold(): number {
  return Math.round(window.innerHeight * 0.08);
}

/** Determine priority from vertical drag offset */
export function getPriority(y: number): Priority {
  const t = getPriorityThreshold();
  if (y < -t) return 'high';
  if (y > t) return 'low';
  return 'medium';
}
