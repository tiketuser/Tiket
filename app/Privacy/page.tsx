import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import {
  UserRound,
  Database,
  Settings2,
  Share2,
  Lock,
  Cookie,
  BadgeCheck,
  Clock,
  RefreshCw,
  Mail,
  ShieldCheck,
} from "lucide-react";

const sections = [
  {
    icon: UserRound,
    title: "1. מבוא",
    body: "טיקט (tiket.co.il) מחויבת להגן על פרטיותך. מדיניות זו מסבירה אילו מידע אנו אוספים, כיצד אנו משתמשים בו ואיך אנו מגנים עליו.",
  },
  {
    icon: Database,
    title: "2. מידע שאנו אוספים",
    body: 'אנו אוספים: פרטי הרשמה (שם, כתובת דוא"ל), פרטי תשלום (מעובדים בצורה מוצפנת דרך Stripe), תמונות כרטיסים שהעלית לצורך אימות, נתוני שימוש כלליים (עמודים שביקרת, חיפושים) ונתוני מכשיר.',
  },
  {
    icon: Settings2,
    title: "3. שימוש במידע",
    body: "אנו משתמשים במידע כדי: לאמת כרטיסים מול ספקים, לעבד תשלומים, לשלוח עדכונים על הזמנות, לשפר את השירות ולמנוע הונאה.",
  },
  {
    icon: Share2,
    title: "4. שיתוף מידע עם צדדים שלישיים",
    body: "אנו לא מוכרים את המידע שלך. אנו משתפים מידע רק עם: ספקי כרטיסים לצורך אימות (Tickchak, Eventim), Stripe לעיבוד תשלומים, Google Cloud לאחסון ועיבוד נתונים — כולם כפופים להסכמי סודיות.",
  },
  {
    icon: Lock,
    title: "5. אחסון ואבטחה",
    body: "המידע שלך מאוחסן בשרתי Google Cloud בתוך האיחוד האירופי. אנו משתמשים בהצפנה (TLS/HTTPS) לכל התקשורת ובהצפנת מסד נתונים למידע רגיש.",
  },
  {
    icon: Cookie,
    title: "6. עוגיות (Cookies)",
    body: "אנו משתמשים בעוגיות לצורך אימות מושב וניתוח שימוש אנונימי. ניתן לכבות עוגיות בהגדרות הדפדפן, אך חלק מהתכונות עלולות לא לפעול כראוי.",
  },
  {
    icon: BadgeCheck,
    title: "7. זכויות המשתמש",
    body: "בהתאם לחוקי הפרטיות הרלוונטיים, יש לך זכות לעיין במידע שאנו מחזיקים עליך, לתקן מידע שגוי, למחוק את חשבונך ואת הנתונים המשויכים לו, ולהגביל את עיבוד המידע שלך.",
  },
  {
    icon: Clock,
    title: "8. שמירת מידע",
    body: "אנו שומרים מידע על עסקאות למשך 7 שנים בהתאם לדרישות חשבונאיות. מידע חשבון שנמחק מוסר תוך 30 יום.",
  },
  {
    icon: RefreshCw,
    title: "9. שינויים במדיניות",
    body: "שינויים מהותיים במדיניות זו יפורסמו באתר עם הודעה מוקדמת של 14 יום. המשך השימוש לאחר מועד השינוי מהווה הסכמה.",
  },
  {
    icon: Mail,
    title: "10. יצירת קשר",
    body: "לבקשות הקשורות לפרטיות, פנו אלינו בכתובת avivnir2004@gmail.com או דרך דף צור קשר באתר.",
  },
];

export default function PrivacyPage() {
  return (
    <div dir="rtl">
      <NavBar />

      {/* Hero */}
      <section className="pt-16 px-4 md:px-8 bg-secondary/20 shadow-small-inner text-center">
        <div className="flex justify-center mb-5">
          <div className="size-16 rounded-2xl bg-white shadow-small border border-gray-100 flex items-center justify-center">
            <ShieldCheck size={32} className="text-primary" />
          </div>
        </div>
        <span className="inline-block text-xs font-semibold text-primary bg-secondary/40 px-3 py-1 rounded-full mb-4">
          עודכן לאחרונה: מרץ 2025
        </span>
        <h1 className="text-heading-2-mobile md:text-heading-1-desktop font-bold text-subtext leading-tight text-balance">
          מדיניות פרטיות
        </h1>
        <p className="mt-4 text-text-regular md:text-text-large font-light text-mutedText max-w-xl mx-auto leading-7 text-pretty">
          אנו לוקחים את הפרטיות שלך ברצינות. הנה כל מה שאנחנו עושים עם המידע
          שלך.
        </p>
      </section>

      {/* Content */}
      <section className="py-14 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="flex flex-col gap-3 p-6 rounded-2xl bg-white shadow-small border border-gray-100"
              >
                <div className="size-10 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <h2 className="text-text-medium font-bold text-subtext text-balance">
                  {s.title}
                </h2>
                <p className="text-text-small font-light text-mutedText leading-6 text-pretty">
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
