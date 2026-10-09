"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { isAdminUser } from "@/lib/isAdminClient";
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

// Lazy-load dialogs - they are heavy and only needed on user interaction
const AuthDialog = dynamic(
  () => import("../Dialogs/AuthDialog/AuthDialog"),
  { ssr: false },
);
const ProfileDialog = dynamic(
  () => import("../Dialogs/ProfileDialog/ProfileDialog"),
  { ssr: false },
);
const UploadTicketDialog = dynamic(
  () => import("../Dialogs/UploadTicketDialog/UploadTicketDialog"),
  { ssr: false },
);

const NavBar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [navIsAdmin, setNavIsAdmin] = useState(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "signup">("login");
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [pendingFavoritesRedirect, setPendingFavoritesRedirect] =
    useState(false);
  const [pendingMyTicketsRedirect, setPendingMyTicketsRedirect] =
    useState(false);
  const [pendingMyListingsRedirect, setPendingMyListingsRedirect] =
    useState(false);

  let closeTimeout: NodeJS.Timeout;
  let adminCloseTimeout: NodeJS.Timeout;
  const router = useRouter();

  // Admin nav visibility follows the unforgeable `admin` custom claim (same
  // signal the server gates on), resolved from the token in the auth effect
  // below — never a hardcoded email list.
  const isAdmin = navIsAdmin;

  useEffect(() => {
    if (!hasValidConfig) {
      // Firebase not configured, skip auth setup
      return;
    }

    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      isAdminUser(firebaseUser).then(setNavIsAdmin);
    });
    return () => unsubscribe();
  }, []);

  const openLogin = () => { setAuthDialogMode("login"); setAuthDialogOpen(true); };
  const openSignup = () => { setAuthDialogMode("signup"); setAuthDialogOpen(true); };

  useEffect(() => {
    if (user && pendingFavoritesRedirect) {
      setPendingFavoritesRedirect(false);
      setAuthDialogOpen(false);
      router.push("/Favorites");
    }
  }, [user, pendingFavoritesRedirect, router]);

  useEffect(() => {
    if (user && pendingMyTicketsRedirect) {
      setPendingMyTicketsRedirect(false);
      setAuthDialogOpen(false);
      router.push("/MyTickets");
    }
  }, [user, pendingMyTicketsRedirect, router]);

  useEffect(() => {
    if (user && pendingMyListingsRedirect) {
      setPendingMyListingsRedirect(false);
      setAuthDialogOpen(false);
      router.push("/MyListings");
    }
  }, [user, pendingMyListingsRedirect, router]);

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
    router.refresh();
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
                <Link
                  href={user ? "/MyTickets" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setPendingMyTicketsRedirect(true);
                      openLogin();
                    }
                  }}
                >
                  <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-gray-100 cursor-pointer">
                    אירועים קרובים
                  </div>
                </Link>
                <Link
                  href={user ? "/MyListings" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setPendingMyListingsRedirect(true);
                      openLogin();
                    }
                  }}
                >
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
                  <Link href="/Admin/venue-providers">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                     ניהול ספקים
                    </div>
                  </Link>
                  <Link href="/Admin/users">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      ניהול משתמשים
                    </div>
                  </Link>
                  <Link href="/Admin/EarlyAccess">
                    <div className="px-4 py-2 text-right text-text-medium leading-7 hover:bg-purple-100 cursor-pointer">
                      הרשמות מוקדמות
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
                  openLogin();
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
                onClick={openSignup}
              >
                הירשם
              </button>
              <button
                className="hidden sm:flex btn btn-primary w-24 text-gray-50 text-text-large font-normal"
                onClick={openLogin}
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
                openLogin();
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


      {/* Dialogs */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialMode={authDialogMode}
      />
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
      <UploadTicketDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      />


    </>
  );
};

export default NavBar;
