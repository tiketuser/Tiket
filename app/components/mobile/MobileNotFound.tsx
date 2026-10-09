"use client";

import React from "react";
import Link from "next/link";
import MobileShell from "./MobileShell";

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 14,
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "inherit",
  textAlign: "center",
  textDecoration: "none",
  cursor: "pointer",
};

/** A full-screen message card on phones, like the early-access page: the 404
 *  page, and pages that have nothing to show (an event that doesn't exist). */
export function MobileNotice({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <MobileShell showBottomNav={false}>
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          padding: "calc(16px + var(--sat, env(safe-area-inset-top, 0px))) 16px 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            margin: "auto",
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line-strong)",
            borderRadius: 20,
            boxShadow: "0 16px 44px rgba(0,0,0,0.12)",
            padding: "28px 20px 24px",
            textAlign: "center",
            color: "var(--tk-ink)",
          }}
        >
          {/* dir=ltr keeps the logotype dot on the right of the word. */}
          <div dir="ltr" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
            tiket<span className="tk-logo-dot">.</span>
          </div>
          <div
            className="tk-mono"
            style={{ fontSize: 10, color: "var(--tk-blue)", letterSpacing: "0.14em", marginTop: 18 }}
          >
            {kicker}
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
            {title}
          </h1>
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.6,
              color: "var(--tk-muted)",
              margin: "8px 0 22px",
            }}
          >
            {text}
          </p>

          <Link
            href="/"
            style={{ ...buttonStyle, background: "var(--tk-ink)", color: "#fff", border: "none" }}
          >
            לדף הבית
          </Link>
          <button
            onClick={() => window.history.back()}
            style={{
              ...buttonStyle,
              marginTop: 10,
              background: "transparent",
              color: "var(--tk-ink)",
              border: "1px solid var(--tk-line-strong)",
            }}
          >
            חזרה לעמוד הקודם
          </button>

          <div style={{ fontSize: 11, color: "var(--tk-muted)", marginTop: 20 }}>
            צריכים עזרה?{" "}
            <Link href="/ContactUs" style={{ color: "inherit", fontWeight: 600 }}>
              צור קשר
            </Link>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

export default function MobileNotFound() {
  return (
    <MobileNotice
      kicker="◆ 404"
      title="העמוד לא נמצא"
      text="יכול להיות שהכתובת שגויה או שהעמוד הועבר."
    />
  );
}
