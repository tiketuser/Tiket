"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
const LoginDialog = dynamic(
  () => import("../../components/Dialogs/LoginDialog/LoginDialog"),
  { ssr: false },
);
const SignUpDialog = dynamic(
  () => import("../Dialogs/SignUpDialog/SignUpDialog"),
  { ssr: false },
);
const ProfileDialog = dynamic(
  () => import("../Dialogs/ProfileDialog/ProfileDialog"),
  { ssr: false },
);

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
  const [pendingMyTicketsRedirect, setPendingMyTicketsRedirect] =
    useState(false);
  const [pendingMyListingsRedirect, setPendingMyListingsRedirect] =
    useState(false);
  let closeTimeout: NodeJS.Timeout;
  let adminCloseTimeout: NodeJS.Timeout;
  const router = useRouter();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

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
      setLoginDialogOpen(false);
      router.push("/Favorites");
    }
  }, [user, pendingFavoritesRedirect, router]);

  useEffect(() => {
    if (user && pendingMyTicketsRedirect) {
      setPendingMyTicketsRedirect(false);
      setLoginDialogOpen(false);
      router.push("/MyTickets");
    }
  }, [user, pendingMyTicketsRedirect, router]);

  useEffect(() => {
    if (user && pendingMyListingsRedirect) {
      setPendingMyListingsRedirect(false);
      setLoginDialogOpen(false);
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
    router.refresh(); // Refresh server data without full page reload
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
                <Link
                  href={user ? "/MyTickets" : "#"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setPendingMyTicketsRedirect(true);
                      setLoginDialogOpen(true);
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
                      setLoginDialogOpen(true);
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
          className="lg:hidden fixed inset-0 top-16 bg-white z-40 flex flex-col"
          dir="rtl"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 space-y-1">

            {/* My Tickets group */}
            <p className="text-lg font-bold px-3 pb-1">הכרטיסים שלי</p>

            <Link
              href={user ? "/MyTickets" : "#"}
              onClick={(e) => {
                if (!user) { e.preventDefault(); setPendingMyTicketsRedirect(true); setLoginDialogOpen(true); }
                setMobileMenuOpen(false);
              }}
            >
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                {/* Ticket icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a2.5 2.5 0 0 0 0-5V9z"/>
                </svg>
                <span className="text-base font-medium">אירועים קרובים</span>
              </div>
            </Link>

            <Link
              href={user ? "/MyListings" : "#"}
              onClick={(e) => {
                if (!user) { e.preventDefault(); setPendingMyListingsRedirect(true); setLoginDialogOpen(true); }
                setMobileMenuOpen(false);
              }}
            >
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                {/* List icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
                </svg>
                <span className="text-base font-medium">המודעות שלי</span>
              </div>
            </Link>

            <div className="h-px bg-gray-100 my-2" />

            {/* Favorites */}
            <Link
              href={user ? "/Favorites" : "#"}
              onClick={(e) => {
                if (!user) { e.preventDefault(); setPendingFavoritesRedirect(true); setLoginDialogOpen(true); }
                setMobileMenuOpen(false);
              }}
            >
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                {/* Heart icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="text-base font-medium">המועדפים שלי</span>
              </div>
            </Link>

            {/* Profile */}
            <button
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) { setProfileDialogOpen(true); } else { setLoginDialogOpen(true); }
              }}
            >
              {/* Person icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-base font-medium">פרופיל</span>
            </button>

            {/* Auth buttons — below Profile, only when logged out */}
            {!user && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex gap-2 px-1">
                  <button
                    className="flex-1 btn btn-primary text-white text-base font-semibold h-11 min-h-0 rounded-xl"
                    onClick={() => { setLoginDialogOpen(true); setMobileMenuOpen(false); }}
                  >
                    התחבר
                  </button>
                  <button
                    className="flex-1 btn border-2 border-primary bg-white text-primary text-base font-semibold h-11 min-h-0 rounded-xl"
                    onClick={() => { setSignUpDialogOpen(true); setMobileMenuOpen(false); }}
                  >
                    הירשם
                  </button>
                </div>
              </>
            )}

            {/* Logout — only when logged in */}
            {user && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <button
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-primary"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  {/* Logout icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span className="text-base font-medium">התנתק</span>
                </button>
              </>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest px-3 pb-1">ניהול</p>
                {[
                  { href: "/Admin", label: "יצירת אירועים" },
                  { href: "/edit-events", label: "עריכת אירועים" },
                  { href: "/manage-categories", label: "ניהול קטגוריות" },
                  { href: "/manage-themes", label: "צבע קטגוריות" },
                  { href: "/approve-tickets", label: "אישור כרטיסים" },
                  { href: "/regenerate-tickets", label: "יצירת כרטיסים" },
                  { href: "/manage-artists", label: "ניהול אמנים" },
                  { href: "/diagnostic", label: "אבחון מערכת" },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center px-3 py-3 rounded-xl hover:bg-purple-50 active:bg-purple-100 transition-colors">
                      <span className="text-base text-purple-700">{label}</span>
                    </div>
                  </Link>
                ))}
              </>
            )}
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
