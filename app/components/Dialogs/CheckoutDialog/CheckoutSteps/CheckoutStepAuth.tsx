"use client";

import React, { useState, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../../firebase";
import { signInWithGoogleCrossPlatform, isAuthCancellation } from "../../../../../lib/platform-auth";

export interface GuestInfo {
  email: string;
  phone: string;
}

interface CheckoutStepAuthProps {
  onAuthComplete: () => void;
  onGuestCheckout?: (guestInfo: GuestInfo) => void;
  externalError?: string | null;
}

type Mode = "login" | "signup" | "guest";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  padding: "0 16px",
  borderRadius: 12,
  background: "var(--tk-bg)",
  border: "1px solid var(--tk-line)",
  fontSize: 14,
  color: "var(--tk-ink)",
  outline: "none",
  fontFamily: "inherit",
};

const GoogleMark = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.82 2.36 30.27 0 24 0 14.82 0 6.73 5.06 2.69 12.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z" />
    <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.43c-.54 2.91-2.18 5.38-4.66 7.04l7.2 5.6C43.98 37.09 46.1 31.33 46.1 24.55z" />
    <path fill="#FBBC05" d="M10.67 28.64A14.5 14.5 0 019.5 24c0-1.6.27-3.14.75-4.64l-7.98-6.2A23.97 23.97 0 000 24c0 3.77.9 7.34 2.49 10.48l8.18-6.34z" />
    <path fill="#EA4335" d="M24 48c6.27 0 11.53-2.07 15.37-5.62l-7.2-5.6c-2.01 1.35-4.59 2.16-8.17 2.16-6.38 0-11.87-3.59-14.33-8.8l-8.18 6.34C6.73 42.94 14.82 48 24 48z" />
  </svg>
);

