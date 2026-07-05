"use client";

import React from "react";
import { useRouter } from "next/navigation";
import MobileShell from "./MobileShell";
import { Icon } from "./Icon";

export type LegalSection = { title: string; body: string };

export default function MobileLegal({
  kind,
  updated,
  intro,
  sections,
  contactEmail,
}: {
  kind: "terms" | "privacy";
  updated: string;
  intro: string;
  sections: LegalSection[];
  contactEmail: string;
}) {
  const router = useRouter();
  const isTerms = kind === "terms";
  const title = isTerms ? "תנאי שימוש" : "מדיניות פרטיות";
  const kicker = isTerms ? "◆ LEGAL" : "◆ PRIVACY";
  const stamp = isTerms ? "TIKET · TERMS OF USE" : "TIKET · PRIVACY POLICY";

  return (
    <MobileShell showBottomNav={false}>
      <div
        style={{
          padding: "calc(14px + var(--sat, env(safe-area-inset-top, 0px))) 18px 16px",
          borderBottom: "1px solid var(--tk-line)",
          background: "var(--tk-paper)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => router.back()}
            aria-label="חזרה"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "var(--tk-paper)",
              border: "1px solid var(--tk-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon.chev size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="tk-mono"
              style={{
                fontSize: 10,
                color: "var(--tk-blue)",
                letterSpacing: "0.12em",
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </div>
          </div>
        </div>
        <div
          className="tk-mono"
          style={{
            fontSize: 10,
            color: "var(--tk-muted)",
            marginTop: 8,
            paddingInlineStart: 44,
          }}
        >
          עודכן לאחרונה · {updated}
        </div>
      </div>

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

        <div
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {sections.map((s, i) => (
            <section key={i}>
              <h2
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  margin: "0 0 6px",
                  letterSpacing: "-0.01em",
                  color: "var(--tk-ink)",
                }}
              >
                {s.title}
              </h2>
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.75,
                  color: "var(--tk-ink-2)",
                  margin: 0,
                }}
              >
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            padding: "14px 14px",
            background: "rgba(181,70,83,0.04)",
            border: "1px solid rgba(181,70,83,0.18)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
            שאלות?
          </div>
          <div
            className="tk-mono"
            style={{ fontSize: 11, color: "var(--tk-ink-2)", lineHeight: 1.6 }}
          >
            {contactEmail}
          </div>
        </div>

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
          ◆ {stamp}
        </div>
      </div>
    </MobileShell>
  );
}
