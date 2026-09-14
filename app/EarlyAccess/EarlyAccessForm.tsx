"use client";

import React, { useEffect, useState } from "react";

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

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#B00020",
  textAlign: "center",
  fontWeight: 600,
  marginTop: 4,
};

export default function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [done, setDone] = useState(false);
  const [dialogIn, setDialogIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const emailValid = EMAIL_RE.test(cleanEmail);
    const phoneValid = PHONE_RE.test(cleanPhone);

    setEmailError(!emailValid);
    setPhoneError(!phoneValid);

    if (!emailValid || !phoneValid) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, phone: cleanPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "משהו השתבש, נסו שוב");
        return;
      }

      setDone(true);
    } catch {
      setErrorMessage("בעיית תקשורת, נסו שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const closeDialog = () => {
    setDone(false);
    setEmail("");
    setPhone("");
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

  return (
    <div
      dir="rtl"
      className="tk-mobile min-h-screen flex items-center justify-center p-4 sm:p-10"
    >
      <div
        className="w-full max-w-[400px] rounded-[20px] shadow-[0_16px_44px_rgba(0,0,0,0.12)]"
        style={{
          background: "var(--tk-paper)",
          border: "1px solid var(--tk-line-strong)",
          padding: "28px 20px 24px",
          color: "var(--tk-ink)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>
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
            קונים ומוכרים כרטיסים בקלות ובאופן מאובטח.
            <br />
            השאירו אימייל וטלפון ותהיו הראשונים לדעת כשעולים לאוויר.
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={labelStyle}>אימייל</div>
            <input
              id="early-access-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="rtl"
              style={{
                ...inputStyle,
                borderColor: emailError ? "#B00020" : "var(--tk-line-strong)",
              }}
            />
            {emailError && <div style={errorStyle}>כתובת אימייל לא תקינה</div>}
          </div>

          <div>
            <div style={labelStyle}>טלפון</div>
            <input
              id="early-access-phone"
              type="tel"
              placeholder="050-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="rtl"
              style={{
                ...inputStyle,
                borderColor: phoneError ? "#B00020" : "var(--tk-line-strong)",
              }}
            />
            {phoneError && <div style={errorStyle}>מספר טלפון לא תקין</div>}
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
          © 2026 tiket.
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
              ◆ ההרשמה הושלמה
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
              נרשמתם בהצלחה!
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
              נעדכן אתכם באימייל וב-SMS מיד כשטיקט עולה לאוויר.
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
              מעולה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
