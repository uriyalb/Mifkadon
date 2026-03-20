// ── Results page text ────────────────────────────────────────────────────────

export const RESULTS_TEXT = {
  title: 'התוצאות',
  totalSelected: 'סה"כ נבחרו',
  tabs: { all: 'הכל' },
  emptyState: 'לא נבחרו אנשי קשר',
  restart: 'התחל מחדש',
  demo: {
    label: 'מצב דמו',
    text: 'התחבר עם Google לייצוא ל-Google Sheets',
  },
  sync: {
    syncing: 'מסנכרן עם Google Sheets...',
    success: 'הנתונים סונכרנו בהצלחה',
    error: 'שגיאה בסנכרון. נסה שוב.',
    syncFailed: 'לא הצלחנו לסנכרן עם Google Sheets. נסה שוב.',
    noSheet: 'לא נמצא Google Sheet. התחל סשן חדשה לחיבור.',
    retry: 'נסה שוב',
    openSheets: 'פתח Google Sheets',
  },
} as const;
