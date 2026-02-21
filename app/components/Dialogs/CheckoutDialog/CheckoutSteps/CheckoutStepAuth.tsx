"use client";

import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";
import CustomInput from "../../../CustomInput/CustomInput";
import CheckBox from "../../../CheckBox/CheckBox";

import Image from "next/image";

interface CheckoutStepAuthProps {
  onAuthComplete: () => void;
}

const CheckoutStepAuth: React.FC<CheckoutStepAuthProps> = ({
  onAuthComplete,
}) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupFname, setSignupFname] = useState("");
  const [signupLname, setSignupLname] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (db) {
        const userRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: result.user.email,
            displayName: result.user.displayName,
            fname: result.user.displayName?.split(" ")[0] || "",
            lname: result.user.displayName?.split(" ").slice(1).join(" ") || "",
            photoURL: result.user.photoURL,
            createdAt: new Date(),
          });
        }
      }

      onAuthComplete();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError("");
      } else {
        setError("שגיאה בהתחברות עם Google");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      onAuthComplete();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
          setError("משתמש לא נמצא");
          break;
        case "auth/wrong-password":
          setError("סיסמה שגויה");
          break;
        case "auth/invalid-email":
          setError("כתובת אימייל לא תקינה");
          break;
        case "auth/invalid-credential":
          setError("פרטי התחברות שגויים");
          break;
        default:
          setError("שגיאה בהתחברות");
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
      const auth = getAuth();
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
        case "auth/email-already-in-use":
          setError("כתובת האימייל כבר בשימוש");
          break;
        case "auth/weak-password":
          setError("הסיסמה חלשה מדי (לפחות 6 תווים)");
          break;
        case "auth/invalid-email":
          setError("כתובת אימייל לא תקינה");
          break;
        default:
          setError("שגיאה בהרשמה");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-4" dir="rtl">
      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 w-full max-w-[456px] h-[48px] border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Image
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          width={20}
          height={20}
          unoptimized
        />
        <span className="text-text-regular font-medium">
          {mode === "login" ? "התחבר עם Google" : "הירשם עם Google"}
        </span>
      </button>

      {/* Divider */}
      <div className="flex items-center w-full max-w-[456px]">
        <div className="flex-1 h-[1px] bg-gray-300" />
        <span className="px-3 text-sm text-gray-500">או</span>
        <div className="flex-1 h-[1px] bg-gray-300" />
      </div>

      {/* Toggle Login/Signup */}
      <div className="flex gap-4 w-full max-w-[456px]">
        <button
          onClick={() => {
            setMode("login");
            setError("");
          }}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-colors ${
            mode === "login"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          התחברות
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setError("");
          }}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-colors ${
            mode === "signup"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          הרשמה
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center w-full">{error}</p>
      )}

      {mode === "login" ? (
        <form
          onSubmit={handleLogin}
          className="flex flex-col items-center w-full gap-3"
        >
          <CustomInput
            id="checkout-email"
            name="email"
            type="email"
            placeholder="דואר אלקטרוני"
            width="w-full max-w-[456px]"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <CustomInput
            id="checkout-password"
            name="password"
            type="password"
            placeholder="סיסמה"
            width="w-full max-w-[456px]"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full max-w-[456px] h-[48px] bg-primary text-white rounded-lg font-bold text-text-regular hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "מתחבר..." : "התחבר"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSignup}
          className="flex flex-col items-center w-full gap-3"
        >
          <CustomInput
            id="signup-email"
            name="email"
            type="email"
            placeholder="דואר אלקטרוני"
            width="w-full max-w-[456px]"
            required
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
          />
          <CustomInput
            id="signup-phone"
            name="phone"
            type="tel"
            placeholder="מספר טלפון"
            width="w-full max-w-[456px]"
            required
            pattern="[0-9]{10}"
            value={signupPhone}
            onChange={(e) => setSignupPhone(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3 w-full max-w-[456px]">
            <CustomInput
              id="signup-fname"
              name="fname"
              type="text"
              placeholder="שם פרטי"
              width="w-full"
              required
              value={signupFname}
              onChange={(e) => setSignupFname(e.target.value)}
            />
            <CustomInput
              id="signup-lname"
              name="lname"
              type="text"
              placeholder="שם משפחה"
              width="w-full"
              required
              value={signupLname}
              onChange={(e) => setSignupLname(e.target.value)}
            />
          </div>
          <CustomInput
            id="signup-password"
            name="password"
            type="password"
            placeholder="סיסמה"
            width="w-full max-w-[456px]"
            required
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
          />
          <CustomInput
            id="signup-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="אימות סיסמה"
            width="w-full max-w-[456px]"
            required
            value={signupConfirmPassword}
            onChange={(e) => setSignupConfirmPassword(e.target.value)}
          />
          <div className="w-full max-w-[456px]">
            <CheckBox
              text="אני מאשר את תנאי השימוש"
              required
              onChange={(checked) => setTermsAccepted(checked)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full max-w-[456px] h-[48px] bg-primary text-white rounded-lg font-bold text-text-regular hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "נרשם..." : "הירשם"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CheckoutStepAuth;
