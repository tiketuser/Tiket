import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import CustomInput from "../../CustomInput/CustomInput";
import CheckBox from "../../CheckBox/CheckBox";
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const SignUpDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const [error, setError] = useState<string>("");

  // Google sign-up handler
  const handleGoogleSignup = async () => {
    setError("");
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Split displayName into first and last name
      let fname = "";
      let lname = "";
      if (user.displayName) {
        const parts = user.displayName.split(" ");
        fname = parts[0] || "";
        lname = parts.slice(1).join(" ") || "";
      }

      // Create or update user doc in Firestore
      if (db) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || "",
            displayName: user.displayName || "",
            fname,
            lname,
            phone: user.phoneNumber || "",
            photoURL: user.photoURL || "",
            createdAt: new Date().toISOString(),
          });
        }
      }

      onClose();
    } catch {
      setError("הרשמה עם Google נכשלה.");
    }
  };

  const firebaseErrorToHebrew = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "האימייל כבר בשימוש.";
      case "auth/invalid-email":
        return "כתובת האימייל אינה תקינה.";
      case "auth/weak-password":
        return "הסיסמה חלשה מדי (לפחות 6 תווים).";
      case "auth/missing-password":
        return "יש להזין סיסמה.";
      default:
        return "אירעה שגיאה. נסה שוב.";
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    // const phone = formData.get("phone") as string;
    const fname = formData.get("fname") as string;
    const lname = formData.get("lname") as string;
    const password = formData.get("password") as string;

    try {
      const auth = getAuth();
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // Optionally update display name
      await updateProfile(userCredential.user, {
        displayName: `${fname} ${lname}`,
      });

      // Create Firestore user document
      if (db) {
        const userRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userRef, {
          email,
          displayName: `${fname} ${lname}`,
          fname,
          lname,
          phone: (formData.get("phone") as string) || "",
          photoURL: userCredential.user.photoURL || "",
          createdAt: new Date().toISOString(),
        });
      }

      await sendEmailVerification(userCredential.user);
      alert(
        "נרשמת בהצלחה! נא לאשר את כתובת האימייל שלך דרך ההודעה שנשלחה אליך.",
      );
      onClose();
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? (error as { code?: string }).code
          : "";
      setError(firebaseErrorToHebrew(code as string));
      console.error(error);
    }
  };

  return (
    <AdjustableDialog
      width="w-[90vw] max-w-[400px] sm:max-w-[880px] sm:w-[880px]"
      height="h-auto min-h-[600px] sm:h-[835px]"
      isOpen={isOpen}
      onClose={onClose}
      heading="הירשם"
      description="הירשם בכדי לקנות ולמכור כרטיסים"
    >
      <form
        className="grid place-items-center grid-cols-2 w-full px-4 sm:px-0 sm:w-[456px] gap-x-3 sm:gap-x-7"
        onChange={(e) => {
          const form = e.currentTarget;
          const button = document.getElementById(
            "submitButton",
          ) as HTMLButtonElement;
          if (button) {
            button.disabled = !form.checkValidity();
          }
        }}
        onSubmit={handleSubmit}
      >
        <CustomInput
          id="email"
          name="email"
          type="email"
          placeholder="דואר אלקטרוני"
          width="sm:w-[456px] w-full"
          className="col-span-2 sm:mt-10 mt-6"
          required={true}
        />
        <CustomInput
          id="phone"
          name="phone"
          type="phone"
          pattern="^\d{10}$"
          placeholder="מספר טלפון"
          width="sm:w-[456px] w-full"
          className="col-span-2 sm:mt-6 mt-4"
          required={true}
        />
        <CustomInput
          id="fname"
          name="fname"
          type="text"
          required={true}
          placeholder="שם פרטי"
          width="sm:w-[212px] w-full"
          className="sm:mt-10 mt-4"
          pattern="^\S+$"
        />
        <CustomInput
          id="lname"
          name="lname"
          type="text"
          placeholder="שם משפחה"
          width="sm:w-[212px] w-full"
          className="sm:mt-10 mt-4"
          required={true}
          pattern="^\S+$"
        />
        <CustomInput
          id="password"
          name="password"
          type="password"
          placeholder="סיסמא"
          width="sm:w-[212px] w-full"
          className="sm:mt-6 mt-4"
          required={true}
        />
        <CustomInput
          id="re-password"
          name="re-password"
          type="password"
          placeholder="אשר סיסמא"
          width="sm:w-[212px] w-full"
          className="sm:mt-6 mt-4"
          required={true}
        />

        {error && (
          <div className="col-span-2 text-red-600 text-center pt-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          id="submitButton"
          className="btn rounded-md w-full sm:w-[456px] h-[44px] sm:h-[48px] min-h-0 sm:mt-10 mt-4 btn-secondary bg-primary text-white text-base font-semibold col-span-2 disabled:bg-secondary disabled:text-white"
          disabled
        >
          הירשם
        </button>

        <div className="col-span-2 p-3 w-full">
          <CheckBox text="אני מאשר את תנאי השימוש" required={true} />
        </div>
      </form>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full sm:w-[456px] h-[44px] flex items-center justify-center bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 mt-3 hover:bg-gray-50 transition-colors px-4"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 48 48"
          className="absolute mr-32"
        >
          <g>
            <path
              fill="#4285F4"
              d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.82 2.36 30.27 0 24 0 14.82 0 6.73 5.06 2.69 12.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.43c-.54 2.91-2.18 5.38-4.66 7.04l7.2 5.6C43.98 37.09 46.1 31.33 46.1 24.55z"
            />
            <path
              fill="#FBBC05"
              d="M10.67 28.64A14.5 14.5 0 019.5 24c0-1.6.27-3.14.75-4.64l-7.98-6.2A23.97 23.97 0 000 24c0 3.77.9 7.34 2.49 10.48l8.18-6.34z"
            />
            <path
              fill="#EA4335"
              d="M24 48c6.27 0 11.53-2.07 15.37-5.62l-7.2-5.6c-2.01 1.35-4.59 2.16-8.17 2.16-6.38 0-11.87-3.59-14.33-8.8l-8.18 6.34C6.73 42.94 14.82 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </g>
        </svg>
        הירשם עם Google
      </button>

      <LoginRegisterButtons
        className="sm:mt-14 mt-8 pb-4"
        redButton="הירשם"
        grayButton="התחבר"
        onRedClick={() => {}} // Already on signup, do nothing
        onGrayClick={onSwitchToLogin}
        activeButton="red" // הירשם is active on signup dialog
      />
    </AdjustableDialog>
  );
};

export default SignUpDialog;
