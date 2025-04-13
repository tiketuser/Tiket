"use client";

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";

import HeartIcon from "../../../public/images/NavBar/Heart.svg";
import Arrow from "../../../public/images/Home Page/Web/Arrow.svg";
import ProfileButton from "../../../public/images/Home Page/ProfileButton.svg";

import LoginDialog from "../../components/Dialogs/LoginDialog/LoginDialog";
import SignUpDialog from "../Dialogs/SignUpDialog/SignUpDialog";
import ProfileDialog from "../Dialogs/ProfileDialog/ProfileDialog";

const NavBar = () => {
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isSignUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  let closeTimeout: NodeJS.Timeout;

  const handleDropdownToggle = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  const handleMouseEnter = () => {
    clearTimeout(closeTimeout);
    setDropdownOpen(true);
  };

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
        <div className="flex space-x-6 relative">
          {/* Dropdown Parent */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Main Button */}
            <button
              className="flex items-center space-x-2 rtl:space-x-reverse hover:text-gray-600 focus:outline-none relative"
              onPointerDown={handleDropdownToggle} // ← תיקון קריטי
            >
              <Image src={Arrow} alt="Arrow" />
              <span className="text-text-large font-normal">הכרטיסים שלי</span>
            </button>

            {/* Dropdown Content */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 w-44 mt-2 bg-white shadow-xxlarge rounded-lg z-50 border border-gray-200"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Link href="/MyTickets">
                  <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-gray-100 cursor-pointer">
                    אירועים קרובים
                  </div>
                </Link>
                <Link href="/MyListings">
                  <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-gray-100 cursor-pointer">
                    המודעות שלי
                  </div>
                </Link>
              </div>
            )}
          </div>

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

          {/* Sign Up & Login */}
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

          {/* Profile Icon */}
          <button
            tabIndex={0}
            role="btn"
            className="hidden sm:flex btn btn-ghost btn-circle avatar hover:bg-red-100"
          >
            <Image
              src={ProfileButton}
              alt="Profile"
              style={{ width: "24px", height: "36px", overflow: "visible" }}
              onClick={() => setProfileDialogOpen(true)}
            />
          </button>
        </div>
      </div>

      {/* Dialogs */}
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

export default NavBar;
