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
//   CHAPTERS.length must equal JOURNEY.length - 1  (see config/chapters.ts)
//
// In SwipePage.tsx the progress bar label for chapter `i` (0-indexed) uses:
//   JOURNEY[i + 1].name
// because chapter 0 is the leg *from* JOURNEY[0] (Ashdod) *to* JOURNEY[1],
// and so on. JOURNEY[0] is never shown as a destination label.
//
// To customise the route: replace the placeholder city names and flavor texts below.
export const JOURNEY: JourneyCity[] = [
  {
    name: 'רובע ג׳ באשדוד',
    flavor: 'אילן מתחיל את המסע מהבית. הסוללה טעונה, הקסדה על הראש — קדימה!',
  },
  {
    name: 'קן השמו״צ',
    flavor: 'עצירה קצרה לטעינה. "אנחנו בדרך!" קורא אילן לעוברים ושבים.',
  },
  {
    name: 'סניף נוער מפ״ם',
    flavor: 'אנשים יוצאים לרחוב לעודד. אילן מנפנף ומחייך — הסקוטר לא מאט.',
  },
  {
    name: 'נוער מרצ',
    flavor: 'בכיכר המרכזית, ילדים מריעים. "זה הכוח של הקמפיין!" אומר אילן.',
  },
  {
    name: 'מסעדת ׳בית העם׳',
    flavor: 'חצי הדרך. אילן עוצר לפלאפל — "טנק מלא = קמפיין מנצח!"',
  },
  {
    name: 'עיריית אשדוד',
    flavor: 'ההרים מתחילים. הסקוטר עולה בנחישות. ירושלים כבר על האופק.',
  },
  {
    name: 'סיעת מרצ בכנסת',
    flavor: 'צומת אחרון לפני הגעה לבירה. "כמעט שם!" מתלהב אילן.',
  },
  {
    name: 'מצעד הגאווה',
    flavor: 'שערי ירושלים נפתחים. ריח הקפה עם ריח הניצחון.',
  },
  {
    name: 'מליאת הכנסת',
    flavor: 'הגעת! אילן מגלגל בגאווה לכניסת הכנסת. הקמפיין שלך עשה את זה!',
  },
];

// Number of chapter legs = number of cities minus the starting city.
// This must stay equal to CHAPTERS.length in config/chapters.ts.
export const NUM_JOURNEY_LEGS = JOURNEY.length - 1; // 8