const CheckoutStepAuth: React.FC<CheckoutStepAuthProps> = ({
  onAuthComplete,
  onGuestCheckout,
  externalError,
}) => {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleStage, setGoogleStage] = useState<string>("");
  const googleStageRef = useRef<string>("");
  const trackStage = (s: string) => {
    googleStageRef.current = s;
    setGoogleStage(s);
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupFname, setSignupFname] = useState("");
  const [signupLname, setSignupLname] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestTermsAccepted, setGuestTermsAccepted] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    trackStage("starting");
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setError(`Google sign-in נתקע בשלב: ${googleStageRef.current || "starting"} — נסה שוב`);
      setIsLoading(false);
      trackStage("");
    }, 25000);
    try {
      if (!auth) { setError("שגיאה פנימית - נסה לרענן את הדף"); return; }
      const result = await signInWithGoogleCrossPlatform(trackStage);
      if (timedOut) return;
      if (!result) { setError("שגיאה פנימית - נסה לרענן את הדף"); return; }

      if (db) {
        const userRef = doc(db, "users", result.user.uid);
        getDoc(userRef)
          .then((snap) => {
            if (!snap.exists()) {
              return setDoc(userRef, {
                email: result.user.email,
                displayName: result.user.displayName,
                fname: result.user.displayName?.split(" ")[0] || "",
                lname: result.user.displayName?.split(" ").slice(1).join(" ") || "",
                photoURL: result.user.photoURL,
                createdAt: new Date(),
              });
            }
          })
          .catch((e) => console.error("[CheckoutStepAuth] user profile save failed:", e));
      }

      onAuthComplete();
    } catch (err: unknown) {
      if (timedOut) return;
      if (isAuthCancellation(err)) {
        setError("");
      } else {
        console.error("[CheckoutStepAuth] google sign-in failed:", err);
        setError("ההתחברות עם Google נכשלה. נסה שוב.");
      }
    } finally {
      clearTimeout(timeoutId);
      if (!timedOut) {
        setIsLoading(false);
        trackStage("");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (!auth) { setError("שגיאה פנימית - נסה לרענן את הדף"); setIsLoading(false); return; }
      await signInWithEmailAndPassword(auth, email, password);
      onAuthComplete();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found": setError("משתמש לא נמצא"); break;
        case "auth/wrong-password": setError("סיסמה שגויה"); break;
        case "auth/invalid-email": setError("כתובת אימייל לא תקינה"); break;
        case "auth/invalid-credential": setError("פרטי התחברות שגויים"); break;
        default: setError("שגיאה בהתחברות");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (signupPassword !== signupConfirmPassword) {
      setError("הסיסמאות לא תואמות");
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("יש לאשר את תנאי השימוש");
      setIsLoading(false);
      return;
    }

    try {
      if (!auth) { setError("שגיאה פנימית - נסה לרענן את הדף"); setIsLoading(false); return; }
      const result = await createUserWithEmailAndPassword(
        auth,
        signupEmail,
        signupPassword,
      );

      await updateProfile(result.user, {
        displayName: `${signupFname} ${signupLname}`,
      });

      if (db) {
        await setDoc(doc(db, "users", result.user.uid), {
          email: signupEmail,
          fname: signupFname,
          lname: signupLname,
          phone: signupPhone,
          displayName: `${signupFname} ${signupLname}`,
          createdAt: new Date(),
        });
      }

      await sendEmailVerification(result.user);
      onAuthComplete();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case "auth/email-already-in-use": setError("כתובת האימייל כבר בשימוש"); break;
        case "auth/weak-password": setError("הסיסמה חלשה מדי (לפחות 6 תווים)"); break;
        case "auth/invalid-email": setError("כתובת אימייל לא תקינה"); break;
        default: setError("שגיאה בהרשמה");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!guestTermsAccepted) {
      setError("יש לאשר את תנאי השימוש");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      setError("כתובת אימייל לא תקינה");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(guestPhone)) {
      setError("מספר טלפון לא תקין (10 ספרות)");
      return;
    }

    onGuestCheckout?.({ email: guestEmail, phone: guestPhone });
  };

  const errorBanner = (error || externalError) ? (
    <p
      className="text-center"
      style={{
        fontSize: 12,
        color: "#C4373E",
        background: "rgba(196,55,62,0.08)",
        border: "1px solid rgba(196,55,62,0.18)",
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      {error || externalError}
    </p>
  ) : null;

  const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
    height: 50,
    width: "100%",
    background: disabled ? "var(--tk-line-strong)" : "var(--tk-ink)",
    color: disabled ? "var(--tk-muted)" : "var(--tk-lime)",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "-0.01em",
  });

  return (
    <div className="flex flex-col w-full gap-4" dir="rtl">
      {/* Mode toggle (segmented control) */}
      <div
        className="flex p-1 gap-1 mx-auto"
        style={{
          background: "var(--tk-bg)",
          border: "1px solid var(--tk-line)",
          borderRadius: 999,
          width: "100%",
          maxWidth: 360,
        }}
        dir="rtl"
      >
        {([
          { id: "login", label: "התחברות" },
          { id: "signup", label: "הרשמה" },
          { id: "guest", label: "אורח" },
        ] as { id: Mode; label: string }[]).map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                setMode(opt.id);
                setError("");
              }}
              className="flex-1 transition-colors"
              style={{
                height: 36,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                background: active ? "var(--tk-ink)" : "transparent",
                color: active ? "var(--tk-lime)" : "var(--tk-muted)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Google button (login/signup only) */}
      {mode !== "guest" && (
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 transition-transform active:scale-[0.99] disabled:opacity-60"
          style={{
            height: 48,
            width: "100%",
            background: "var(--tk-bg)",
            border: "1px solid var(--tk-line)",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--tk-ink)",
            cursor: "pointer",
          }}
        >
          <GoogleMark />
          <span>
            {googleStage
              ? `Google: ${googleStage}…`
              : mode === "login" ? "התחבר עם Google" : "הירשם עם Google"}
          </span>
        </button>
      )}

      {/* OR divider */}
      {mode !== "guest" && (
        <div className="flex items-center gap-3" dir="ltr">
          <div className="flex-1" style={{ height: 1, background: "var(--tk-line)" }} />
          <span className="tk-mono" style={{ fontSize: 10, color: "var(--tk-muted)" }}>
            או
          </span>
          <div className="flex-1" style={{ height: 1, background: "var(--tk-line)" }} />
        </div>
      )}

      {errorBanner}

      {/* Forms */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-3 w-full">
          <input
            type="email"
            placeholder="דואר אלקטרוני"
            required
            dir="rtl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="סיסמה"
            required
            dir="rtl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" disabled={isLoading} style={primaryBtnStyle(isLoading)}>
            {isLoading ? "מתחבר…" : "התחבר"}
          </button>
        </form>
      )}

      {mode === "signup" && (
        <form onSubmit={handleSignup} className="flex flex-col gap-3 w-full">
          <input
            type="email"
            placeholder="דואר אלקטרוני"
            required
            dir="rtl"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="מספר טלפון"
            required
            pattern="[0-9]{10}"
            dir="rtl"
            value={signupPhone}
            onChange={(e) => setSignupPhone(e.target.value)}
            style={inputStyle}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="שם פרטי"
              required
              dir="rtl"
              value={signupFname}
              onChange={(e) => setSignupFname(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="שם משפחה"
              required
              dir="rtl"
              value={signupLname}
              onChange={(e) => setSignupLname(e.target.value)}
              style={inputStyle}
            />
          </div>
          <input
            type="password"
            placeholder="סיסמה"
            required
            dir="rtl"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="אימות סיסמה"
            required
            dir="rtl"
            value={signupConfirmPassword}
            onChange={(e) => setSignupConfirmPassword(e.target.value)}
            style={inputStyle}
          />
          <label
            className="flex items-center gap-2.5 cursor-pointer select-none px-1 mt-1"
            style={{ fontSize: 13, color: "var(--tk-ink-2)" }}
          >
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: "var(--tk-ink)" }}
            />
            <span>אני מאשר את תנאי השימוש</span>
          </label>
          <button type="submit" disabled={isLoading} style={primaryBtnStyle(isLoading)}>
            {isLoading ? "נרשם…" : "הירשם"}
          </button>
        </form>
      )}

      {mode === "guest" && (
        <form onSubmit={handleGuestCheckout} className="flex flex-col gap-3 w-full">
          <p
            className="text-center"
            style={{ fontSize: 13, color: "var(--tk-muted)" }}
          >
            הזן את פרטיך ונשלח לך את הכרטיס לאחר הרכישה
          </p>
          <input
            type="email"
            placeholder="דואר אלקטרוני"
            required
            dir="rtl"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="מספר טלפון"
            required
            pattern="[0-9]{10}"
            dir="rtl"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            style={inputStyle}
          />
          <label
            className="flex items-center gap-2.5 cursor-pointer select-none px-1 mt-1"
            style={{ fontSize: 13, color: "var(--tk-ink-2)" }}
          >
            <input
              type="checkbox"
              required
              checked={guestTermsAccepted}
              onChange={(e) => setGuestTermsAccepted(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: "var(--tk-ink)" }}
            />
            <span>אני מאשר את תנאי השימוש ומדיניות הביטולים</span>
          </label>
          <button type="submit" disabled={!guestTermsAccepted} style={primaryBtnStyle(!guestTermsAccepted)}>
            המשך לסיכום הזמנה
          </button>
        </form>
      )}
    </div>
  );
};

export default CheckoutStepAuth;
