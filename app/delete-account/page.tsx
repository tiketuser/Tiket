import type { Metadata } from "next";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import {
  Trash2,
  ListChecks,
  Mail,
  Database,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "מחיקת חשבון | Tiket",
  description:
    "כיצד למחוק את חשבון Tiket שלך ואת הנתונים המשויכים אליו — מתוך האפליקציה או בפנייה במייל.",
};

const sections = [
  {
    icon: ListChecks,
    title: "מחיקה מתוך האפליקציה",
    body: 'התחברו לחשבונכם, פתחו את תפריט הפרופיל (הכפתור בפינה העליונה), בחרו "פרטי משתמש", גללו לתחתית העמוד ולחצו על "מחיקת חשבון". תתבקשו לאשר — הפעולה אינה הפיכה.',
  },
  {
    icon: Mail,
    title: "מחיקה בפנייה במייל",
    body: 'אם אינכם יכולים לגשת לאפליקציה, שלחו מייל מכתובת הדוא"ל שאיתה נרשמתם אל tiketbizzz@gmail.com עם הנושא "מחיקת חשבון". נאמת את הבעלות על החשבון ונטפל בבקשה.',
  },
  {
    icon: Trash2,
    title: "מה נמחק",
    body: "פרופיל המשתמש, פרטי ההתחברות, תמונות הכרטיסים שהעליתם והמודעות הפעילות שלכם — כל הנתונים האישיים המשויכים לחשבון.",
  },
  {
    icon: Database,
    title: "מה נשמר ולמה",
    body: "רשומות של עסקאות שבוצעו נשמרות עד 7 שנים בהתאם לדרישות חשבונאיות, משפטיות ולמניעת הונאה, ולאחר מכן מוסרות. מידע זה אינו משמש עוד לזיהוי פעיל שלכם.",
  },
  {
    icon: Clock,
    title: "תוך כמה זמן",
    body: "החשבון והגישה מבוטלים מיידית. יתר הנתונים האישיים מוסרים תוך 30 יום ממועד הבקשה, למעט המידע שאנו מחויבים לשמור כמפורט לעיל.",
  },
  {
    icon: ShieldCheck,
    title: "Delete your Tiket account (English)",
    body: 'To delete your Tiket account and associated data: sign in, open your profile menu, choose "User details", scroll to the bottom and tap "Delete account". If you cannot access the app, email tiketbizzz@gmail.com from your registered address with the subject "Delete account". Account access is revoked immediately; personal data is removed within 30 days. Transaction records are retained up to 7 years for accounting, legal and fraud-prevention purposes.',
  },
];

export default function DeleteAccountPage() {
  return (
    <div dir="rtl">
      <NavBar />

      {/* Hero */}
      <section className="pt-16 px-4 md:px-8 bg-secondary/20 shadow-small-inner text-center">
        <div className="flex justify-center mb-5">
          <div className="size-16 rounded-2xl bg-white shadow-small border border-gray-100 flex items-center justify-center">
            <Trash2 size={32} className="text-primary" />
          </div>
        </div>
        <span className="inline-block text-xs font-semibold text-primary bg-secondary/40 px-3 py-1 rounded-full mb-4">
          Tiket · מחיקת חשבון
        </span>
        <h1 className="text-heading-2-mobile md:text-heading-1-desktop font-bold text-subtext leading-tight text-balance">
          מחיקת חשבון
        </h1>
        <p className="mt-4 text-text-regular md:text-text-large font-light text-mutedText max-w-xl mx-auto leading-7 text-pretty">
          תוכלו למחוק את חשבון Tiket שלכם ואת הנתונים המשויכים אליו בכל עת — מתוך
          האפליקציה או בפנייה אלינו במייל.
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
