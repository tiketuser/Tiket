"use client";

import React, { useState } from "react";
import CustomInput from "../components/CustomInput/CustomInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^0\d{8,9}$/;

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

  return (
    <div
      dir="rtl"
      className="tk-mobile min-h-screen flex flex-col items-center justify-center px-4 py-10"
    >
      <span
        style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}
        className="mb-8"
      >
        tiket<span className="tk-logo-dot">.</span>
      </span>

      <div className="w-full max-w-sm bg-white rounded-xl shadow-xlarge border border-gray-100 border-b-[4px] border-b-highlight p-6 sm:p-8">
        {done ? (
          <div className="text-center py-4">
            <h1 className="text-heading-3-mobile md:text-heading-3-desktop font-bold text-strongText mb-2">
              נרשמת בהצלחה!
            </h1>
            <p className="text-regular text-mutedText">
              תודה שהצטרפתם. נעדכן אתכם באימייל וב-SMS מיד כשטיקט עולה לאוויר.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-heading-3-mobile md:text-heading-3-desktop font-bold text-strongText text-center mb-2">
              הצטרפו לגישה המוקדמת
            </h1>
            <p className="text-regular text-mutedText text-center mb-6">
              קונים ומוכרים כרטיסים בקלות ובאופן מאובטח. השאירו אימייל וטלפון
              ותהיו הראשונים לדעת כשאנחנו עולים לאוויר.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="early-access-email"
                  className="block text-small font-medium text-strongText mb-1 text-right"
                >
                  אימייל
                </label>
                <CustomInput
                  id="early-access-email"
                  name="email"
                  type="email"
                  width="w-full"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  required
                />
                {emailError && (
                  <p className="text-small text-red-500 mt-1 text-right">
                    כתובת אימייל לא תקינה
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="early-access-phone"
                  className="block text-small font-medium text-strongText mb-1 text-right"
                >
                  טלפון
                </label>
                <CustomInput
                  id="early-access-phone"
                  name="phone"
                  type="tel"
                  width="w-full"
                  placeholder="050-0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={phoneError}
                  required
                />
                {phoneError && (
                  <p className="text-small text-red-500 mt-1 text-right">
                    מספר טלפון לא תקין
                  </p>
                )}
              </div>

              {errorMessage && (
                <p className="text-small text-red-500 text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full py-3 rounded-lg transition-colors duration-300 disabled:opacity-60"
              >
                {submitting ? "שולח..." : "הרשמה לגישה מוקדמת"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-extra-small text-mutedText mt-8 text-center">
        © 2026 tiket.
      </p>
    </div>
  );
}
