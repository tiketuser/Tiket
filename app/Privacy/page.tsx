import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";

const sections = [
  {
    title: "1. מבוא",
    body: "טיקט (tiket.co.il) מחויבת להגן על פרטיותך. מדיניות זו מסבירה אילו מידע אנו אוספים, כיצד אנו משתמשים בו ואיך אנו מגנים עליו.",
  },
  {
    title: "2. מידע שאנו אוספים",
    body: "אנו אוספים: פרטי הרשמה (שם, כתובת דוא\"ל), פרטי תשלום (מעובדים בצורה מוצפנת דרך Stripe), תמונות כרטיסים שהעלית לצורך אימות, נתוני שימוש כלליים (עמודים שביקרת, חיפושים) ונתוני מכשיר.",
  },
  {
    title: "3. שימוש במידע",
    body: "אנו משתמשים במידע כדי: לאמת כרטיסים מול ספקים, לעבד תשלומים, לשלוח עדכונים על הזמנות, לשפר את השירות ולמנוע הונאה.",
  },
  {
    title: "4. שיתוף מידע עם צדדים שלישיים",
    body: "אנו לא מוכרים את המידע שלך. אנו משתפים מידע רק עם: ספקי כרטיסים לצורך אימות (Tickchak, Eventim), Stripe לעיבוד תשלומים, Google Cloud לאחסון ועיבוד נתונים — כולם כפופים להסכמי סודיות.",
  },
  {
    title: "5. אחסון ואבטחה",
    body: "המידע שלך מאוחסן בשרתי Google Cloud בתוך האיחוד האירופי. אנו משתמשים בהצפנה (TLS/HTTPS) לכל התקשורת ובהצפנת מסד נתונים למידע רגיש.",
  },
  {
    title: "6. עוגיות (Cookies)",
    body: "אנו משתמשים בעוגיות לצורך אימות מושב וניתוח שימוש אנונימי. ניתן לכבות עוגיות בהגדרות הדפדפן, אך חלק מהתכונות עלולות לא לפעול כראוי.",
  },
  {
    title: "7. זכויות המשתמש",
    body: "בהתאם לחוקי הפרטיות הרלוונטיים, יש לך זכות לעיין במידע שאנו מחזיקים עליך, לתקן מידע שגוי, למחוק את חשבונך ואת הנתונים המשויכים לו, ולהגביל את עיבוד המידע שלך.",
  },
  {
    title: "8. שמירת מידע",
    body: "אנו שומרים מידע על עסקאות למשך 7 שנים בהתאם לדרישות חשבונאיות. מידע חשבון שנמחק מוסר תוך 30 יום.",
  },
  {
    title: "9. שינויים במדיניות",
    body: "שינויים מהותיים במדיניות זו יפורסמו באתר עם הודעה מוקדמת של 14 יום. המשך השימוש לאחר מועד השינוי מהווה הסכמה.",
  },
  {
    title: "10. יצירת קשר",
    body: "לבקשות הקשורות לפרטיות, פנו אלינו בכתובת avivnir2004@gmail.com או דרך דף צור קשר באתר.",
  },
];

export default function PrivacyPage() {
  return (
    <div dir="rtl">
      <NavBar />

      {/* Hero */}
      <section className="pt-14 pb-12 px-4 md:px-8 bg-secondary/20 shadow-small-inner text-center">
        <p className="text-text-regular font-light text-subtext leading-7 mb-2">
          עודכן לאחרונה: מרץ 2025
        </p>
        <h1 className="text-heading-2-mobile md:text-heading-1-desktop font-bold text-subtext leading-tight text-balance">
          מדיניות פרטיות
        </h1>
        <p className="mt-4 text-text-regular md:text-text-large font-light text-mutedText max-w-2xl mx-auto leading-7 text-pretty">
          אנו לוקחים את הפרטיות שלך ברצינות. הנה כל מה שאנחנו עושים עם המידע שלך.
        </p>
      </section>

      {/* Content */}
      <section className="py-14 px-4 md:px-8 max-w-3xl mx-auto">
        <div className="flex flex-col gap-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-text-large font-bold text-subtext mb-2 text-balance">
                {s.title}
              </h2>
              <p className="text-text-regular font-light text-mutedText leading-7 text-pretty">
                {s.body}
              </p>
              {i < sections.length - 1 && (
                <div className="h-px bg-gray-100 mt-8" />
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
