"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";

import HeartIcon from "../../../public/images/NavBar/Heart.svg";
import Arrow from "../../../public/images/Home Page/Web/Arrow.svg";
import ProfileButton from "../../../public/images/Home Page/ProfileButton.svg";

const NavBar = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  let closeTimeout: NodeJS.Timeout;

  // בדיקה אם זה מסך מגע
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // פתיחה בלחיצה במובייל, וב-hover בדסקטופ
  const handleDropdownToggle = () => {
    if (isTouchDevice) {
      setDropdownOpen((prev) => !prev);
    }
  };

  // מניעת flickering על ידי הוספת delay קטן לסגירה
  const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => {
      setDropdownOpen(false);
    }, 200); // מחכה 200 מילישניות כדי למנוע סגירה מיידית
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
          {/* Dropdown Parent - מחזיק גם את הכפתור וגם את התפריט */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* כפתור ראשי */}
            <button
              className="flex items-center space-x-2 rtl:space-x-reverse hover:text-gray-600 focus:outline-none relative"
              onClick={handleDropdownToggle}
            >
              <Image src={Arrow} alt="Arrow" />
              <span className="text-text-large font-normal">הכרטיסים שלי</span>
            </button>

            {/* Dropdown Content */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 w-44 mt-2 bg-white shadow-xxlarge rounded-lg z-50 border border-gray-200"
                onMouseEnter={handleMouseEnter} // נשאר פתוח כשהעכבר בתוך התפריט
                onMouseLeave={handleMouseLeave} // מחכה 200ms לפני סגירה
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

          {/* Hide These in Mobile */}

          <Link href="/sign-up">          
            <button
              className="hidden sm:flex btn btn-secondary border-primary border-[2px] bg-white w-24 text-primary text-text-large font-normal"
            >
              הירשם
            </button>
          </Link>

          <Link href="/login">
            <button
              className="hidden sm:flex btn btn-primary w-24 text-gray-50 text-text-large font-normal"
            >
              התחבר
            </button>
          </Link>

          <Link href="/profile">
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
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavBar;
