// ── Import page text ────────────────────────────────────────────────────────

export const IMPORT_TEXT = {
  title: 'ייבוא אנשי קשר',
  resume: {
    title: 'נמצא סשן קיים',
    info: (processed: number, total: number, pending: number) =>
      `מיינת ${processed} מתוך ${total} — נותרו ${pending} אנשי קשר.`,
    button: 'המשך מהמקום שעצרת',
  },
  sources: {
    google: {
      title: 'Google Contacts',
      desc: 'ייבוא כל אנשי הקשר מחשבון Google שלך',
      action: 'ייבא',
    },
    facebook: {
      title: 'Facebook',
      desc: 'ייבוא חברים מקובץ JSON של פייסבוק (friends.json)',
      action: 'בחר קובץ',
    },
    instagram: {
      title: 'Instagram',
      desc: 'ייבוא מקובץ JSON של אינסטגרם (followers_1.json)',
      action: 'בחר קובץ',
    },
    phone: {
      title: 'אנשי קשר מהטלפון',
      desc: 'ייבוא מקובץ vCard (.vcf) — מתאים למשתמשי iPhone שאינם מסנכרנים עם Google',
      action: 'בחר .vcf',
    },
  },
  instructions: {
    facebook: {
      linkText: 'פתח את דף הורדת הנתונים של פייסבוק',
      summary: 'הוראות',
      steps: [
        'בחר "הורד את המידע שלך" ← "בחר סוגי מידע ספציפיים"',
        'סמן "חברים ועוקבים" בלבד',
        'בחר פורמט JSON ← "בקש קבצים"',
        'לאחר קבלת הקובץ — פתח את friends.json מהארכיון',
      ],
    },
    instagram: {
      linkText: 'פתח את דף הורדת הנתונים של אינסטגרם',
      summary: 'הוראות',
      steps: [
        'בחר "הורד או העבר מידע" ← "מידע ספציפי"',
        'סמן "עוקבים ועוקבים אחרי" בלבד',
        'בחר פורמט JSON ← "צור קבצים"',
        'פתח את הקובץ followers_1.json מהארכיון שיגיע למייל',
      ],
    },
    iphone: {
      summary: 'איך מייצאים מ-iPhone?',
      steps: [
        'פתח את אפליקציית אנשי הקשר',
        'לחץ על הגדרות (⚙) → ייצוא אנשי קשר',
        'בחר "כל אנשי הקשר" → שתף → שמור לקבצים',
        'העלה את קובץ ה-.vcf כאן',
      ],
    },
    apiSetup: {
      summary: 'בדיקת תצורה נפוצה',
      steps: [
        'כנס ל-Google Cloud Console ← APIs & Services ← Library',
        'חפש "Google Sheets API" ← Enable',
        'חפש "Google Drive API" ← Enable',
        'חזור לכאן והתחבר מחדש עם Google',
      ],
    },
  },
  manual: {
    title: 'הוספה ידנית',
    count: (n: number) => `${n} נוספו`,
    addButton: '+ הוסף',
    closeButton: 'סגור',
    submitButton: 'הוסף איש קשר',
    fields: { name: 'שם *', phone: 'טלפון', email: 'אימייל' },
  },
  ready: {
    subtitle: 'אנשי קשר מוכנים למיון',
    sheetsInfo: (count: number) =>
      `${count} אנשי קשר נשמרו ב-Google Sheets — כל שינוי יתעדכן אוטומטית`,
    startButton: 'התחל מיון',
    startWithSheetsButton: 'שמור ל-Google Sheets והתחל',
    startWithoutSheetsButton: 'התחל ללא שמירה',
    savingMessage: 'שומר ל-Google Sheets...',
  },
  errors: {
    noContacts: 'לא נמצאו אנשי קשר בקובץ',
    apiDisabled:
      'ה-API של Google Sheets או Drive אינו מופעל בפרויקט Google Cloud שלך. עקוב אחר ההוראות למטה.',
    noPermission:
      'חסרות הרשאות. התנתק והתחבר מחדש כדי לאשר את הגישה ל-Google Sheets ו-Drive.',
    sheetsSave: 'שגיאה בשמירה ל-Google Sheets. נסה שוב.',
  },
  imported: 'יובא',
  emptyState: 'ייבא לפחות מקור אחד כדי להתחיל',
} as const;
