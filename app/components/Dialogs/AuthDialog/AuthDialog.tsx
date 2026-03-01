"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../firebase";
import { useRouter } from "next/navigation";

import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import CheckBox from "../../CheckBox/CheckBox";

type AuthMode = "login" | "signup";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 ml-2 shrink-0" viewBox="0 0 48 48">
    <g>
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.82 2.36 30.27 0 24 0 14.82 0 6.73 5.06 2.69 12.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.43c-.54 2.91-2.18 5.38-4.66 7.04l7.2 5.6C43.98 37.09 46.1 31.33 46.1 24.55z"/>
      <path fill="#FBBC05" d="M10.67 28.64A14.5 14.5 0 019.5 24c0-1.6.27-3.14.75-4.64l-7.98-6.2A23.97 23.97 0 000 24c0 3.77.9 7.34 2.49 10.48l8.18-6.34z"/>
      <path fill="#EA4335" d="M24 48c6.27 0 11.53-2.07 15.37-5.62l-7.2-5.6c-2.01 1.35-4.59 2.16-8.17 2.16-6.38 0-11.87-3.59-14.33-8.8l-8.18 6.34C6.73 42.94 14.82 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </g>
  </svg>
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Returns a Hebrew error message for a field based on its validity state
function getFieldError(input: HTMLInputElement): string {
  if (input.validity.valueMissing) return "שדה חובה";
  if (input.type === "email") return EMAIL_RE.test(input.value) ? "" : "כתובת אימייל לא תקינה";
  if (input.validity.valid) return "";
  if (input.validity.typeMismatch) return "ערך לא תקין";
  if (input.validity.patternMismatch) {
    if (input.name === "phone") return "מספר טלפון לא תקין";
    if (input.name === "fname" || input.name === "lname") return "לא יכול להכיל רווחים";
    return "ערך לא תקין";
  }
  if (input.validity.tooShort) return `מינימום ${input.minLength} תווים`;
  return "ערך לא תקין";
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [animating, setAnimating] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  const [loginError, setLoginError] = useState("");
  const [loginValid, setLoginValid] = useState(false);
  const [loginEmailError, setLoginEmailError] = useState("");

  const [signupError, setSignupError] = useState("");
  const [signupValid, setSignupValid] = useState(false);
  const [signupFieldErrors, setSignupFieldErrors] = useState<Record<string, string>>({});

  const loginFormRef = useRef<HTMLFormElement>(null);
  const signupFormRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rePasswordRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setContentVisible(true);
      setLoginError("");
      setLoginEmailError("");
      setSignupError("");
      setLoginValid(false);
      setSignupValid(false);
      setSignupFieldErrors({});
      loginFormRef.current?.reset();
      signupFormRef.current?.reset();
    }
  }, [isOpen, initialMode]);

  const switchMode = (next: AuthMode) => {
    if (animating || mode === next) return;
    setAnimating(true);
    setContentVisible(false);
    setTimeout(() => {
      setMode(next);
      setLoginError("");
      setLoginEmailError("");
      setSignupError("");
      setLoginValid(false);
      setSignupValid(false);
      setSignupFieldErrors({});
      setContentVisible(true);
      setAnimating(false);
    }, 220);
  };

  const handleSignupBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let error = getFieldError(input);

    // Password match check
    if (input.name === "re-password" && !error) {
      if (passwordRef.current && input.value !== passwordRef.current.value) {
        error = "הסיסמאות אינן תואמות";
      }
    }
    // Re-validate confirm field when password itself changes
    if (input.name === "password" && rePasswordRef.current?.value) {
      const reErr = input.value !== rePasswordRef.current.value ? "הסיסמאות אינן תואמות" : "";
      setSignupFieldErrors((prev) => ({ ...prev, "re-password": reErr }));
    }

    setSignupFieldErrors((prev) => ({ ...prev, [input.name]: error }));
  };

  const handleLoginEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setLoginEmailError(getFieldError(e.currentTarget));
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      if (!auth) throw new Error("Auth not initialized");
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
      router.refresh();
    } catch {
      setLoginError("פרטי ההתחברות שגויים.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError("");
    if (!auth) { setLoginError("שגיאה פנימית - נסה לרענן את הדף"); return; }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const [fname, ...rest] = (user.displayName || "").split(" ");
      const lname = rest.join(" ");
      if (db) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { email: user.email, displayName: user.displayName, fname, lname, photoURL: user.photoURL, createdAt: new Date().toISOString() });
        }
      }
      onClose();
      router.refresh();
    } catch {
      setLoginError("התחברות עם Google נכשלה.");
    }
  };

  const firebaseErrorToHebrew = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use": return "האימייל כבר בשימוש.";
      case "auth/invalid-email": return "כתובת האימייל אינה תקינה.";
      case "auth/weak-password": return "הסיסמה חלשה מדי (לפחות 6 תווים).";
      case "auth/missing-password": return "יש להזין סיסמה.";
      default: return "אירעה שגיאה. נסה שוב.";
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupError("");
    const formData = new FormData(e.currentTarget);
    const email    = formData.get("email")    as string;
    const fname    = formData.get("fname")    as string;
    const lname    = formData.get("lname")    as string;
    const password = formData.get("password") as string;
    try {
      if (!auth) { setSignupError("שגיאה פנימית - נסה לרענן את הדף"); return; }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: `${fname} ${lname}` });
      if (db) {
        await setDoc(doc(db, "users", cred.user.uid), {
          email, fname, lname,
          phone: formData.get("phone") as string,
          displayName: `${fname} ${lname}`,
          createdAt: new Date().toISOString(),
        });
      }
      await sendEmailVerification(cred.user);
      alert("נרשמת בהצלחה! נא לאשר את כתובת האימייל שלך דרך ההודעה שנשלחה אליך.");
      onClose();
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
      setSignupError(firebaseErrorToHebrew(code as string));
    }
  };

  const handleGoogleSignup = async () => {
    setSignupError("");
    if (!auth) { setSignupError("שגיאה פנימית - נסה לרענן את הדף"); return; }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const [fname, ...rest] = (user.displayName || "").split(" ");
      const lname = rest.join(" ");
      if (db) {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { email: user.email, displayName: user.displayName, fname, lname, photoURL: user.photoURL, createdAt: new Date().toISOString() });
        }
      }
      onClose();
    } catch {
      setSignupError("הרשמה עם Google נכשלה.");
    }
  };

  // CSS classes for a signup input — red border if there's an error for it
  const signupInputClass = (name: string, extra = "") =>
    `w-full h-[44px] border rounded-md px-4 text-sm outline-none transition-colors mt-4 ${extra} ${
      signupFieldErrors[name] ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-primary"
    }`;

  return (
    <AdjustableDialog
      width="w-[90vw] max-w-[400px] sm:max-w-[880px] sm:w-[880px]"
      height="h-auto"
      heading={mode === "login" ? "התחברות" : "הירשם"}
      description={mode === "login" ? "התחבר בכדי לקנות ולמכור כרטיסים" : "הירשם בכדי לקנות ולמכור כרטיסים"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div
        className="w-full flex flex-col items-center pb-6"
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        {/* ── Login form ── */}
        <form
          ref={loginFormRef}
          className="flex flex-col items-center w-full"
          onSubmit={handleEmailLogin}
          onInput={(e) => setLoginValid(e.currentTarget.checkValidity())}
          style={{ display: mode === "login" ? undefined : "none" }}
        >
          <div className="relative w-full sm:w-[456px] mt-6 pb-4">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="דואר אלקטרוני"
              dir="rtl"
              onBlur={handleLoginEmailBlur}
              className={`w-full h-[44px] border rounded-md px-4 text-sm outline-none transition-colors ${loginEmailError ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-primary"}`}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{loginEmailError}</p>
          </div>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="סיסמא"
            dir="rtl"
            className="w-full sm:w-[456px] h-[44px] border border-gray-300 rounded-md px-4 text-sm outline-none focus:border-primary transition-colors mt-4"
          />
          {loginError && <p className="text-red-600 text-sm text-center mt-3">{loginError}</p>}
          <button
            type="submit"
            disabled={!loginValid}
            className="btn mt-6 rounded-md h-[44px] min-h-0 w-full sm:w-[456px] btn-primary text-base font-semibold disabled:bg-secondary disabled:text-white"
          >
            התחבר
          </button>
          <div className="flex items-center gap-3 w-full sm:w-[456px] my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">או</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="rtl w-full sm:w-[456px] h-[44px] flex items-center justify-center bg-white border border-gray-300 rounded-md font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            המשך עם Google &nbsp;<GoogleIcon />
          </button>
        </form>

        {/* ── Signup form ── */}
        <form
          ref={signupFormRef}
          className="grid place-items-center grid-cols-2 w-full sm:w-[456px] gap-x-3 sm:gap-x-7"
          onSubmit={handleSignup}
          onInput={(e) => setSignupValid(e.currentTarget.checkValidity())}
          style={{ display: mode === "signup" ? undefined : "none" }}
        >
          {/* Email */}
          <div className="relative col-span-2 w-full mt-6 pb-4">
            <input
              name="email" type="email" required
              autoComplete="email"
              placeholder="דואר אלקטרוני" dir="rtl"
              onBlur={handleSignupBlur}
              className={signupInputClass("email", "mt-0")}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{signupFieldErrors.email ?? ""}</p>
          </div>

          {/* Phone */}
          <div className="relative col-span-2 w-full pb-4">
            <input
              name="phone" type="tel" required
              pattern="^(\+\d{1,3})?\d{9,10}$" placeholder="מספר טלפון" dir="rtl"
              autoComplete="tel"
              onBlur={handleSignupBlur}
              className={signupInputClass("phone")}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{signupFieldErrors.phone ?? ""}</p>
          </div>

          {/* First name */}
          <div className="relative w-full pb-4">
            <input
              name="fname" type="text" required
              pattern="^\S+$" placeholder="שם פרטי" dir="rtl"
              autoComplete="given-name"
              onBlur={handleSignupBlur}
              className={signupInputClass("fname")}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{signupFieldErrors.fname ?? ""}</p>
          </div>

          {/* Last name */}
          <div className="relative w-full pb-4">
            <input
              name="lname" type="text" required
              pattern="^\S+$" placeholder="שם משפחה" dir="rtl"
              autoComplete="family-name"
              onBlur={handleSignupBlur}
              className={signupInputClass("lname")}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{signupFieldErrors.lname ?? ""}</p>
          </div>

          {/* Password */}
          <div className="relative w-full pb-4">
            <input
              ref={passwordRef}
              name="password" type="password" required
              placeholder="סיסמא" dir="rtl"
              autoComplete="new-password"
              onBlur={handleSignupBlur}
              className={signupInputClass("password")}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{signupFieldErrors.password ?? ""}</p>
          </div>

          {/* Confirm password */}
          <div className="relative w-full pb-4">
            <input
              ref={rePasswordRef}
              name="re-password" type="password" required
              placeholder="אשר סיסמא" dir="rtl"
              autoComplete="new-password"
              onBlur={handleSignupBlur}
              className={signupInputClass("re-password")}
            />
            <p className="absolute bottom-0 right-0 text-red-500 text-xs leading-4">{signupFieldErrors["re-password"] ?? ""}</p>
          </div>

          {signupError && <p className="col-span-2 text-red-600 text-sm text-center mt-3">{signupError}</p>}
          <div className="col-span-2 p-3 w-full">
            <CheckBox text="אני מאשר את תנאי השימוש" required={true} />
          </div>
          <button
            type="submit"
            disabled={!signupValid}
            className="col-span-2 btn rounded-md w-full h-[44px] min-h-0 btn-primary text-base font-semibold disabled:bg-secondary disabled:text-white"
          >
            הירשם
          </button>
          <div className="col-span-2 flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">או</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="col-span-2 btn w-full h-[44px] min-h-0 rounded-md border border-gray-300 bg-white text-gray-700 text-base font-semibold hover:bg-gray-50"
          >
            הירשם עם Google<GoogleIcon />
          </button>
        </form>

        {/* ── Toggle pill ── */}
        <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 w-[260px] sm:w-[300px] select-none mt-6" dir="rtl">
          <span
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-primary shadow transition-all duration-300 ease-in-out ${
              mode === "login" ? "right-1" : "left-1"
            }`}
          />
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-xl transition-colors duration-300 ${
              mode === "login" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            התחבר
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-xl transition-colors duration-300 ${
              mode === "signup" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            הירשם
          </button>
        </div>
      </div>
    </AdjustableDialog>
  );
};

export default AuthDialog;
