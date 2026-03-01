"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import ProfileIcon from "../../../public/images/Home Page/ProfileButton.svg";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

// Lazy-load dialogs - only needed on user interaction
const AuthDialog = dynamic(
  () => import("../Dialogs/AuthDialog/AuthDialog"),
  { ssr: false },
);
const ProfileDialog = dynamic(
  () => import("../Dialogs/ProfileDialog/ProfileDialog"),
  { ssr: false },
);

const MobileFooter = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [authDialogMode, setAuthDialogMode] = React.useState<"login" | "signup">("login");
  const [isProfileDialogOpen, setProfileDialogOpen] = React.useState(false);

  useEffect(() => {
    try {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
      });
      return () => unsubscribe();
    } catch {
      // Firebase not configured
    }
  }, []);

  if (user) return null;

  return (
    <>
      <footer className="sm:hidden bottom-0 w-full bg-transparent h-16 fixed z-20">
        {/* Profile Button */}
        <button
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg w-12 h-12 flex justify-center items-center border-2 border-primary"
          onClick={() => setProfileDialogOpen(true)}
        >
          <Image src={ProfileIcon} alt="ProfileIcon" className="scale-90" />
        </button>

        {/* Buttons Container */}
        <div className="flex h-full">
          {/* Buy Button */}
          <button
            className="flex-1 bg-primary text-white text-text-large font-normal text-center rounded-t-xl"
            onClick={() => { setAuthDialogMode("login"); setAuthDialogOpen(true); }}
          >
            התחבר
          </button>

          {/* Sell Button */}
          <button
            className="flex-1 bg-white border-2 border-primary text-primary text-text-large font-normal text-center rounded-t-xl"
            onClick={() => { setAuthDialogMode("signup"); setAuthDialogOpen(true); }}
          >
            הירשם
          </button>
        </div>
      </footer>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialMode={authDialogMode}
      />
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </>
  );
};

export default MobileFooter;
