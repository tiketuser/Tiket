import React, { useState } from "react";
import Image from "next/image";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db, collection, doc, setDoc } from "../../../../firebase";

import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import CustomInput from "../../CustomInput/CustomInput";
import CheckBox from "../../CheckBox/CheckBox";
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignUpDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose }) => {
  const [error, setError] = useState<string>("");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const fname = formData.get("fname") as string;
    const lname = formData.get("lname") as string;
    const password = formData.get("password") as string;
    // You can add more fields as needed

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
      // Save extra info to Firestore (optional)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        phone,
        fname,
        lname,
        createdAt: new Date().toISOString(),
      });
      alert("ההרשמה בוצעה בהצלחה!");
      onClose();
    } catch (error: any) {
      setError(error.message || "שגיאה בשמירת הנתונים. נסה שוב.");
      console.error(error);
    }
  };

  return (
    <AdjustableDialog
      width="sm:w-[880px] w-[400px]"
      height="sm:h-[835px] h-[540px]"
      isOpen={isOpen}
      onClose={onClose}
      heading="הירשם"
      description="הירשם בכדי לקנות ולמכור כרטיסים"
    >
      <form
        className="grid place-items-center grid-cols-2 sm:w-[456px] w-[256px] gap-x-7"
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
          width="sm:w-[456px] w-[256px]"
          className="col-span-2 sm:mt-10 mt-4"
          required={true}
        />
        <CustomInput
          id="phone"
          name="phone"
          type="phone"
          pattern="^\d{10}$"
          placeholder="מספר טלפון"
          width="sm:w-[456px] w-[256px]"
          className="col-span-2 sm:mt-6 mt-4"
          required={true}
        />
        <CustomInput
          id="fname"
          name="fname"
          type="text"
          required={true}
          placeholder="שם פרטי"
          width="sm:w-[212px] w-[112px]"
          className="sm:mt-10 mt-4"
          pattern="^\S+$"
        />
        <CustomInput
          id="lname"
          name="lname"
          type="text"
          placeholder="שם משפחה"
          width="sm:w-[212px] w-[112px]"
          className="sm:mt-10 mt-4"
          required={true}
          pattern="^\S+$"
        />
        <CustomInput
          id="password"
          name="password"
          type="password"
          placeholder="סיסמא"
          width="sm:w-[212px] w-[112px]"
          className="sm:mt-6 mt-4"
          required={true}
        />
        <CustomInput
          id="re-password"
          name="re-password"
          type="password"
          placeholder="אשר סיסמא"
          width="sm:w-[212px] w-[112px]"
          className="sm:mt-6 mt-4"
          required={true}
        />

        {error && (
          <div className="col-span-2 text-red-600 text-center pt-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          id="submitButton"
          className="btn sm:w-[456px] w-[256px] sm:h-[48px] h-[32px] min-h-0 sm:mt-10 mt-4 btn-secondary bg-primary text-white text-text-regular col-span-2 disabled:bg-secondary disabled:text-white"
          disabled
        >
          הירשם
        </button>

        <div className="col-span-2 p-3">
          <CheckBox text="אני מאשר את תנאי השימוש" required={true} />
        </div>
      </form>

      <LoginRegisterButtons className="sm:mt-14" />
    </AdjustableDialog>
  );
};

export default SignUpDialog;
