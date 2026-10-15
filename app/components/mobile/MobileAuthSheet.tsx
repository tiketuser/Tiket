"use client";

import React, { useEffect, useState } from "react";
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
import { Logo } from "./MobileTopBar";
import { useSwipeToClose } from "./useSwipeToClose";

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
  height: 44,
  padding: "0 14px",
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--r-sm)",
  fontSize: 15,
  fontFamily: "inherit",
  background: "var(--surface)",
  outline: "none",
  color: "var(--ink)",
  textAlign: "right",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ink-2)",
  marginBottom: 5,
  fontWeight: 600,
};

const socialStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: "var(--r-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "inherit",
};

const linkButton: React.CSSProperties = {
  display: "block",
  margin: "14px auto 0",
  background: "transparent",
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--muted)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
  fontFamily: "inherit",
  padding: 4,
};

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />
    ) : (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

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
  const [showPw, setShowPw] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestLocalError, setGuestLocalError] = useState("");
  const swipe = useSwipeToClose(onClose);
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

  const login = mode === "login";
  const valid = guestOpen
    ? EMAIL_RE.test(guestEmail.trim()) && guestPhone.replace(/\D/g, "").length >= 9
    : login
      ? EMAIL_RE.test(email.trim()) && password.length >= 6
      : EMAIL_RE.test(email.trim()) &&
        password.length >= 6 &&
        name.trim().split(/\s+/).length >= 2 &&
        phone.replace(/\D/g, "").length >= 9;

  const field = (
    label: string,
    input: React.ReactNode,
    extra?: React.ReactNode,
  ) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={labelStyle}>{label}</div>
        {extra}
      </div>
      {input}
    </div>
  );

  const primary = (label: string, props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      className="press"
      disabled={submitting}
      {...props}
      style={{
        width: "100%",
        height: 48,
        marginTop: 16,
        borderRadius: "var(--r-md)",
        background: valid ? "var(--brand)" : "var(--ink)",
        transition: "background .2s",
        color: "#fff",
        border: "none",
        fontSize: 15,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: submitting ? "default" : "pointer",
        opacity: submitting ? 0.6 : 1,
      }}
    >
      {submitting ? "..." : label}
    </button>
  );

  const errorLine = (text: string | null | undefined) =>
    text ? (
      <div style={{ marginTop: 12, fontSize: 13, color: "var(--brand)", textAlign: "center", fontWeight: 600 }}>
        {text}
      </div>
    ) : null;

  return (
    <div
      className={
        responsive
          ? "tk-mobile flex flex-col justify-end sm:justify-center sm:items-center"
          : "tk-mobile lg:hidden flex flex-col justify-end"
      }
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: mounted ? `rgba(20,20,19,${0.4 * swipe.progress})` : "rgba(20,20,19,0)",
        transition: "background 200ms ease-out",
      }}
    >
      <div
        ref={swipe.ref}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className={
          responsive
            ? "w-full rounded-t-[24px] sm:w-[440px] sm:max-w-[92vw] sm:rounded-[24px]"
            : "w-full rounded-t-[24px]"
        }
        style={{
          background: "var(--surface)",
          transform: mounted ? `translateY(${swipe.offset}px)` : "translateY(100%)",
          transition: swipe.offset || !mounted ? swipe.transition : "transform 280ms cubic-bezier(.2,.8,.2,1)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          color: "var(--ink)",
        }}
      >
        <div style={{ padding: "8px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto" }} />
        </div>
        <div
          style={{
            overflowY: "auto",
            padding: "8px 20px calc(24px + var(--sab, env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Logo size={24} />
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>
                {guestOpen ? "המשך כאורח" : login ? "שמחים שחזרת" : "הצטרף לקהילה"}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2, textWrap: "pretty" } as React.CSSProperties}>
                {guestOpen
                  ? "בלי חשבון - הכרטיסים יישלחו אליך למייל אחרי הרכישה"
                  : contextLabel || (login ? "התחבר כדי להמשיך" : "פתח חשבון בכמה שניות")}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור"
              className="round"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface-2)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {!guestOpen && (
            <>
              <div
                role="tablist"
                style={{
                  position: "relative",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  padding: 3,
                  borderRadius: "var(--r-sm)",
                  background: "var(--surface-2)",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    bottom: 3,
                    right: 3,
                    width: "calc(50% - 3px)",
                    borderRadius: 10,
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(20,20,19,.1)",
                    transform: login ? "none" : "translateX(-100%)",
                    transition: "transform .22s cubic-bezier(.2,.8,.2,1)",
                  }}
                />
                {([["login", "התחברות"], ["signup", "הרשמה"]] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={mode === id}
                    onClick={() => setMode(id)}
                    style={{
                      position: "relative",
                      height: 34,
                      fontSize: 14,
                      fontWeight: 600,
                      color: mode === id ? "var(--ink)" : "var(--muted)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "color .15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {!login &&
                    field(
                      "שם מלא",
                      <input className="auth-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="ישראל ישראלי" autoComplete="name" style={inputStyle} />,
                    )}
                  {field(
                    "אימייל",
                    <input className="auth-in" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" dir="ltr" style={inputStyle} />,
                  )}
                  {!login &&
                    field(
                      "טלפון",
                      <input className="auth-in" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" type="tel" autoComplete="tel" dir="ltr" style={inputStyle} />,
                    )}
                  {field(
                    "סיסמה",
                    <div style={{ position: "relative" }}>
                      <input
                        className="auth-in"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        type={showPw ? "text" : "password"}
                        autoComplete={login ? "current-password" : "new-password"}
                        style={{ ...inputStyle, paddingInlineEnd: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "הסתר סיסמה" : "הצג סיסמה"}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: 44,
                          height: 44,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--muted)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <EyeIcon off={showPw} />
                      </button>
                    </div>,
                    login && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--brand)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontFamily: "inherit",
                        }}
                      >
                        שכחתי סיסמה
                      </button>
                    ),
                  )}
                </div>
                {errorLine(error)}
                {primary(login ? "התחבר" : "צור חשבון", { type: "submit" })}
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span style={{ fontSize: 13, color: "var(--muted)" }}>או</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {showApple && (
                  <button
                    type="button"
                    className="press"
                    onClick={handleApple}
                    disabled={submitting}
                    style={{ ...socialStyle, background: "var(--ink)", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    המשך עם Apple
                  </button>
                )}
                <button
                  type="button"
                  className="press"
                  onClick={handleGoogle}
                  disabled={submitting}
                  style={{ ...socialStyle, background: "transparent", border: "1px solid var(--line-strong)", color: "var(--ink)", cursor: "pointer" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  המשך עם Google
                </button>
              </div>
            </>
          )}

          {onGuest &&
            (guestOpen ? (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {field(
                    "אימייל",
                    <input className="auth-in" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" dir="ltr" style={inputStyle} />,
                  )}
                  {field(
                    "טלפון",
                    <input className="auth-in" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="050-0000000" type="tel" autoComplete="tel" dir="ltr" style={inputStyle} />,
                  )}
                </div>
                {errorLine(guestLocalError || guestError)}
                {primary("המשך כאורח", { type: "button", onClick: handleGuestSubmit })}
                <button
                  type="button"
                  onClick={() => {
                    setGuestOpen(false);
                    setGuestLocalError("");
                  }}
                  style={linkButton}
                >
                  חזרה להתחברות
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setGuestOpen(true)} style={linkButton}>
                או המשך כאורח בלי חשבון
              </button>
            ))}

          <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
            בהמשך אתה מסכים ל
            <a href="/Terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "none" }}>
              תנאי השימוש
            </a>
            {" "}ול
            <a href="/Privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "none" }}>
              מדיניות הפרטיות
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAuthSheet;
