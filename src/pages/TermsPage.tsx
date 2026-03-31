export default function TermsPage() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(160deg, #B71C1C 0%, #E53935 30%, #EF5350 60%, #FFCDD2 85%, #FFF5F5 100%)' }}
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-black text-white drop-shadow-lg">תנאי שימוש</h1>
        <p className="text-white/70 text-sm mt-1">מפקדון – עיריית מעלה אדומים</p>
      </div>

      {/* Content card */}
      <div className="flex-1 mx-4 mb-6 bg-white rounded-3xl shadow-2xl overflow-y-auto">
        <div className="p-6 space-y-6 text-gray-800 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">1. כללי</h2>
            <p>
              ברוכים הבאים לאפליקציית מפקדון ("האפליקציה") של עיריית מעלה אדומים.
              השימוש באפליקציה מהווה הסכמה לתנאי שימוש אלה. נא לקרוא אותם בעיון לפני השימוש.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">2. מטרת השירות</h2>
            <p>
              האפליקציה נועדה לסייע לתושבי ועובדי עיריית מעלה אדומים לנהל ולתעדף את רשימת אנשי הקשר שלהם
              לצרכי חירום ומפקד. השימוש מיועד לגורמים מורשים בלבד.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">3. תנאי גישה</h2>
            <ul className="list-disc list-inside space-y-1 pr-2">
              <li>הגישה לאפליקציה מוגבלת לרשימת משתמשים מאושרת על-ידי העירייה.</li>
              <li>אין להעביר פרטי גישה לאחרים.</li>
              <li>יש להשתמש באפליקציה למטרות לגיטימיות בלבד ובהתאם להנחיות העירייה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">4. אחריות המשתמש</h2>
            <ul className="list-disc list-inside space-y-1 pr-2">
              <li>המשתמש אחראי לדיוק המידע שמתקבל מחשבון Google שלו.</li>
              <li>יש להשתמש בנתוני אנשי הקשר בהתאם לחוקי הפרטיות הישראליים.</li>
              <li>אין לעשות שימוש בנתונים שהופקו מהאפליקציה לצרכים מסחריים.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">5. זמינות השירות</h2>
            <p>
              העירייה שומרת לעצמה את הזכות לשנות, להשעות או להפסיק את השירות בכל עת וללא הודעה מוקדמת.
              אין אחריות לזמינות מלאה ורציפה של האפליקציה.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">6. שינויים בתנאים</h2>
            <p>
              העירייה רשאית לעדכן תנאי שימוש אלה מעת לעת. המשך השימוש לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">7. דין וסמכות שיפוט</h2>
            <p>
              תנאי שימוש אלה כפופים לדין הישראלי. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים בישראל.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">8. יצירת קשר</h2>
            <p>
              לשאלות בנוגע לתנאי שימוש אלה ניתן לפנות לעיריית מעלה אדומים:
            </p>
            <p className="mt-1 font-medium">עיריית מעלה אדומים, רחוב קדם 1, מעלה אדומים</p>
          </section>

          <p className="text-gray-400 text-xs pt-2 border-t border-gray-100">
            עדכון אחרון: מרץ 2026
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="px-4 pb-8 text-center">
        <a
          href="/"
          className="inline-block bg-white/20 text-white font-bold py-3 px-8 rounded-2xl text-sm hover:bg-white/30 transition-all"
        >
          ← חזרה לאפליקציה
        </a>
      </div>
    </div>
  );
}
