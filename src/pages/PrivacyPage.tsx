export default function PrivacyPage() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(160deg, #B71C1C 0%, #E53935 30%, #EF5350 60%, #FFCDD2 85%, #FFF5F5 100%)' }}
    >
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-black text-white drop-shadow-lg">מדיניות פרטיות</h1>
        <p className="text-white/70 text-sm mt-1">מפקדון – עיריית מעלה אדומים</p>
      </div>

      {/* Content card */}
      <div className="flex-1 mx-4 mb-6 bg-white rounded-3xl shadow-2xl overflow-y-auto">
        <div className="p-6 space-y-6 text-gray-800 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">1. כללי</h2>
            <p>
              אפליקציית מפקדון ("האפליקציה") פותחה על ידי עיריית מעלה אדומים לצורך סיוע בניהול ומיון אנשי קשר בעת חירום.
              מדיניות פרטיות זו מתארת כיצד אנו אוספים, משתמשים ושומרים מידע אישי.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">2. המידע שאנו אוספים</h2>
            <ul className="list-disc list-inside space-y-1 pr-2">
              <li>פרטי חשבון Google: שם, כתובת דואר אלקטרוני ותמונת פרופיל (לצורך הזדהות בלבד).</li>
              <li>רשימת אנשי הקשר מחשבון Google שלך, לצורך מיון ותעדוף.</li>
              <li>נתוני שימוש בסשן (התקדמות המיון) הנשמרים באופן מקומי בדפדפן.</li>
              <li>לרשות המשתמש: סנכרון תוצאות המיון לקובץ Google Sheets בחשבון Google Drive האישי.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">3. שימוש במידע</h2>
            <p>המידע משמש אך ורק למטרות הבאות:</p>
            <ul className="list-disc list-inside space-y-1 pr-2 mt-1">
              <li>הצגת אנשי הקשר שלך לצורך מיון ותעדוף בתהליך המפקדון.</li>
              <li>שמירת התקדמות הסשן בין ביקורים.</li>
              <li>שמירת תוצאות המיון ב-Google Sheets בחשבון האישי שלך (באישורך בלבד).</li>
            </ul>
            <p className="mt-2">אנו <strong>לא</strong> מעבירים, מוכרים או חולקים מידע אישי עם גורמים שלישיים.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">4. אחסון המידע</h2>
            <ul className="list-disc list-inside space-y-1 pr-2">
              <li>נתוני הסשן נשמרים <strong>מקומית בלבד</strong> בדפדפן שלך (localStorage) ואינם מועברים לשרתי העירייה.</li>
              <li>קובץ ה-Google Sheets, אם נוצר, מאוחסן ב-Google Drive האישי שלך בלבד.</li>
              <li>אנו איננו מחזיקים שרתי אחסון לנתוני משתמשים.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">5. אבטחת מידע</h2>
            <p>
              הגישה לאפליקציה מוגבלת לרשימת משתמשים מאושרת בלבד. הנתונים מוצפנים בדפדפן המקומי
              ואינם נחשפים לצדדים שלישיים.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">6. זכויות המשתמש</h2>
            <p>
              ניתן בכל עת לנקות את נתוני הסשן על-ידי מחיקת נתוני האתר בדפדפן, או על-ידי פנייה אלינו בכתובת המפורטת להלן.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-red-700 mb-2">7. יצירת קשר</h2>
            <p>
              לשאלות בנוגע למדיניות פרטיות זו ניתן לפנות לעיריית מעלה אדומים:
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
