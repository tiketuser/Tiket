import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import { Search, ShieldCheck, CreditCard, Ticket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "מצאו את האירוע שלכם",
    description:
      "חפשו מבין מאות אירועים — קונצרטים, הצגות, ספורט ועוד. השתמשו בחיפוש או עיינו בקטגוריות.",
  },
  {
    icon: Ticket,
    title: "בחרו כרטיס ממוכר מאומת",
    description:
      "כל כרטיס עובר תהליך אימות אוטומטי מול חברת הכרטיסים המקורית. אתם קונים רק כרטיסים אמיתיים.",
  },
  {
    icon: CreditCard,
    title: "שלמו בביטחון",
    description:
      "התשלום נשמר בנאמנות (Escrow) ומועבר למוכר רק 5–7 ימים לאחר האירוע, להגנה מלאה עליכם.",
  },
  {
    icon: ShieldCheck,
    title: "קבלו את הכרטיס ותיהנו",
    description:
      "הכרטיס מועבר ישירות לאפליקציה שלכם. כניסה חלקה לאירוע — ללא דאגות.",
  },
];

const faqs = [
  {
    q: "האם הכרטיסים מובטחים כאמיתיים?",
    a: "כן. כל כרטיס עובר אימות אוטומטי מול מערכת חברת הכרטיסים המקורית (Tickchak, Eventim וכו׳). כרטיס שלא עבר אימות לא יוצג למכירה.",
  },
  {
    q: "מה קורה אם האירוע מבוטל?",
    a: "אם האירוע מבוטל לפני שהתקיים, תקבלו החזר מלא. הכסף לא הועבר למוכר עד לאחר האירוע.",
  },
  {
    q: "כמה עולה לקנות דרך טיקט?",
    a: "אנחנו גובים עמלת שירות קטנה על כל רכישה. המחיר המלא מוצג בשקיפות מלאה לפני השלמת הרכישה.",
  },
  {
    q: "איך אני מוכר כרטיס?",
    a: 'לחצו על כפתור "מכירה" בסרגל התחתון, העלו תמונה של הכרטיס, והמערכת תאמת אותו אוטומטית. לאחר האימות המודעה תפורסם.',
  },
  {
    q: "מתי אקבל את הכסף כמוכר?",
    a: "התשלום מועבר אליכם 5–7 ימים לאחר שהאירוע התקיים, לאחר שווידאנו שהכרטיס מומש בהצלחה.",
  },
];

export default function HowItWorksPage() {
  return (
    <div dir="rtl">
      <NavBar />

      {/* Hero */}
      <section className="pt-14 pb-12 px-4 md:px-8 bg-secondary/20 shadow-small-inner text-center">
        <p className="text-text-regular font-light text-subtext leading-7 mb-2">
          שוק כרטיסים שניוני — בלי כאוס
        </p>
        <h1 className="text-heading-2-mobile md:text-heading-1-desktop font-bold text-subtext leading-tight text-balance">
          איך טיקט עובד?
        </h1>
        <p className="mt-4 text-text-regular md:text-text-large font-light text-mutedText max-w-2xl mx-auto leading-7 text-pretty">
          טיקט מחברת בין קונים ומוכרים בצורה מאובטחת, מהירה ושקופה — כל כרטיס
          מאומת, כל תשלום מוגן.
        </p>
      </section>

      {/* Steps */}
      <section className="py-14 px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-heading-4-mobile md:text-heading-4-desktop font-bold text-center text-subtext mb-10 text-balance">
          קנייה בארבעה שלבים פשוטים
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white shadow-small border border-gray-100"
              >
                <div className="size-12 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0">
                  <Icon size={24} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary bg-secondary/40 px-2 py-0.5 rounded-full tabular-nums">
                  שלב {i + 1}
                </span>
                <h3 className="text-text-medium font-bold text-subtext text-balance">
                  {step.title}
                </h3>
                <p className="text-text-small font-light text-mutedText leading-6 text-pretty">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4 md:px-8 bg-secondary/10 shadow-small-inner">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-heading-4-mobile md:text-heading-4-desktop font-bold text-center text-subtext mb-10 text-balance">
            שאלות נפוצות
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-xsmall border border-gray-100"
              >
                <h3 className="text-text-medium font-bold text-subtext mb-2 text-balance">
                  {faq.q}
                </h3>
                <p className="text-text-regular font-light text-mutedText leading-7 text-pretty">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
