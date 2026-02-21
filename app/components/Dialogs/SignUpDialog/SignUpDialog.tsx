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

  const handleGoogleSignUp = async () => {
    setError("");
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      let fname = "";
      let lname = "";
      if (user.displayName) {
        const parts = user.displayName.split(" ");
        fname = parts[0] || "";
        lname = parts.slice(1).join(" ") || "";
      }
      if (db) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: `${fname} ${lname}`,
      });

      if (db) {
        const userRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userRef, {
          email,
          fname,
          lname,
          phone: formData.get("phone") as string,
          displayName: `${fname} ${lname}`,
          createdAt: new Date().toISOString(),
        });
      }

      await sendEmailVerification(userCredential.user);
      alert(
        "נרשמת בהצלחה! נא לאשר את כתובת האימייל שלך דרך ההודעה שנשלחה אליך."
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
            "submitButton"
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

      <div className="w-full px-4 sm:px-0 sm:w-[456px] mt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">או</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button
          type="button"
          className="btn w-full h-[44px] sm:h-[48px] min-h-0 rounded-md border border-gray-300 bg-white text-gray-700 text-base font-semibold hover:bg-gray-50"
          onClick={handleGoogleSignUp}
        >
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          הירשם עם Google
        </button>
      </div>

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
