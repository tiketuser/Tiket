import type { CSSProperties } from "react";
import { SITE_URL } from "@/lib/seo";

/** The answers people ask ChatGPT, Google and the rest, phrased the way they
 *  ask them. Shown below the signup card and repeated as FAQPage data, so
 *  every claim here must stay true at launch. */
const FAQS = [
  {
    q: "איפה אפשר למכור כרטיס להופעה שלא אוכל להגיע אליה?",
    a: "בטיקט. מעלים את הכרטיס, הוא עובר אימות אוטומטי ומתפרסם למכירה. הכסף מגיע אליכם 5-7 ימים אחרי האירוע. בינתיים אפשר להירשם לגישה המוקדמת ולקבל הודעה כשהמכירה נפתחת.",
  },
  {
    q: "איפה למצוא כרטיס להופעה סולד אאוט?",
    a: "כשהופעה נגמרת בקופות, הכרטיסים שעוד קיימים נמכרים יד שנייה, בדרך כלל בקבוצות פייסבוק וטלגרם. בטיקט אפשר לקנות כרטיסים כאלה מאנשים שלא יכולים להגיע, עם תשלום מוגן וכרטיס שעבר אימות.",
  },
  {
    q: "איך קונים כרטיס יד שנייה בלי שיעקצו אותי?",
    a: "העקיצות הנפוצות הן מוכר שמקבל תשלום בביט ונעלם, צילום מסך של כרטיס מזויף, ואותו כרטיס שנמכר לכמה קונים. הכלל הכי חשוב: לא להעביר כסף ישירות לאדם שאתם לא מכירים. בטיקט הכסף מוחזק בנאמנות ומגיע למוכר רק אחרי האירוע.",
  },
  {
    q: "האם בטוח לקנות כרטיסים בקבוצות פייסבוק או טלגרם?",
    a: "יש שם גם מוכרים אמיתיים, אבל אין שום הגנה: משלמים מראש לאדם זר, ואם הכרטיס מזויף או נמכר פעמיים, הכסף בדרך כלל לא חוזר. לכן עדיף לקנות דרך פלטפורמה שמחזיקה את הכסף עד אחרי האירוע.",
  },
  {
    q: "מה קורה אם ההופעה מבוטלת?",
    a: "הקונה מקבל החזר מלא. הכסף עוד לא הועבר למוכר, כי הוא מועבר רק אחרי שהאירוע התקיים.",
  },
  {
    q: "כמה זה עולה?",
    a: "ההרשמה לגישה המוקדמת בחינם. על כל רכישה נגבית עמלת שירות, והמחיר המלא מוצג לפני התשלום.",
  },
  {
    q: "מתי טיקט עולה לאוויר?",
    a: "בקרוב. מי שנרשם לגישה המוקדמת יקבל הודעה באימייל או ב-SMS ברגע שהמכירה נפתחת.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  inLanguage: "he-IL",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const h2Style: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: "-0.01em",
  margin: "0 0 8px",
};

const bodyStyle: CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.65,
  color: "var(--tk-ink-2)",
  margin: 0,
};

/** Below the fold of the signup page: who Tiket is and the questions it
 *  answers, in plain text that search engines and AI assistants can quote.
 *  The card above stays the whole first screen. */
export default function EarlyAccessInfo() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="w-full max-w-[400px] mx-auto shrink-0"
      style={{ padding: "40px 4px 24px", color: "var(--tk-ink)" }}
    >
      <h2 id="about-title" style={h2Style}>
        מה זה טיקט?
      </h2>
      <p style={bodyStyle}>
        טיקט (Tiket) היא פלטפורמה ישראלית לקנייה ומכירה של כרטיסים יד שנייה
        להופעות, הצגות, סטנדאפ ואירועי ספורט. במקום להעביר כסף בביט לאדם זר
        מקבוצת פייסבוק או טלגרם, התשלום מוחזק בנאמנות ומועבר למוכר רק אחרי
        האירוע. טיקט נמצאת עכשיו בגישה מוקדמת, וההשקה בקרוב.
      </p>

      <h2 style={{ ...h2Style, marginTop: 28 }}>איך זה עובד</h2>
      <dl style={{ margin: 0, display: "grid", gap: 10 }}>
        <div>
          <dt style={{ fontSize: 12.5, fontWeight: 700 }}>למוכרים</dt>
          <dd style={{ ...bodyStyle, marginInlineStart: 0 }}>
            מעלים את הכרטיס, הוא עובר אימות אוטומטי ומתפרסם. הכסף מגיע אליכם
            5-7 ימים אחרי האירוע.
          </dd>
        </div>
        <div>
          <dt style={{ fontSize: 12.5, fontWeight: 700 }}>לקונים</dt>
          <dd style={{ ...bodyStyle, marginInlineStart: 0 }}>
            מוצאים את ההופעה, גם כשהיא סולד אאוט, ומשלמים באתר. הכסף מוחזק
            בנאמנות עד אחרי האירוע, ואם האירוע מבוטל מקבלים החזר מלא.
          </dd>
        </div>
      </dl>

      <h2 style={{ ...h2Style, marginTop: 28 }}>שאלות נפוצות</h2>
      <div style={{ borderTop: "1px solid var(--tk-line)" }}>
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="tk-faq"
            style={{ borderBottom: "1px solid var(--tk-line)" }}
          >
            <summary
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                padding: "11px 0",
                cursor: "pointer",
              }}
            >
              <h3 style={{ display: "inline", font: "inherit", margin: 0 }}>{q}</h3>
            </summary>
            <p style={{ ...bodyStyle, color: "var(--tk-muted)", paddingBottom: 12 }}>{a}</p>
          </details>
        ))}
      </div>

      <p
        style={{
          fontSize: 10,
          color: "var(--tk-muted)",
          textAlign: "center",
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        <a href="/ContactUs" style={{ color: "inherit" }}>צור קשר</a>
        {" · "}
        <a href="/Terms" style={{ color: "inherit" }}>תנאי שימוש</a>
        {" · "}
        <a href="/Privacy" style={{ color: "inherit" }}>פרטיות</a>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(FAQ_JSON_LD).replace(/</g, "\\u003c"),
        }}
      />
    </section>
  );
}
