"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import {
  signInWithGoogleCrossPlatform,
  signInWithAppleCrossPlatform,
  isAuthCancellation,
} from "../../../lib/platform-auth";
import { isIOS } from "../../../lib/platform";

type AuthMode = "login" | "signup";

export interface GuestInfo {
  email: string;
  phone: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  contextLabel?: string;
  /** Called after a successful sign-in/sign-up instead of closing (checkout flow). */
  onSuccess?: () => void;
  /** When provided, shows a small "המשך כאורח" option — purchase flow only. */
  onGuest?: (info: GuestInfo) => Promise<void> | void;
  guestError?: string | null;
  /** Render on desktop too, centered as a modal card on sm+ screens. */
  responsive?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function firebaseErrorToHebrew(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "האימייל כבר בשימוש";
    case "auth/invalid-email":
      return "כתובת האימייל אינה תקינה";
    case "auth/weak-password":
      return "הסיסמה חלשה מדי (לפחות 6 תווים)";
    case "auth/missing-password":
      return "יש להזין סיסמה";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "פרטי ההתחברות שגויים";
    case "auth/user-not-found":
      return "משתמש לא קיים";
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות. נסה שוב מאוחר יותר";
    default:
      return "אירעה שגיאה. נסה שוב";
  }
}

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

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--tk-muted)",
  marginBottom: 4,
  fontWeight: 600,
};

const MobileAuthSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMode = "login",
  contextLabel,
  onSuccess,
  onGuest,
  guestError,
  responsive,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestLocalError, setGuestLocalError] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Slide-up animation: mount with translateY(100%), then translateY(0) after 10ms tick.
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
      setGuestOpen(false);
      setGuestLocalError("");
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }
    setMounted(false);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Apple sign-in is offered only on iOS (getPlatform() === "ios"). isNative()
  // is also true on Android, so it must NOT be part of this check or the button
  // leaks onto Android where Sign in with Apple isn't available.
  const showApple = isIOS();

  // In the checkout flow the parent advances to payment; elsewhere just close.
  const finishSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
      router.refresh();
    }
  };

  const handleGuestSubmit = async () => {
    if (submitting || !onGuest) return;
    setGuestLocalError("");
    if (!EMAIL_RE.test(guestEmail)) {
      setGuestLocalError("כתובת אימייל לא תקינה");
      return;
    }
    const cleanPhone = guestPhone.replace(/[-\s]/g, "");
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      setGuestLocalError("מספר טלפון לא תקין (10 ספרות)");
      return;
    }
    setSubmitting(true);
    try {
      await onGuest({ email: guestEmail, phone: cleanPhone });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (!auth) {
      setError("שגיאה פנימית - נסה לרענן את הדף");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("כתובת אימייל לא תקינה");
      return;
    }
    if (!password) {
      setError("יש להזין סיסמה");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        finishSuccess();
      } else {
        if (!name.trim()) {
          setError("יש להזין שם");
          setSubmitting(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const [fname, ...rest] = name.trim().split(/\s+/);
        const lname = rest.join(" ");
        await updateProfile(cred.user, { displayName: name.trim() });
        if (db) {
          await setDoc(doc(db, "users", cred.user.uid), {
            email,
            fname,
            lname,
            phone,
            displayName: name.trim(),
            createdAt: new Date().toISOString(),
          });
        }
        await sendEmailVerification(cred.user);
        finishSuccess();
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      setError(firebaseErrorToHebrew(code));
      console.error("[MobileAuthSheet] auth failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email) {
      setError("יש להזין כתובת אימייל כדי לאפס סיסמה");
      return;
    }
    if (!auth) {
      setError("שגיאה פנימית - נסה לרענן את הדף");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("נשלח אליך אימייל לאיפוס הסיסמה. בדוק את תיבת הדואר שלך.");
    } catch (err) {
      const code = (err as { code?: string })?.code || "";
      setError(firebaseErrorToHebrew(code));
    }
  };

  const handleGoogle = async () => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await signInWithGoogleCrossPlatform();
      if (!result) {
        setError("שגיאה פנימית - נסה לרענן את הדף");
        return;
      }
      const user = result.user;
      if (db) {
        const [fname, ...rest] = (user.displayName || "").split(" ");
        const lname = rest.join(" ");
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            fname,
            lname,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString(),
          });
        }
      }
      finishSuccess();
    } catch (err) {
      if (isAuthCancellation(err)) return;
      console.error("[MobileAuthSheet] google failed:", err);
      setError("ההתחברות עם Google נכשלה. נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApple = async () => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await signInWithAppleCrossPlatform();
      if (!result) {
        setError("שגיאה פנימית - נסה לרענן את הדף");
        return;
      }
      finishSuccess();
    } catch (err) {
      if (isAuthCancellation(err)) return;
      console.error("[MobileAuthSheet] apple failed:", err);
      const code =
        (err as { code?: string; message?: string })?.code ||
        (err as { message?: string })?.message ||
        "";
      setError(code ? `ההתחברות עם Apple נכשלה: ${code}` : "ההתחברות עם Apple נכשלה. נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={
        responsive
          ? "tk-mobile flex flex-col justify-end sm:justify-center sm:items-center"
          : "tk-mobile md:hidden flex flex-col justify-end"
      }
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: mounted ? "rgba(10,10,10,0.45)" : "rgba(10,10,10,0)",
        backdropFilter: mounted ? "blur(10px)" : "blur(0px)",
        WebkitBackdropFilter: mounted ? "blur(10px)" : "blur(0px)",
        transition:
          "background 240ms ease-out, backdrop-filter 240ms ease-out, -webkit-backdrop-filter 240ms ease-out",
      }}
    >
      <div
        ref={sheetRef}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className={
          responsive
            ? "w-full rounded-t-[24px] sm:w-[440px] sm:max-w-[92vw] sm:rounded-[20px]"
            : "w-full rounded-t-[24px]"
        }
        style={{
          background: "var(--tk-bg)",
          padding: "12px 20px calc(26px + var(--sab, env(safe-area-inset-bottom, 0px)))",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.18)",
          transform: mounted ? "translateY(0)" : "translateY(100%)",
          transition: "transform 320ms cubic-bezier(.2,.8,.2,1)",
          maxHeight: "92vh",
          overflowY: "auto",
          color: "var(--tk-ink)",
        }}
      >
        {/* drag handle + close */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              background: "var(--tk-line-strong)",
              borderRadius: 999,
            }}
          />
          <button
            onClick={onClose}
            aria-label="סגור"
            style={{
              position: "absolute",
              insetInlineEnd: 0,
              top: -2,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "var(--tk-paper)",
              border: "1px solid var(--tk-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* brand + headline */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            tiket<span style={{ color: "var(--tk-blue)" }}>.</span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--tk-ink-2)",
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {guestOpen
              ? "המשך כאורח"
              : mode === "login"
                ? "שמחים שחזרת"
                : "הצטרף לקהילה"}
          </div>
          <div style={{ fontSize: 11, color: "var(--tk-muted)", marginTop: 2 }}>
            {guestOpen
              ? "בלי חשבון — הכרטיסים יישלחו אליך למייל אחרי הרכישה"
              : contextLabel ||
                (mode === "login"
                  ? "התחבר כדי להמשיך"
                  : "פתח חשבון בכמה שניות")}
          </div>
        </div>

        {/* Guest view replaces the login/signup content entirely */}
        {!guestOpen && (
          <>
        {/* mode toggle pill */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 3,
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line-strong)",
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          {[
            ["login", "התחברות"] as const,
            ["signup", "הרשמה"] as const,
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: mode === id ? "var(--tk-ink)" : "transparent",
                color: mode === id ? "#fff" : "var(--tk-ink-2)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <div>
                <div style={labelStyle}>שם מלא</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  autoComplete="name"
                  dir="rtl"
                  style={inputStyle}
                />
              </div>
            )}
            <div>
              <div style={labelStyle}>אימייל</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                dir="ltr"
                style={{ ...inputStyle, textAlign: "right" }}
              />
            </div>
            {mode === "signup" && (
              <div>
                <div style={labelStyle}>טלפון</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  type="tel"
                  autoComplete="tel"
                  dir="ltr"
                  style={{ ...inputStyle, textAlign: "right" }}
                />
              </div>
            )}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div style={labelStyle}>סיסמה</div>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      fontSize: 10,
                      color: "var(--tk-blue)",
                      fontWeight: 600,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    שכחתי סיסמה
                  </button>
                )}
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#B00020",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              marginTop: 14,
              borderRadius: 12,
              background: "var(--tk-ink)",
              color: "#fff",
              border: "none",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
              fontFamily: "inherit",
              transition: "opacity 150ms ease",
            }}
          >
            {submitting
              ? "..."
              : mode === "login"
              ? "התחבר"
              : "צור חשבון"}
          </button>
        </form>

        {/* divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "16px 0",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "var(--tk-line-strong)" }}
          />
          <span
            className="tk-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "var(--tk-muted)",
            }}
          >
            או
          </span>
          <div
            style={{ flex: 1, height: 1, background: "var(--tk-line-strong)" }}
          />
        </div>

        {/* socials */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {showApple && (
            <button
              type="button"
              onClick={handleApple}
              disabled={submitting}
              style={{
                padding: 12,
                borderRadius: 10,
                background: "var(--tk-ink)",
                color: "#fff",
                border: "1px solid var(--tk-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              המשך עם Apple
            </button>
          )}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            style={{
              padding: 12,
              borderRadius: 10,
              background: "var(--tk-paper)",
              border: "1px solid var(--tk-line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--tk-ink)",
              cursor: submitting ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            המשך עם Google
          </button>
        </div>
          </>
        )}

        {/* Guest checkout — small by design, shown only in the purchase flow */}
        {onGuest &&
          (guestOpen ? (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={labelStyle}>אימייל</div>
                  <input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    style={{ ...inputStyle, textAlign: "right" }}
                  />
                </div>
                <div>
                  <div style={labelStyle}>טלפון</div>
                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="050-0000000"
                    type="tel"
                    autoComplete="tel"
                    dir="ltr"
                    style={{ ...inputStyle, textAlign: "right" }}
                  />
                </div>
              </div>
              {(guestLocalError || guestError) && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#B00020",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {guestLocalError || guestError}
                </div>
              )}
              <button
                type="button"
                onClick={handleGuestSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 14,
                  borderRadius: 12,
                  background: "var(--tk-ink)",
                  color: "#fff",
                  border: "none",
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "..." : "המשך כאורח"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuestOpen(false);
                  setGuestLocalError("");
                }}
                style={{
                  display: "block",
                  margin: "14px auto 0",
                  background: "transparent",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--tk-muted)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 4,
                }}
              >
                חזרה להתחברות
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setGuestOpen(true)}
              style={{
                display: "block",
                margin: "14px auto 0",
                background: "transparent",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--tk-muted)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 4,
              }}
            >
              או המשך כאורח בלי חשבון
            </button>
          ))}

        <div
          style={{
            marginTop: 16,
            fontSize: 10,
            color: "var(--tk-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          ע״י המשך אתה מסכים ל
          <span style={{ color: "var(--tk-ink)", fontWeight: 600 }}>
            תנאי השימוש
          </span>{" "}
          ו
          <span style={{ color: "var(--tk-ink)", fontWeight: 600 }}>
            מדיניות הפרטיות
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileAuthSheet;
