"use client";

import React, { useEffect, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^0\d{8,9}$/;

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--tk-muted)",
  marginBottom: 4,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  border: "1px solid var(--tk-line-strong)",
  borderRadius: 10,
  fontSize: 13,
  fontFamily: "inherit",
  background: "var(--tk-bg)",
  outline: "none",
  color: "var(--tk-ink)",
};

/** Where this visitor came from: an explicit utm_source wins, otherwise the
 *  cookie the middleware set from a campaign short code such as /ig. */
function readSource(): string {
  if (typeof window === "undefined") return "";
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  if (utm) return utm.slice(0, 40);
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("ea_src="));
  return cookie ? decodeURIComponent(cookie.slice(7)).slice(0, 40) : "";
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#B00020",
  textAlign: "center",
  fontWeight: 600,
  marginTop: 4,
};

export default function EarlyAccessForm() {
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [done, setDone] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [dialogIn, setDialogIn] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // One field takes either kind of contact detail; an "@" is what separates
    // the two, so the patterns can never both match the same input.
    const trimmed = contact.trim();
    const digits = trimmed.replace(/[\s-]/g, "");
    const isEmail = EMAIL_RE.test(trimmed);
    const isPhone = PHONE_RE.test(digits);

    if (!isEmail && !isPhone) {
      setContactError(true);
      setErrorMessage(trimmed ? "הזינו אימייל או מספר טלפון תקין" : "השאירו אימייל או טלפון");
      return;
    }

    setContactError(false);
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEmail ? { email: trimmed } : { phone: digits }),
          source: readSource(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "משהו השתבש, נסו שוב");
        return;
      }

      setAlreadyRegistered(Boolean(data.alreadyRegistered));
      setDone(true);
    } catch {
      setErrorMessage("בעיית תקשורת, נסו שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const closeDialog = () => {
    setDone(false);
    setContact("");
  };

  // Fade + scale the dialog in on the tick after it mounts.
  useEffect(() => {
    if (!done) {
      setDialogIn(false);
      return;
    }
    const t = setTimeout(() => setDialogIn(true), 10);
    return () => clearTimeout(t);
  }, [done]);

  // One fixed card, never scrolled: lock the document and kill the overscroll
  // rubber-band so the page can't be dragged around on touch.
  useEffect(() => {
    const { body } = document;
    const previousOverscroll = body.style.overscrollBehavior;
    body.classList.add("no-doc-scroll");
    body.style.overscrollBehavior = "none";
    return () => {
      body.classList.remove("no-doc-scroll");
      body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  // When the keyboard opens, iOS shrinks the visual viewport and scrolls the
  // page up to reveal the field, which pushes the top of the card off screen.
  // Matching the shell to the visible area keeps the card put instead.
  useEffect(() => {
    const viewport = window.visualViewport;
    const shell = shellRef.current;
    if (!viewport || !shell) return;

    const fit = () => {
      // Pad by the keyboard's height rather than shrinking the shell: the
      // shell keeps covering the whole screen, so no strip of bare page shows
      // beneath it, while the card still centres in the space left above.
      const keyboard = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      shell.style.paddingBottom = keyboard ? `${keyboard + 16}px` : "";
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
      shell.style.paddingBottom = "";
    };
  }, []);

  return (
    <div
      dir="rtl"
      ref={shellRef}
      // m-auto on the card rather than justify-center: when the keyboard
      // leaves less room than the card needs, centering would clip its top,
      // whereas auto margins let it sit flush and stay reachable.
      className="tk-mobile h-[100dvh] overflow-y-auto flex p-4 sm:p-10"
    >
      <div
        className="w-full max-w-[400px] m-auto rounded-[20px] shadow-[0_16px_44px_rgba(0,0,0,0.12)]"
        style={{
          background: "var(--tk-paper)",
          border: "1px solid var(--tk-line-strong)",
          padding: "28px 20px 24px",
          color: "var(--tk-ink)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {/* dir=ltr keeps the logotype dot on the right of the word; in the
              page's RTL flow the neutral "." would otherwise flip to the left. */}
          <div
            dir="ltr"
            style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            tiket<span className="tk-logo-dot">.</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>
            הצטרפו לגישה המוקדמת
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--tk-muted)",
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            קונים ומוכרים כרטיסים באופן מאובטח.
            <br />
            השאירו אימייל או טלפון ותקבלו גישה מוקדמת.
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={labelStyle}>אימייל או טלפון</div>
            <input
              id="early-access-contact"
              name="email"
              type="text"
              inputMode="email"
              // The field takes either kind of detail, but email is the common
              // case and what Safari/Chrome can actually offer from saved data.
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              placeholder="name@example.com / 0501234567"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (contactError) {
                  setContactError(false);
                  setErrorMessage("");
                }
              }}
              dir="ltr"
              style={{
                ...inputStyle,
                textAlign: "right",
                borderColor: contactError ? "#B00020" : "var(--tk-line-strong)",
              }}
            />
          </div>

          {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 12,
              background: "var(--tk-ink)",
              color: "#fff",
              border: "none",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
              marginTop: 4,
            }}
          >
            {submitting ? "שולח..." : "הרשמה לגישה מוקדמת"}
          </button>
        </form>

        <div
          style={{
            fontSize: 10,
            color: "var(--tk-muted)",
            textAlign: "center",
            marginTop: 20,
            lineHeight: 1.5,
          }}
        >
          TIKET • בקרוב אצלכם
        </div>
      </div>

      {done && (
        <div
          onClick={closeDialog}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10,10,10,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            opacity: dialogIn ? 1 : 0,
            transition: "opacity 200ms ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 320,
              background: "var(--tk-paper)",
              color: "var(--tk-ink)",
              borderRadius: 16,
              padding: "20px 20px 16px",
              border: "1px solid var(--tk-line-strong)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              transform: dialogIn ? "scale(1)" : "scale(0.94)",
              transition: "transform 200ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <div
              className="tk-mono"
              style={{
                fontSize: 9,
                color: "var(--tk-blue)",
                letterSpacing: "0.14em",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {alreadyRegistered ? "◆ כבר ברשימה" : "◆ ההרשמה הושלמה"}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {alreadyRegistered ? "אתם כבר רשומים" : "נרשמתם בהצלחה!"}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--tk-muted)",
                textAlign: "center",
                lineHeight: 1.55,
                marginBottom: 18,
              }}
            >
              {alreadyRegistered
                ? "הפרטים שלכם כבר אצלנו ברשימת הגישה המוקדמת. נעדכן אתכם מיד כשנעלה לאוויר."
                : "נעדכן אתכם באימייל וב-SMS מיד כשטיקט עולה לאוויר."}
            </div>
            <button
              onClick={closeDialog}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                background: "var(--tk-ink)",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              סיום
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
