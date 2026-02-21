import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";

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
        password
      );
      // Optionally update display name
      await updateProfile(userCredential.user, {
        displayName: `${fname} ${lname}`,
      });
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
