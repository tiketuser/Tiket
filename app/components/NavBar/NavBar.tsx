"use client";

import Image from "next/image";
import React from "react";

import HeartIcon from "../../../public/images/NavBar/Heart.svg";
import Arrow from "../../../public/images/Home Page/Web/Arrow.svg";
import ProfileButton from "../../../public/images/Home Page/ProfileButton.svg";

import LoginDialog from "../../components/Dialogs/LoginDialog/LoginDialog";
import SignUpDialog from "../Dialogs/SignUpDialog/SignUpDialog";
import Link from "next/link";

const NavBar = () => {
  const [isLoginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [isSignUpDialogOpen, setSignUpDialogOpen] = React.useState(false);

  return (
    <>
      <div
        dir="ltr"
        className="relative navbar bg-white flex justify-between items-center px-4 z-50 h-20"
      >
        {/* Logo */}
        <Link href="/">
          <h1 className="text-text-large font-bold">Tiket</h1>
        </Link>

        {/* Right Side */}
        <div className="flex space-x-6">
          {/* Tickets Button */}
          <Link href="/MyTickets">
            <button className="flex items-center space-x-2 rtl:space-x-reverse hover:text-gray-600 focus:outline-none">
              <Image src={Arrow} alt="Arrow" />
              <span className="text-text-large font-normal">הכרטיסים שלי</span>
            </button>
          </Link>

          {/* Like Button */}
          <Link href="/Favorites">
            <button
              role="btn"
              className="btn btn-ghost btn-circle avatar hover:bg-red-200"
            >
              <Image
                src={HeartIcon}
                alt="heart icon"
                style={{ width: "25px", height: "25px", overflow: "visible" }}
              />
            </button>
          </Link>
          {/* Hide These in Mobile */}
          <button
            className="hidden sm:flex btn btn-secondary border-primary border-[2px] bg-white w-24 text-primary text-text-large font-normal"
            onClick={() => setSignUpDialogOpen(true)}
          >
            הירשם
          </button>
          <button
            className="hidden sm:flex btn btn-primary w-24 text-gray-50 text-text-large font-normal"
            onClick={() => setLoginDialogOpen(true)}
          >
            התחבר
          </button>

          <button
            tabIndex={0}
            role="btn"
            className="hidden sm:flex btn btn-ghost btn-circle avatar hover:bg-red-100"
          >
            <Image
              src={ProfileButton}
              alt="Profile"
              style={{ width: "24px", height: "36px", overflow: "visible" }}
            />
          </button>
        </div>
      </div>
      <SignUpDialog
        isOpen={isSignUpDialogOpen}
        onClose={() => setSignUpDialogOpen(false)}
      />
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  );
};

export default NavBar;
