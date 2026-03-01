import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";

const sections = [
  {
    title: "1. כללי",
    body: "ברוכים הבאים לטיקט (tiket.co.il). השימוש באתר ובשירותיו מהווה הסכמה לתנאי השימוש המפורטים להלן. אם אינך מסכים לתנאים אלה, אנא הימנע משימוש בשירות.",
  },
  {
    title: "2. הגדרות",
    body: 'בתנאים אלה: "טיקט" — החברה המפעילה את הפלטפורמה. "משתמש" — כל אדם הנכנס לאתר או משתמש בשירות. "מוכר" — משתמש המפרסם כרטיסים למכירה. "קונה" — משתמש הרוכש כרטיסים דרך הפלטפורמה.',
  },
  {
    title: "3. הרשמה ואחריות המשתמש",
    body: "עליך להיות מעל גיל 18 לשימוש בשירות. אתה אחראי לשמירת פרטי ההתחברות שלך ולכל פעולה המבוצעת תחת חשבונך. חל איסור להעביר את חשבונך לאחר.",
  },
  {
    title: "4. אימות כרטיסים",
    body: "טיקט מבצעת בדיקת אותנטיות אוטומטית לכל כרטיס באמצעות API מול ספקי הכרטיסים המקוריים. עם זאת, טיקט אינה נושאת באחריות לשגיאות הנובעות ממידע שגוי שסיפק המוכר.",
  },
  {
    title: "5. תשלומים ו-Escrow",
    body: "כל תשלום מוחזק בנאמנות (Escrow) ומועבר למוכר 5–7 ימים לאחר שהאירוע התקיים ואומת. טיקט גובה עמלת שירות המפורטת בדף הרכישה.",
  },
  {
    title: "6. ביטולים והחזרים",
    body: "אם אירוע בוטל על ידי המארגן, הקונה יקבל החזר מלא. טיקט אינה מעניקה החזרים בגין אירועים שהתקיימו. מדיניות החזרים מלאה זמינה בדף צור קשר.",
  },
  {
    title: "7. איסור שימוש לרעה",
    body: "חל איסור מוחלט על: פרסום כרטיסים מזויפים, עקיפת מערכת האימות, שימוש בבוטים, והונאת משתמשים אחרים. חשבונות שיעברו על כללים אלו יושעו לאלתר.",
  },
  {
    title: "8. הגבלת אחריות",
    body: "טיקט מספקת פלטפורמה בלבד לחיבור בין קונים ומוכרים. טיקט אינה צד בעסקה ואינה אחראית לנזקים עקיפים הנובעים משימוש בשירות.",
  },
  {
    title: "9. שינויים בתנאים",
    body: "טיקט שומרת לעצמה את הזכות לשנות תנאים אלה בכל עת. שינויים מהותיים יפורסמו באתר. המשך השימוש לאחר הפרסום מהווה הסכמה לתנאים המעודכנים.",
  },
  {
    title: "10. יצירת קשר",
    body: "לשאלות בנוגע לתנאי השימוש, צרו קשר בכתובת avivnir2004@gmail.com או דרך דף צור קשר באתר.",
  },
];

export default function TermsPage() {
  return (
    <div dir="rtl">
      <NavBar />

      {/* Hero */}
      <section className="pt-14 pb-12 px-4 md:px-8 bg-secondary/20 shadow-small-inner text-center">
        <p className="text-text-regular font-light text-subtext leading-7 mb-2">
          עודכן לאחרונה: מרץ 2025
        </p>
        <h1 className="text-heading-2-mobile md:text-heading-1-desktop font-bold text-subtext leading-tight text-balance">
          תנאי שימוש
        </h1>
        <p className="mt-4 text-text-regular md:text-text-large font-light text-mutedText max-w-2xl mx-auto leading-7 text-pretty">
          אנא קראו את התנאים הבאים בעיון לפני השימוש בשירותי טיקט.
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
