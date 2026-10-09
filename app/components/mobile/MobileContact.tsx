"use client";

import React from "react";
import MobileShell from "./MobileShell";
import { MobileLegalHeader } from "./MobileLegal";
import { Icon } from "./Icon";
import { SourceGlyph } from "../SourceIcon/SourceIcon";

type ContactRow = {
  label: string;
  value: string;
  href?: string;
  color: string;
  glyph: React.ReactNode;
  /** Mono suits addresses and handles; Hebrew text reads better in the body font. */
  mono?: boolean;
};

const TALK: ContactRow[] = [
  {
    label: "אימייל",
    value: "tiketbizzz@gmail.com",
    href: "mailto:tiketbizzz@gmail.com",
    color: "var(--tk-ink)",
    glyph: <SourceGlyph source="email" size={18} />,
  },
  {
    label: "וואטסאפ",
    value: "054-4437070",
    href: "https://wa.me/972544437070",
    color: "#25D366",
    glyph: <SourceGlyph source="whatsapp" size={18} />,
  },
];

const FOLLOW: ContactRow[] = [
  {
    label: "אינסטגרם",
    value: "@tiket.app",
    href: "https://www.instagram.com/tiket.app/",
    color: "#E1306C",
    glyph: <SourceGlyph source="instagram" size={18} />,
  },
  {
    label: "פייסבוק",
    value: "tiket.co.il",
    href: "https://www.facebook.com/tiket.co.il/",
    color: "#1877F2",
    glyph: <SourceGlyph source="facebook" size={18} />,
  },
];

const OFFICE: ContactRow[] = [
  {
    label: "כתובת",
    value: "אברהם יפה 5, חולון",
    mono: false,
    color: "var(--tk-ink)",
    glyph: <Icon.pin size={17} color="#fff" />,
  },
];

const h2Style: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  margin: "0 0 8px",
  letterSpacing: "-0.01em",
  color: "var(--tk-ink)",
};

function Rows({ rows }: { rows: ContactRow[] }) {
  return (
    <div
      style={{
        background: "var(--tk-paper)",
        border: "1px solid var(--tk-line)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {rows.map(({ label, value, href, color, glyph, mono = true }, i) => {
        const external = href?.startsWith("http");
        const content = (
          <>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                // .tk-mobile gives everything a squircle corner-shape.
                ...({ cornerShape: "round" } as React.CSSProperties),
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {glyph}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{label}</span>
              <span
                className={mono ? "tk-mono" : undefined}
                dir="auto"
                style={{
                  display: "block",
                  textAlign: "right",
                  fontSize: mono ? 11 : 12,
                  color: "var(--tk-ink-2)",
                  marginTop: 2,
                  overflowWrap: "anywhere",
                }}
              >
                {value}
              </span>
            </span>
          </>
        );
        const rowStyle: React.CSSProperties = {
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          borderTop: i ? "1px solid var(--tk-line)" : "none",
          color: "var(--tk-ink)",
          textDecoration: "none",
        };
        return href ? (
          <a
            key={label}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            style={rowStyle}
          >
            {content}
          </a>
        ) : (
          <div key={label} style={rowStyle}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

/** The contact page on phones, in the same paper style as the legal pages. */
export default function MobileContact() {
  return (
    <MobileShell showBottomNav={false}>
      {/* The shell only fills the screen when it has a bottom nav; this short
          page would otherwise leave bare white below it. */}
      <div style={{ minHeight: "100dvh" }}>
      <MobileLegalHeader kicker="◆ CONTACT" title="צור קשר" meta="מענה בתוך 48 שעות" />

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
          נשמח לשמוע מכם! יש שאלה, הערה או בעיה? כתבו לנו בכל שעה, ואנחנו
          משתדלים לענות בתוך 48 שעות.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <section>
            <h2 style={h2Style}>דברו איתנו</h2>
            <Rows rows={TALK} />
          </section>
          <section>
            <h2 style={h2Style}>עקבו אחרינו</h2>
            <Rows rows={FOLLOW} />
          </section>
          <section>
            <h2 style={h2Style}>המשרד</h2>
            <Rows rows={OFFICE} />
          </section>
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
          ◆ TIKET · CONTACT
        </div>
      </div>
      </div>
    </MobileShell>
  );
}
