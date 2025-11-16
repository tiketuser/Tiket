"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAuth,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { hasValidConfig } from "../../../firebase";

import HeartIcon from "../../../public/images/NavBar/Heart.svg";
import Arrow from "../../../public/images/Home Page/Web/Arrow.svg";
import ProfileButton from "../../../public/images/Home Page/ProfileButton.svg";

import LoginDialog from "../../components/Dialogs/LoginDialog/LoginDialog";
import SignUpDialog from "../Dialogs/SignUpDialog/SignUpDialog";
import ProfileDialog from "../Dialogs/ProfileDialog/ProfileDialog";

const NavBar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isSignUpDialogOpen, setSignUpDialogOpen] = useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingFavoritesRedirect, setPendingFavoritesRedirect] =
    useState(false);
  let closeTimeout: NodeJS.Timeout;
  let adminCloseTimeout: NodeJS.Timeout;
  const router = useRouter();

  // Check if user is admin
  const isAdmin =
    user?.email === "tiketbizzz@gmail.com" || user?.email === "admin@tiket.com";

  useEffect(() => {
    if (!hasValidConfig) {
      // Firebase not configured, skip auth setup
      return;
    }

    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && pendingFavoritesRedirect) {
      setPendingFavoritesRedirect(false);
      setLoginDialogOpen(false); // This will close the dialog after login is confirmed
      router.push("/Favorites");
    }
  }, [user, pendingFavoritesRedirect, router]);

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

  const handleAdminDropdownToggle = () => {
    setAdminDropdownOpen((prev) => !prev);
  };

  const handleAdminMouseLeave = () => {
    adminCloseTimeout = setTimeout(() => {
      setAdminDropdownOpen(false);
    }, 200);
  };

  const handleAdminMouseEnter = () => {
    clearTimeout(adminCloseTimeout);
    setAdminDropdownOpen(true);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
    window.location.reload(); // Refresh the page after logout
  };

  return (
    <>
      <div
        dir="ltr"
        className="relative navbar bg-white flex justify-between items-center px-4 lg:px-8 z-50 h-16 md:h-20 shadow-sm"
      >
        {/* Logo */}
        <Link href="/">
          <h1 className="text-text-regular md:text-text-large font-bold">
            Tiket
          </h1>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span
            className={`w-6 h-0.5 bg-black transition-all ${
              isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`w-6 h-0.5 bg-black transition-all ${
              isMobileMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`w-6 h-0.5 bg-black transition-all ${
              isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>

        {/* Desktop Menu - Right Side */}
        <div className="hidden lg:flex space-x-6 relative">
          {/* Dropdown Parent */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Main Button */}
            <button
              className="flex items-center gap-2 hover:text-gray-600 focus:outline-none relative"
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

          {/* Admin Dropdown - Only visible to admin */}
          {isAdmin && (
            <div
              className="relative"
              onMouseEnter={handleAdminMouseEnter}
              onMouseLeave={handleAdminMouseLeave}
            >
              {/* Admin Button */}
              <button
                className="flex items-center gap-2 hover:text-purple-600 focus:outline-none relative"
                onPointerDown={handleAdminDropdownToggle}
              >
                <Image src={Arrow} alt="Arrow" />
                <span className="text-text-large font-normal text-purple-600">
                  ניהול
                </span>
              </button>

              {/* Admin Dropdown Content */}
              {isAdminDropdownOpen && (
                <div
                  className="absolute right-0 w-56 mt-2 bg-purple-50 shadow-xxlarge rounded-lg z-50 border-2 border-purple-200"
                  onMouseEnter={handleAdminMouseEnter}
                  onMouseLeave={handleAdminMouseLeave}
                >
                  <div className="px-4 py-2 text-right text-text-small font-bold text-purple-800 border-b-2 border-purple-200">
                    פאנל ניהול
                  </div>
                  <Link href="/Admin">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      יצירת אירועים
                    </div>
                  </Link>
                  <Link href="/edit-events">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      עריכת אירועים
                    </div>
                  </Link>
                  <Link href="/manage-categories">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      ניהול קטגוריות
                    </div>
                  </Link>
                  <Link href="/manage-themes">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      צבע קטגוריות
                    </div>
                  </Link>
                  <Link href="/approve-tickets">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      אישור כרטיסים
                    </div>
                  </Link>
                  <Link href="/regenerate-tickets">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      יצירת כרטיסים
                    </div>
                  </Link>
                  <Link href="/Admin/pnl-calculator">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      PNL מחשבון 
                    </div>
                  </Link>
                  {/* <Link href="/fix-dates">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      תיקון תאריכים
                    </div>
                  </Link> */}
                  <Link href="/manage-artists">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      ניהול אמנים
                    </div>
                  </Link>

                  <Link href="/diagnostic">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer border-t border-purple-200">
                      אבחון מערכת
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Like Button */}
          <Link href={user ? "/Favorites" : "#"}>
            <button
              role="btn"
              className="btn btn-ghost btn-circle avatar hover:bg-red-200"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  setPendingFavoritesRedirect(true);
                  setLoginDialogOpen(true);
                }
              }}
            >
              <Image
                src={HeartIcon}
                alt="heart icon"
                style={{ width: "25px", height: "25px", overflow: "visible" }}
              />
            </button>
          </Link>

          {/* Sign Up & Login */}
          {user ? (
            <button
              className=" btn btn-primary w-24 text-gray-50 text-text-large font-normal"
              onClick={handleLogout}
            >
              התנתק
            </button>
          ) : (
            <>
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
            </>
          )}

          {/* Profile Icon */}
          <button
            tabIndex={0}
            role="btn"
            className="hidden sm:flex btn btn-ghost btn-circle avatar hover:bg-red-100"
            onClick={() => {
              if (user) {
                setProfileDialogOpen(true);
              } else {
                setLoginDialogOpen(true);
              }
            }}
          >
            <Image
              src={ProfileButton}
              alt="Profile"
              style={{ width: "24px", height: "36px", overflow: "visible" }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto"
          dir="rtl"
        >
          <div className="flex flex-col p-4 space-y-4">
            {/* My Tickets Section */}
            <div className="border-b pb-4">
              <h3 className="text-heading-6-desktop font-bold mb-2">
                הכרטיסים שלי
              </h3>
              <Link href="/MyTickets" onClick={() => setMobileMenuOpen(false)}>
                <div className="px-4 py-2 text-text-regular hover:bg-gray-100 rounded">
                  אירועים קרובים
                </div>
              </Link>
              <Link href="/MyListings" onClick={() => setMobileMenuOpen(false)}>
                <div className="px-4 py-2 text-text-regular hover:bg-gray-100 rounded">
                  המודעות שלי
                </div>
              </Link>
            </div>

            {/* Admin Section - Only visible to admin */}
            {isAdmin && (
              <div className="border-b pb-4">
                <h3 className="text-heading-6-desktop font-bold mb-2 text-purple-600">
                  ניהול
                </h3>
                <Link href="/Admin" onClick={() => setMobileMenuOpen(false)}>
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    יצירת אירועים
                  </div>
                </Link>
                <Link
                  href="/edit-events"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    עריכת אירועים
                  </div>
                </Link>
                <Link
                  href="/manage-categories"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    ניהול קטגוריות
                  </div>
                </Link>
                <Link
                  href="/manage-themes"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    צבע קטגוריות
                  </div>
                </Link>
                <Link
                  href="/approve-tickets"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    אישור כרטיסים
                  </div>
                </Link>
                <Link
                  href="/regenerate-tickets"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    יצירת כרטיסים
                  </div>
                </Link>
                <Link
                  href="/manage-artists"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    ניהול אמנים
                  </div>
                </Link>
                <Link
                  href="/diagnostic"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="px-4 py-2 text-text-regular hover:bg-purple-100 rounded">
                    אבחון מערכת
                  </div>
                </Link>
              </div>
            )}

            {/* Favorites */}
            <Link
              href={user ? "/Favorites" : "#"}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  setPendingFavoritesRedirect(true);
                  setLoginDialogOpen(true);
                  setMobileMenuOpen(false);
                } else {
                  setMobileMenuOpen(false);
                }
              }}
            >
              <div className="px-4 py-3 text-text-regular hover:bg-red-50 rounded flex items-center gap-2">
                <Image
                  src={HeartIcon}
                  alt="heart icon"
                  width={20}
                  height={20}
                />
                <span>המועדפים שלי</span>
              </div>
            </Link>

            {/* Profile */}
            <button
              className="px-4 py-3 text-text-regular hover:bg-gray-100 rounded flex items-center gap-2 w-full text-right"
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) {
                  setProfileDialogOpen(true);
                } else {
                  setLoginDialogOpen(true);
                }
              }}
            >
              <Image src={ProfileButton} alt="Profile" width={20} height={20} />
              <span>פרופיל</span>
            </button>

            {/* Auth Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {user ? (
                <button
                  className="btn btn-primary w-full text-gray-50 text-text-regular font-normal"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  התנתק
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary w-full text-gray-50 text-text-regular font-normal"
                    onClick={() => {
                      setLoginDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    התחבר
                  </button>
                  <button
                    className="btn btn-secondary border-primary border-[2px] bg-white w-full text-primary text-text-regular font-normal"
                    onClick={() => {
                      setSignUpDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    הירשם
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SignUpDialog
        isOpen={isSignUpDialogOpen}
        onClose={() => setSignUpDialogOpen(false)}
        onSwitchToLogin={() => {
          setSignUpDialogOpen(false);
          setTimeout(() => setLoginDialogOpen(true), 200);
        }}
      />
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onSwitchToSignup={() => {
          setLoginDialogOpen(false);
          setTimeout(() => setSignUpDialogOpen(true), 200);
        }}
      />
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </>
  );
};

export default NavBar;
