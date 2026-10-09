"use client";

import React from "react";
import MobileShell from "./MobileShell";
import { MobileLegalHeader } from "./MobileLegal";

export type HowItWorksStep = { title: string; description: string };
export type HowItWorksFaq = { q: string; a: string };

const h2Style: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  margin: "0 0 10px",
  letterSpacing: "-0.01em",
  color: "var(--tk-ink)",
};

/** /HowItWorks on phones, in the paper style of the legal pages: numbered
 *  steps, then the FAQ as a +/- list. */
export default function MobileHowItWorks({
  intro,
  steps,
  faqs,
}: {
  intro: string;
  steps: HowItWorksStep[];
  faqs: HowItWorksFaq[];
}) {
  return (
    <MobileShell showBottomNav={false}>
      <div style={{ minHeight: "100dvh" }}>
        <MobileLegalHeader
          kicker="◆ HOW IT WORKS"
          title="איך טיקט עובד?"
          meta="כל כרטיס מאומת · כל תשלום מוגן"
        />

        <div style={{ padding: "18px 18px 0" }}>
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.7,
              color: "var(--tk-ink-2)",
              margin: "0 0 18px",
              paddingBottom: 14,
              borderBottom: "1px dashed var(--tk-line-strong)",
            }}
          >
            {intro}
          </p>

          <section>
            <h2 style={h2Style}>קנייה בארבעה שלבים</h2>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--tk-paper)",
                    border: "1px solid var(--tk-line)",
                    borderRadius: 12,
                  }}
                >
                  <span
                    className="tk-mono"
                    style={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      borderRadius: 999,
                      // .tk-mobile gives everything a squircle corner-shape.
                      ...({ cornerShape: "round" } as React.CSSProperties),
                      background: "var(--tk-ink)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                      {step.title}
                    </span>
                    <span style={{ display: "block", fontSize: 12, lineHeight: 1.65, color: "var(--tk-ink-2)" }}>
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section style={{ marginTop: 22 }}>
            <h2 style={h2Style}>שאלות נפוצות</h2>
            <div style={{ borderTop: "1px solid var(--tk-line)" }}>
              {faqs.map(({ q, a }) => (
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
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: "var(--tk-muted)",
                      margin: 0,
                      paddingBottom: 12,
                    }}
                  >
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <div
            className="tk-mono"
            style={{
              textAlign: "center",
              fontSize: 9,
              color: "var(--tk-muted)",
              letterSpacing: "0.12em",
              padding: "22px 0 8px",
            }}
          >
            ◆ TIKET · HOW IT WORKS
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
