import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import {
  FileText,
  BookOpen,
  UserCheck,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Ban,
  Scale,
  RefreshCw,
  Mail,
  ScrollText,
} from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "1. כללי",
    body: "ברוכים הבאים לטיקט (tiket.co.il). השימוש באתר ובשירותיו מהווה הסכמה לתנאי השימוש המפורטים להלן. אם אינך מסכים לתנאים אלה, אנא הימנע משימוש בשירות.",
  },
  {
    icon: BookOpen,
    title: "2. הגדרות",
    body: 'בתנאים אלה: "טיקט" — החברה המפעילה את הפלטפורמה. "משתמש" — כל אדם הנכנס לאתר או משתמש בשירות. "מוכר" — משתמש המפרסם כרטיסים למכירה. "קונה" — משתמש הרוכש כרטיסים דרך הפלטפורמה.',
  },
  {
    icon: UserCheck,
    title: "3. הרשמה ואחריות המשתמש",
    body: "עליך להיות מעל גיל 18 לשימוש בשירות. אתה אחראי לשמירת פרטי ההתחברות שלך ולכל פעולה המבוצעת תחת חשבונך. חל איסור להעביר את חשבונך לאחר.",
  },
  {
    icon: ShieldCheck,
    title: "4. אימות כרטיסים",
    body: "טיקט מבצעת בדיקת אותנטיות אוטומטית לכל כרטיס באמצעות API מול ספקי הכרטיסים המקוריים. עם זאת, טיקט אינה נושאת באחריות לשגיאות הנובעות ממידע שגוי שסיפק המוכר.",
  },
  {
    icon: CreditCard,
    title: "5. תשלומים ו-Escrow",
    body: "כל תשלום מוחזק בנאמנות (Escrow) ומועבר למוכר 5–7 ימים לאחר שהאירוע התקיים ואומת. טיקט גובה עמלת שירות המפורטת בדף הרכישה.",
  },
  {
    icon: RotateCcw,
    title: "6. ביטולים והחזרים",
    body: "אם אירוע בוטל על ידי המארגן, הקונה יקבל החזר מלא. טיקט אינה מעניקה החזרים בגין אירועים שהתקיימו. מדיניות החזרים מלאה זמינה בדף צור קשר.",
  },
  {
    icon: Ban,
    title: "7. איסור שימוש לרעה",
    body: "חל איסור מוחלט על: פרסום כרטיסים מזויפים, עקיפת מערכת האימות, שימוש בבוטים, והונאת משתמשים אחרים. חשבונות שיעברו על כללים אלו יושעו לאלתר.",
  },
  {
    icon: Scale,
    title: "8. הגבלת אחריות",
    body: "טיקט מספקת פלטפורמה בלבד לחיבור בין קונים ומוכרים. טיקט אינה צד בעסקה ואינה אחראית לנזקים עקיפים הנובעים משימוש בשירות.",
  },
  {
    icon: RefreshCw,
    title: "9. שינויים בתנאים",
    body: "טיקט שומרת לעצמה את הזכות לשנות תנאים אלה בכל עת. שינויים מהותיים יפורסמו באתר. המשך השימוש לאחר הפרסום מהווה הסכמה לתנאים המעודכנים.",
  },
  {
    icon: Mail,
    title: "10. יצירת קשר",
    body: "לשאלות בנוגע לתנאי השימוש, צרו קשר בכתובת tiketbizzz@gmail.com או דרך דף צור קשר באתר.",
  },
];

export default function TermsPage() {
  return (
    <div dir="rtl">
      <NavBar />

      {/* Hero */}
      <section className="pt-16 px-4 md:px-8 bg-secondary/20 shadow-small-inner text-center">
        <div className="flex justify-center mb-5">
          <div className="size-16 rounded-2xl bg-white shadow-small border border-gray-100 flex items-center justify-center">
            <ScrollText size={32} className="text-primary" />
          </div>
        </div>
        <span className="inline-block text-xs font-semibold text-primary bg-secondary/40 px-3 py-1 rounded-full mb-4">
          עודכן לאחרונה: מרץ 2025
        </span>
        <h1 className="text-heading-2-mobile md:text-heading-1-desktop font-bold text-subtext leading-tight text-balance">
          תנאי שימוש
        </h1>
        <p className="mt-4 text-text-regular md:text-text-large font-light text-mutedText max-w-xl mx-auto leading-7 text-pretty">
          אנא קראו את התנאים הבאים בעיון לפני השימוש בשירותי טיקט.
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
