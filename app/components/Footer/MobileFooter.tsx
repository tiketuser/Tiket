"use client";

import React from "react";
import Image from "next/image";
import ProfileIcon from "../../../public/images/Home Page/ProfileButton.svg";
import SignUpDialog from "../Dialogs/SignUpDialog/SignUpDialog";
import LoginDialog from "../Dialogs/LoginDialog/LoginDialog";
import ProfileDialog from "../Dialogs/ProfileDialog/ProfileDialog";

const MobileFooter = () => {
  const [isLoginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [isSignUpDialogOpen, setSignUpDialogOpen] = React.useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = React.useState(false);

  return (
    <>
      <footer className="sm:hidden bottom-0 w-full bg-transparent h-16 fixed">
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
            onClick={() => setLoginDialogOpen(true)}
          >
            התחבר
          </button>

          {/* Sell Button */}
          <button
            className="flex-1 bg-white border-2 border-primary text-primary text-text-large font-normal text-center rounded-t-xl"
            onClick={() => setSignUpDialogOpen(true)}
          >
            הירשם
          </button>
        </div>
      </footer>

      <SignUpDialog
        isOpen={isSignUpDialogOpen}
        onClose={() => setSignUpDialogOpen(false)}
      />
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </>
  );
};

export default MobileFooter;
