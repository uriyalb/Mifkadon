// ── Chapter / difficulty configuration ─────────────────────────────────────
//
// Single source of truth for how contacts are divided into chapters.
//
// Rules enforced by the system:
// 1. Chapter 1 (index 0) is "easy" — shortest, gives a quick win.
// 2. Chapters 2-3 (indices 1-2) are "medium".
// 3. All remaining chapters are "hard" — progressively longer.
// 4. Users cannot jump forward or backward in difficulty tiers.
// 5. When new contacts are added mid-session, completed chapters keep their
//    sizes and new contacts are distributed only across remaining chapters.
//
// To modify: edit the CHAPTERS array below. The system adapts automatically.
// IMPORTANT: CHAPTERS.length must equal JOURNEY.length - 1 (see journeyRoute.ts).

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ChapterConfig {
  difficulty: Difficulty;
  /** Relative size weight — higher = more contacts in this chapter. */
  weight: number;
  /** Minimum contacts allowed in this chapter. */
  minContacts: number;
}

export const CHAPTERS: ChapterConfig[] = [
  // ── easy (1 chapter) ──
  { difficulty: 'easy',   weight: 1,   minContacts: 3 },
  // ── medium (2 chapters) ──
  { difficulty: 'medium', weight: 1.5, minContacts: 3 },
  { difficulty: 'medium', weight: 2,   minContacts: 3 },
  // ── hard (5 chapters) ──
  { difficulty: 'hard',   weight: 2.5, minContacts: 4 },
  { difficulty: 'hard',   weight: 3,   minContacts: 4 },
  { difficulty: 'hard',   weight: 3.5, minContacts: 4 },
  { difficulty: 'hard',   weight: 4,   minContacts: 4 },
  { difficulty: 'hard',   weight: 4.5, minContacts: 5 },
];

export const NUM_CHAPTERS = CHAPTERS.length;

// ── Core chapter functions ─────────────────────────────────────────────────

/**
 * Distribute `total` contacts proportionally across the given chapter configs.
 * Each chapter gets at least its configured `minContacts`.
 * The last chapter absorbs any rounding remainder so sizes always sum to `total`.
 */
function distributeByWeights(total: number, configs: ChapterConfig[]): number[] {
  const weightSum = configs.reduce((sum, c) => sum + c.weight, 0);
  const sizes = configs.map((c) =>
    Math.max(c.minContacts, Math.round((total * c.weight) / weightSum)),
  );
  const diff = total - sizes.reduce((a, b) => a + b, 0);
  sizes[sizes.length - 1] = Math.max(
    configs[configs.length - 1].minContacts,
    sizes[sizes.length - 1] + diff,
  );
  return sizes;
}

/**
 * Compute chapter sizes for a fresh session (no prior progress).
 */
export function computeChapterSizes(total: number): number[] {
  return distributeByWeights(total, CHAPTERS);
}

/**
 * Return the 0-indexed chapter that corresponds to `processed` swipes.
 * A user enters chapter i once all preceding chapters' contacts are exhausted.
 */
export function computeCurrentChapter(processed: number, sizes: number[]): number {
  let cumulative = 0;
  for (let i = 0; i < sizes.length; i++) {
    cumulative += sizes[i];
    if (processed <= cumulative) return i;
  }
  return sizes.length - 1;
}

/**
 * Redistribute chapters when contacts are added mid-session.
 *
 * Completed chapters (indices 0 .. currentChapter-1) keep their original sizes.
 * The current chapter and all subsequent chapters are recalculated from the
 * remaining contact pool using their original weight ratios.
 *
 * This ensures:
 * - Users never jump backward or forward in difficulty
 * - Completed progress is never lost
 * - New contacts spread proportionally across unfinished chapters
 */
export function redistributeChapters(
  oldSizes: number[],
  currentChapter: number,
  newTotal: number,
): number[] {
  // Lock completed chapters (everything before the current one)
  const lockedSizes = oldSizes.slice(0, currentChapter);
  const lockedTotal = lockedSizes.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, newTotal - lockedTotal);

  // Distribute remaining contacts across current + future chapters
  const remainingConfigs = CHAPTERS.slice(currentChapter);
  const newRemainingSizes = distributeByWeights(remaining, remainingConfigs);

  return [...lockedSizes, ...newRemainingSizes];
}
