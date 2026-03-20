// ── Journey / chapter summary text ──────────────────────────────────────────

export const JOURNEY_TEXT = {
  mapTitle: 'מפת המסע',
  arrivedTitle: (city: string) => `!הגעת ל-${city}`,
  chapterOf: (index: number, total: number) => `פרק ${index + 1} מתוך ${total}`,
  chapterIntro: (index: number, diffText: string) => `פרק ${index + 1} — ${diffText}`,
  contactsLabel: (n: number) => `${n} אנשי קשר`,
  keptLabel: (n: number) => `${n} שמרת`,
  skippedLabel: (n: number) => `${n} דילגת`,
  nextButton: {
    results: 'לתוצאות',
    map: 'המשך למפה',
  },
  mapButton: {
    results: 'לתוצאות הסופיות',
    next: (city: string) => `!יוצאים ל-${city}`,
  },
} as const;
