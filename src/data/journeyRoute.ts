export interface JourneyCity {
  name: string;
  // flavor is currently unused in the UI — reserved for a future "chapter complete"
  // celebratory screen that describes the city Ilan just arrived at.
  flavor: string;
}

// Ilan Gilon's journey from his home in Ashdod to the Knesset in Jerusalem.
// The array has exactly 9 entries: the starting city + 7 waypoints + the destination.
//
// IMPORTANT — relationship to the chapter system:
//   JOURNEY.length        = 9  (one entry per city)
//   JOURNEY.length - 1    = 8  (number of legs / chapters)
//   CHAPTER_WEIGHTS.length must equal JOURNEY.length - 1  (see SessionContext.tsx)
//
// In SwipePage.tsx the progress bar label for chapter `i` (0-indexed) uses:
//   JOURNEY[i + 1].name
// because chapter 0 is the leg *from* JOURNEY[0] (Ashdod) *to* JOURNEY[1],
// and so on. JOURNEY[0] is never shown as a destination label.
//
// To customise the route: replace the placeholder city names and flavor texts below.
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

// Number of chapter legs = number of cities minus the starting city.
// This must stay equal to CHAPTER_WEIGHTS.length in SessionContext.tsx.
export const NUM_CHAPTERS = JOURNEY.length - 1; // 8
