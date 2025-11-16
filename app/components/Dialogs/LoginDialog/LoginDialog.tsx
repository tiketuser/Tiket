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
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
}) => {
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

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
      window.location.reload(); // Refresh after login
    } catch {
      setError("פרטי ההתחברות שגויים.");
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
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

      // Check if user doc exists
      if (!db) {
        throw new Error("Database not initialized");
      }
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
          // Add more fields as needed
        });
      }

      setError("");
      onClose();
      window.location.reload(); // Refresh after Google login
    } catch {
      setError("התחברות עם Google נכשלה.");
    }
  };

  return (
    <AdjustableDialog
      width="w-[90vw] max-w-[400px] sm:max-w-[880px] sm:w-[880px]"
      height="h-auto min-h-[500px] sm:h-[675px]"
      heading="התחברות"
      description="התחבר בכדי לקנות ולמכור כרטיסים"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form
        className="flex flex-col items-center w-full px-4 sm:px-0"
        onSubmit={handleEmailSubmit}
      >
        <CustomInput
          id="email"
          name="email"
          required={true}
          placeholder="דואר אלקטרוני / מספר טלפון"
          className="sm:pt-9 pt-6"
          width="sm:w-[456px] w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <CustomInput
          id="password"
          name="password"
          required={true}
          type="password"
          placeholder="סיסמא"
          className="pt-4 sm:pt-6"
          width="sm:w-[456px] w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="text-red-600 text-center pt-3 text-sm">{error}</div>
        )}

        <div className="text-center mt-3 mb-4 w-full">
          <a href="#" className="text-sm text-primary underline">
            שכחתי סיסמא
          </a>
        </div>

        <button
          className="btn rounded-md h-[44px] min-h-0 w-full sm:w-[456px] btn-primary text-base font-semibold disabled:bg-secondary disabled:text-white"
          type="submit"
          disabled={!email.trim() || !password.trim()}
        >
          התחבר
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full sm:w-[456px] h-[44px] flex items-center justify-center bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 mt-3 hover:bg-gray-50 transition-colors"
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
          המשך עם Google
        </button>
      </form>
      <LoginRegisterButtons
        className="sm:pt-14 pt-8 pb-4"
        redButton="הירשם"
        grayButton="התחבר"
        onRedClick={onSwitchToSignup}
        onGrayClick={() => {}} // Already on login, do nothing
        activeButton="gray" // התחבר is active on login dialog
      />
    </AdjustableDialog>
  );
};

export default LoginDialog;
