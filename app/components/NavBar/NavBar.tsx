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
import { useRouter, usePathname } from "next/navigation";
import { hasValidConfig, db } from "../../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
} from "firebase/firestore";

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
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "signup">("login");
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMyTicketsPopoverOpen, setMyTicketsPopoverOpen] = useState(false);
  const [isNavVisible, setNavVisible] = useState(true);
  const [pendingFavoritesRedirect, setPendingFavoritesRedirect] =
    useState(false);
  const [pendingMyTicketsRedirect, setPendingMyTicketsRedirect] =
    useState(false);
  const [pendingMyListingsRedirect, setPendingMyListingsRedirect] =
    useState(false);
  const [pendingSellRedirect, setPendingSellRedirect] = useState(false);
  const [myTicketsCount, setMyTicketsCount] = useState(0);
  const [myListingsCount, setMyListingsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [seenTickets, setSeenTickets] = useState(() =>
    typeof window !== "undefined" ? parseInt(localStorage.getItem("tiket_seen_mytickets") || "0") : 0
  );
  const [seenListings, setSeenListings] = useState(() =>
    typeof window !== "undefined" ? parseInt(localStorage.getItem("tiket_seen_mylistings_sold") || "0") : 0
  );
  const [seenFavorites, setSeenFavorites] = useState(() =>
    typeof window !== "undefined" ? parseInt(localStorage.getItem("tiket_seen_favorites") || "0") : 0
  );
  const hasUnseenTickets = myTicketsCount > seenTickets;
  const hasUnseenListings = myListingsCount > seenListings;
  const hasUnseenFavorites = favoritesCount > seenFavorites;

  let closeTimeout: NodeJS.Timeout;
  let adminCloseTimeout: NodeJS.Timeout;
  const router = useRouter();
  const pathname = usePathname();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  // Hide bottom nav on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY && currentY > 50) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  useEffect(() => {
    if (user && pendingSellRedirect) {
      setPendingSellRedirect(false);
      setAuthDialogOpen(false);
      setUploadDialogOpen(true);
    }
  }, [user, pendingSellRedirect]);

  // Auto-clear dots when user navigates to the relevant page
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    if (pathname === "/Favorites") {
      localStorage.setItem(`tiket_seen_favorites_${uid}`, favoritesCount.toString());
      setSeenFavorites(favoritesCount);
    } else if (pathname === "/MyTickets") {
      localStorage.setItem(`tiket_seen_mytickets_${uid}`, myTicketsCount.toString());
      setSeenTickets(myTicketsCount);
    } else if (pathname === "/MyListings") {
      localStorage.setItem(`tiket_seen_mylistings_sold_${uid}`, myListingsCount.toString());
      setSeenListings(myListingsCount);
    }
  }, [pathname, favoritesCount, myTicketsCount, myListingsCount, user]);

  // Fetch badge counts when user logs in; listen in real-time for changes
  useEffect(() => {
    if (!user || !db) return;
    const uid = user.uid;
    // Per-user keys so different accounts don't share counts
    const keyTx   = `tiket_seen_mytickets_${uid}`;
    const keyList  = `tiket_seen_mylistings_sold_${uid}`;
    const keyFav   = `tiket_seen_favorites_${uid}`;
    let txFirst = true, listFirst = true, userFirst = true;

    const unsubTx = onSnapshot(
      query(collection(db as any, "transactions"), where("buyerId", "==", uid), where("status", "==", "completed")),
      (snap) => {
        const count = snap.size;
        setMyTicketsCount(count);
        if (txFirst) {
          txFirst = false;
          // Baseline: if no stored value, treat current count as already-seen
          const stored = localStorage.getItem(keyTx);
          if (stored === null) { localStorage.setItem(keyTx, count.toString()); setSeenTickets(count); }
          else { setSeenTickets(parseInt(stored)); }
        }
      },
      () => {},
    );
    const unsubList = onSnapshot(
      query(collection(db as any, "tickets"), where("sellerId", "==", uid), where("status", "==", "sold")),
      (snap) => {
        const count = snap.size;
        setMyListingsCount(count);
        if (listFirst) {
          listFirst = false;
          const stored = localStorage.getItem(keyList);
          if (stored === null) { localStorage.setItem(keyList, count.toString()); setSeenListings(count); }
          else { setSeenListings(parseInt(stored)); }
        }
      },
      () => {},
    );
    const unsubUser = onSnapshot(
      doc(db as any, "users", uid),
      (snap) => {
        const count = (snap.data()?.favorites || []).length;
        setFavoritesCount(count);
        if (userFirst) {
          userFirst = false;
          const stored = localStorage.getItem(keyFav);
          if (stored === null) { localStorage.setItem(keyFav, count.toString()); setSeenFavorites(count); }
          else { setSeenFavorites(parseInt(stored)); }
        }
      },
      () => {},
    );
    return () => { unsubTx(); unsubList(); unsubUser(); };
  }, [user]);

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
    // Reset all badge counts and seen states so no dots bleed to the next user
    setMyTicketsCount(0); setMyListingsCount(0); setFavoritesCount(0);
    setSeenTickets(0); setSeenListings(0); setSeenFavorites(0);
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
                if (!user) { e.preventDefault(); setPendingMyTicketsRedirect(true); openLogin(); }
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
                if (!user) { e.preventDefault(); setPendingMyListingsRedirect(true); openLogin(); }
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
                if (!user) { e.preventDefault(); setPendingFavoritesRedirect(true); openLogin(); }
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
                if (user) { setProfileDialogOpen(true); } else { openLogin(); }
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
                    onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                  >
                    התחבר
                  </button>
                  <button
                    className="flex-1 btn border-2 border-primary bg-white text-primary text-base font-semibold h-11 min-h-0 rounded-xl"
                    onClick={() => { openSignup(); setMobileMenuOpen(false); }}
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

      {/* My Tickets popover backdrop */}
      {isMyTicketsPopoverOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setMyTicketsPopoverOpen(false)}
        />
      )}

      {/* Bottom Navigation Bar — mobile only */}
      <nav
        dir="rtl"
        className={`
          lg:hidden fixed bottom-0 left-0 right-0 z-50
          transition-transform duration-300 ease-in-out
          ${isAuthDialogOpen || isProfileDialogOpen || isUploadDialogOpen || !isNavVisible
            ? "translate-y-full"
            : "translate-y-0"}
        `}
      >
        {/* My Tickets popover */}
        <div
          className={`
            absolute bottom-full left-0 right-0 flex justify-center
            transition-all duration-200 ease-in-out mb-3
            ${isMyTicketsPopoverOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}
          `}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-52">
            <Link
              href={user ? "/MyTickets" : "#"}
              onClick={(e) => {
                setMyTicketsPopoverOpen(false);
                if (!user) { e.preventDefault(); setPendingMyTicketsRedirect(true); openLogin(); }
                else { localStorage.setItem(`tiket_seen_mytickets_${user.uid}`, myTicketsCount.toString()); setSeenTickets(myTicketsCount); }
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a2.5 2.5 0 0 0 0-5V9z"/>
                </svg>
                <span className="text-sm font-medium flex-1">אירועים קרובים</span>
                {hasUnseenTickets && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
              </div>
            </Link>
            <Link
              href={user ? "/MyListings" : "#"}
              onClick={(e) => {
                setMyTicketsPopoverOpen(false);
                if (!user) { e.preventDefault(); setPendingMyListingsRedirect(true); openLogin(); }
                else { localStorage.setItem(`tiket_seen_mylistings_sold_${user.uid}`, myListingsCount.toString()); setSeenListings(myListingsCount); }
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
                </svg>
                <span className="text-sm font-medium flex-1">המודעות שלי</span>
                {hasUnseenListings && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
              </div>
            </Link>
          </div>
        </div>

        {/* Bar itself */}
        <div className="relative bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {/* Sliding active indicator
               JSX order (LTR flex positions): Home=0, Favorites=1, Sell=2, MyTickets=3, Profile=4
               dir="rtl" flips visual order but CSS left still measures from physical left.
               With RTL flex: Home renders rightmost → physical left = 80%, etc.
               So physical-left index: Profile=0, MyTickets=1, Sell=2, Favorites=3, Home=4 */}
          {(() => {
            const physicalIndex =
              pathname === "/" ? 4
              : pathname === "/Favorites" ? 3
              : pathname === "/MyTickets" || pathname === "/MyListings" ? 1
              : -1;
            return (
              <span
                className="absolute top-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
                style={{
                  left: `${physicalIndex * 20}%`,
                  width: "20%",
                  opacity: physicalIndex === -1 ? 0 : 1,
                }}
              />
            );
          })()}
          <div className="flex items-stretch h-16">

            {/* Home */}
            <Link href="/" className="flex flex-col items-center justify-center gap-1 flex-1 group transition-transform duration-150 active:scale-90" onClick={() => setMyTicketsPopoverOpen(false)}>
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-all duration-200 ${pathname === "/" ? "stroke-primary scale-110" : "stroke-gray-500 group-active:stroke-primary"}`}
              >
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
              <span className={`text-[10px] font-medium transition-all duration-200 ${pathname === "/" ? "text-primary" : "text-gray-500"}`}>בית</span>
            </Link>

            {/* Favorites */}
            <Link
              href={user ? "/Favorites" : "#"}
              className="flex flex-col items-center justify-center gap-1 flex-1 group transition-transform duration-150 active:scale-90"
              onClick={(e) => {
                setMyTicketsPopoverOpen(false);
                if (!user) { e.preventDefault(); setPendingFavoritesRedirect(true); openLogin(); }
                else { localStorage.setItem(`tiket_seen_favorites_${user.uid}`, favoritesCount.toString()); setSeenFavorites(favoritesCount); }
              }}
            >
              <div className="relative">
                <svg
                  width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-all duration-200 ${pathname === "/Favorites" ? "stroke-primary scale-110" : "stroke-gray-500 group-active:stroke-primary"}`}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {hasUnseenFavorites && (
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-200 ${pathname === "/Favorites" ? "text-primary" : "text-gray-500"}`}>מועדפים</span>
            </Link>

            {/* Sell — center prominent */}
            <button
              className="flex flex-col items-center justify-center gap-1 flex-1 group relative transition-transform duration-150 active:scale-90 before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-px before:bg-gray-300 after:absolute after:right-0 after:top-1/4 after:h-1/2 after:w-px after:bg-gray-300"
              onClick={() => {
                setMyTicketsPopoverOpen(false);
                if (!user) { setPendingSellRedirect(true); openLogin(); }
                else { setUploadDialogOpen(true); }
              }}
            >
              <span className="text-base font-bold text-primary transition-opacity duration-150 group-active:opacity-60">מכירה</span>
            </button>

            {/* My Tickets */}
            <button
              className="flex flex-col items-center justify-center gap-1 flex-1 group relative transition-transform duration-150 active:scale-90"
              onClick={() => setMyTicketsPopoverOpen((prev) => !prev)}
            >
              <div className="relative">
                <svg
                  width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-all duration-200 ${isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "stroke-primary scale-110" : "stroke-gray-500 group-active:stroke-primary"}`}
                >
                  <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a2.5 2.5 0 0 0 0-5V9z"/>
                </svg>
                {(hasUnseenTickets || hasUnseenListings) && (
                  <span className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-200 ${isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "text-primary" : "text-gray-500"}`}>
                הכרטיסים שלי
              </span>
            </button>

            {/* Profile */}
            <button
              className="flex flex-col items-center justify-center gap-1 flex-1 group transition-transform duration-150 active:scale-90"
              onClick={() => {
                setMyTicketsPopoverOpen(false);
                if (user) { setProfileDialogOpen(true); }
                else { openLogin(); }
              }}
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="stroke-gray-500 transition-all duration-200 group-active:stroke-primary"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-[10px] font-medium text-gray-500 transition-all duration-200 group-active:text-primary">פרופיל</span>
            </button>

          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;
