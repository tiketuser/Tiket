import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import CustomInput from "../../CustomInput/CustomInput";
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";
import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose }) => {
  const [error, setError] = useState<string>("");

  // Email login handler
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
      onClose();
    } catch (err) {
      setError("פרטי ההתחברות שגויים.");
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    setError("");
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setError("");
      onClose();
    } catch (err) {
      setError("התחברות עם Google נכשלה.");
    }
  };

  return (
    <AdjustableDialog
      width="sm:w-[880px] w-[400px]"
      height="sm:h-[675px] h-[450px]"
      heading="התחבר"
      description="התחבר בכדי לקנות כרטיסים"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="flex flex-col items-center" onSubmit={handleEmailSubmit}>
        <CustomInput
          id="email"
          name="email"
          required={true}
          placeholder="דואר אלקטרוני"
          className="sm:pt-9"
          width="sm:w-[456px] w-[256px]"
        />
        <CustomInput
          id="password"
          name="password"
          required={true}
          type="password"
          placeholder="סיסמא"
          className="pt-6"
          width="sm:w-[456px] w-[256px]"
        />
        {error && <div className="text-red-600 text-center pt-4">{error}</div>}
        <button className="btn btn-primary mt-4" type="submit">
          התחבר
        </button>
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            fontWeight: 500,
            fontSize: "16px",
            color: "#3c4043",
            padding: "8px 16px",
            marginTop: "12px",
            boxShadow: "none",
            cursor: "pointer",
            gap: "8px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
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
          המשך עם Google
        </button>
      </form>
      <LoginRegisterButtons
        className="sm:pt-14"
        redButton="הירשם"
        grayButton="התחבר"
      />
    </AdjustableDialog>
  );
};

export default LoginDialog;
