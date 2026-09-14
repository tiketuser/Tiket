"use client";

import React, { useState } from "react";
import AdjustableDialog from "../components/Dialogs/AdjustableDialog/AdjustableDialog";

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

  return (
    <div
      dir="rtl"
      className="tk-mobile min-h-screen flex flex-col justify-end sm:justify-center sm:items-center sm:py-10"
    >
      <div
        className="w-full rounded-t-[24px] sm:rounded-[20px] sm:max-w-[440px] shadow-[0_-10px_30px_rgba(0,0,0,0.18)] sm:shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
        style={{
          background: "var(--tk-bg)",
          padding: "28px 20px calc(28px + var(--sab, env(safe-area-inset-bottom, 0px)))",
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

      <AdjustableDialog
        isOpen={done}
        onClose={closeDialog}
        heading="נרשמת בהצלחה!"
        description="תודה שהצטרפתם"
      >
        <p className="text-regular text-mutedText text-center mb-6">
          נעדכן אתכם באימייל וב-SMS מיד כשטיקט עולה לאוויר.
        </p>
        <button
          onClick={closeDialog}
          className="btn btn-primary px-8 py-3 rounded-lg transition-colors duration-300"
        >
          מעולה
        </button>
      </AdjustableDialog>
    </div>
  );
}
