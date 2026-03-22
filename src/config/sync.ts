// ── Sync throttle configuration ─────────────────────────────────────────────
//
// Controls how often the app pushes updates to Google Sheets to avoid 429 errors.
// Both the user sheet (per-contact row updates) and the admin tracking sheet
// respect these thresholds.

export const SYNC_CONFIG = {
  /** Flush the pending queue after this many "keep" (approve) actions */
  keepFlushThreshold: 2,

  /** Flush the pending queue after this many consecutive "skip" (reject) actions */
  skipFlushThreshold: 10,

  /** Minimum milliseconds between any two flush cycles (safety net) */
  minFlushIntervalMs: 3000,
} as const;
