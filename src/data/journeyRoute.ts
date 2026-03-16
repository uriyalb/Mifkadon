export interface JourneyCity {
  name: string;
  flavor: string;
}

// Ilan Gilon's journey from his home in Ashdod to the Knesset in Jerusalem.
// Cities are placeholders — fill in the real route stops and flavor text.
export const JOURNEY: JourneyCity[] = [
  {
    name: 'אשדוד',
    flavor: 'אילן מתחיל את המסע מהבית. הסוללה טעונה, הקסדה על הראש — קדימה!',
  },
  {
    name: 'עיר 1',
    flavor: 'עצירה קצרה לטעינה. "אנחנו בדרך!" קורא אילן לעוברים ושבים.',
  },
  {
    name: 'עיר 2',
    flavor: 'אנשים יוצאים לרחוב לעודד. אילן מנפנף ומחייך — הסקוטר לא מאט.',
  },
  {
    name: 'עיר 3',
    flavor: 'בכיכר המרכזית, ילדים מריעים. "זה הכוח של הקמפיין!" אומר אילן.',
  },
  {
    name: 'עיר 4',
    flavor: 'חצי הדרך. אילן עוצר לפלאפל — "טנק מלא = קמפיין מנצח!"',
  },
  {
    name: 'עיר 5',
    flavor: 'ההרים מתחילים. הסקוטר עולה בנחישות. ירושלים כבר על האופק.',
  },
  {
    name: 'עיר 6',
    flavor: 'צומת אחרון לפני הגעה לבירה. "כמעט שם!" מתלהב אילן.',
  },
  {
    name: 'עיר 7',
    flavor: 'שערי ירושלים נפתחים. ריח הקפה עם ריח הניצחון.',
  },
  {
    name: 'ירושלים — הכנסת',
    flavor: 'הגעת! אילן מגלגל בגאווה לכניסת הכנסת. הקמפיין שלך עשה את זה!',
  },
];

// Number of chapter legs (= cities minus the starting city)
export const NUM_CHAPTERS = JOURNEY.length - 1; // 8
