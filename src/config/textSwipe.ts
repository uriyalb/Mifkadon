// ── Swipe page text ─────────────────────────────────────────────────────────

export const SWIPE_TEXT = {
  buttons: {
    keep: 'שמור',
    skip: 'דלג',
    undo: 'חזור',
    undoTitle: 'חזור (↑)',
  },
  overlays: {
    keep: 'שמור',
    skip: 'דלג',
    registered: 'כבר פקוד',
  },
  toasts: {
    halfChapter: '!חצי מהדרך',
    undoLimit: 'ניתן לחזור עד 10 כרטיסים בלבד',
  },
  chapterProgress: {
    sorted: (done: number, total: number) => `${done}/${total} מוינו`,
    left: (n: number) => `נותרו ${n}`,
    eta: (time: string) => `סיום ${time}`,
  },
  backLink: 'חזור לייבוא',
} as const;
