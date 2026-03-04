"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LogIn, UserPlus, Mail, LogOut, ShieldCheck, HelpCircle, FileText, Lock } from "lucide-react";
import { cn } from "../../../lib/utils";
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
  const [hasNewFavorite, setHasNewFavorite] = useState(false);
  const hasUnseenTickets = myTicketsCount > seenTickets;
  const hasUnseenListings = myListingsCount > seenListings;
  const hasUnseenFavorites = hasNewFavorite;

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
      setHasNewFavorite(false);
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
          if (stored === null) {
            // No baseline yet — treat current count as seen
            localStorage.setItem(keyFav, count.toString());
            setSeenFavorites(count);
          } else {
            const seen = parseInt(stored);
            setSeenFavorites(seen);
            // If count is already above the stored seen (e.g. added while logged out), show dot
            if (count > seen) { setHasNewFavorite(true); }
          }
        } else {
          // Subsequent updates: compare against stored value directly (avoids stale state)
          const seen = parseInt(localStorage.getItem(keyFav) || "0");
          if (count > seen) { setHasNewFavorite(true); }
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
    setSeenTickets(0); setSeenListings(0); setSeenFavorites(0); setHasNewFavorite(false);
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
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-1">

            {/* Auth: Login + Signup (logged out) */}
            {!user && (
              <div className="flex gap-3 px-1 py-2">
                <button
                  className="flex-1 btn btn-secondary border-primary border-[2px] bg-white text-primary text-text-large font-normal"
                  onClick={() => { openSignup(); setMobileMenuOpen(false); }}
                >
                  הירשם
                </button>
                <button
                  className="flex-1 btn btn-primary text-gray-50 text-text-large font-normal"
                  onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                >
                  התחבר
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-100 my-2" />

            {/* How It Works */}
            <Link href="/HowItWorks" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <HelpCircle size={20} className="text-gray-500 shrink-0" />
                <span className="text-base font-medium">איך זה עובד?</span>
              </div>
            </Link>

            {/* Contact Us */}
            <Link href="/ContactUs" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <Mail size={20} className="text-gray-500 shrink-0" />
                <span className="text-base font-medium">צור קשר</span>
              </div>
            </Link>

            <div className="h-px bg-gray-100 my-2" />

            {/* Terms & Privacy */}
            <Link href="/Terms" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <FileText size={20} className="text-gray-500 shrink-0" />
                <span className="text-base font-medium">תנאי שימוש</span>
              </div>
            </Link>
            <Link href="/Privacy" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <Lock size={20} className="text-gray-500 shrink-0" />
                <span className="text-base font-medium">מדיניות פרטיות</span>
              </div>
            </Link>

            {/* Logout (logged in) */}
            {user && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <button
                  className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-red-500"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  <LogOut size={20} className="shrink-0" />
                  <span className="text-base font-medium">התנתק</span>
                </button>
              </>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <p className="text-xs font-semibold text-purple-400 uppercase px-3 pb-1">ניהול</p>
                {[
                  { href: "/Admin", label: "יצירת אירועים" },
                  { href: "/edit-events", label: "עריכת אירועים" },
                  { href: "/manage-categories", label: "ניהול קטגוריות" },
                  { href: "/manage-themes", label: "צבע קטגוריות" },
                  { href: "/approve-tickets", label: "אישור כרטיסים" },
                  { href: "/regenerate-tickets", label: "יצירת כרטיסים" },
                  { href: "/manage-artists", label: "ניהול אמנים" },
                  { href: "/Admin/venue-providers", label: "ספקי API לאימות" },
                  { href: "/Admin/users", label: "ניהול משתמשים" },
                  { href: "/diagnostic", label: "אבחון מערכת" },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-purple-50 active:bg-purple-100 transition-colors">
                      <ShieldCheck size={16} className="text-purple-400 shrink-0" />
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
                width="22" height="22" viewBox="0 0 28 28" fill="none"
                className={`transition-all duration-200 ${pathname === "/" ? "scale-110" : "group-active:opacity-70"}`}
              >
                <path d="M25.6667 25.6666L2.33337 25.6666" stroke={pathname === "/" ? "var(--color-primary, #f97316)" : "#6b7280"} strokeLinecap="round"/>
                <path d="M2.33337 12.8333L11.8136 5.24914C13.0919 4.22652 14.9082 4.22652 16.1865 5.24914L25.6667 12.8333" stroke={pathname === "/" ? "var(--color-primary, #f97316)" : "#6b7280"} strokeLinecap="round"/>
                <path d="M4.66663 25.6667V11.0834" stroke={pathname === "/" ? "var(--color-primary, #f97316)" : "#6b7280"} strokeLinecap="round"/>
                <path d="M23.3334 25.6667V11.0834" stroke={pathname === "/" ? "var(--color-primary, #f97316)" : "#6b7280"} strokeLinecap="round"/>
                <path d="M17.5 25.6667V19.8334C17.5 18.1835 17.5 17.3585 16.9874 16.8459C16.4749 16.3334 15.6499 16.3334 14 16.3334C12.3501 16.3334 11.5251 16.3334 11.0126 16.8459C10.5 17.3585 10.5 18.1835 10.5 19.8334V25.6667" stroke={pathname === "/" ? "var(--color-primary, #f97316)" : "#6b7280"}/>
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
                else { localStorage.setItem(`tiket_seen_favorites_${user.uid}`, favoritesCount.toString()); setSeenFavorites(favoritesCount); setHasNewFavorite(false); }
              }}
            >
              <div className="relative">
                <svg
                  width="20" height="20" viewBox="0 0 15 14" fill="none"
                  className={`transition-all duration-200 ${pathname === "/Favorites" ? "scale-110" : "group-active:opacity-70"}`}
                >
                  <path d="M5.37321 12.3007L5.69713 11.9198V11.9198L5.37321 12.3007ZM7.5 2.17394L7.12691 2.50681C7.22178 2.61314 7.3575 2.67394 7.5 2.67394C7.6425 2.67394 7.77822 2.61314 7.87309 2.50681L7.5 2.17394ZM9.48027 12.9007L9.78609 12.5051H9.78609L9.48027 12.9007ZM10.65 7.83734L10.2931 8.18756C10.3872 8.28336 10.5158 8.33734 10.65 8.33734C10.7842 8.33734 10.9128 8.28336 11.0069 8.18756L10.65 7.83734ZM11.8197 12.9007L11.5139 12.5051H11.5139L11.8197 12.9007ZM5.37321 12.3007L5.69713 11.9198C3.56836 10.1094 1 8.31152 1 4.92002H0.5H0C0 8.87302 3.05884 10.9889 5.04929 12.6816L5.37321 12.3007ZM0.5 4.92002H1C1 3.25044 1.87479 1.86895 3.03993 1.2944C4.16129 0.741441 5.67526 0.879772 7.12691 2.50681L7.5 2.17394L7.87309 1.84107C6.17485 -0.0623583 4.18883 -0.387113 2.59766 0.397519C1.05026 1.16057 0 2.91735 0 4.92002H0.5ZM5.37321 12.3007L5.04929 12.6816C5.40791 12.9866 5.79143 13.3105 6.18002 13.5555C6.56739 13.7997 7.01315 14.0007 7.5 14.0007V13.5007V13.0007C7.28685 13.0007 7.03261 12.9108 6.71329 12.7095C6.39518 12.509 6.06531 12.2329 5.69713 11.9198L5.37321 12.3007ZM14.5 4.92002H15C15 2.91735 13.9497 1.16057 12.4023 0.397519C10.8112 -0.387113 8.82515 -0.0623583 7.12691 1.84107L7.5 2.17394L7.87309 2.50681C9.32474 0.879772 10.8387 0.741441 11.9601 1.2944C13.1252 1.86895 14 3.25044 14 4.92002H14.5ZM6.8 9.21038H7.3C7.3 8.48482 7.71777 7.88158 8.27987 7.6296C8.81296 7.39062 9.55584 7.43629 10.2931 8.18756L10.65 7.83734L11.0069 7.48711C10.0117 6.47315 8.8296 6.28728 7.8708 6.71709C6.94101 7.13391 6.3 8.0998 6.3 9.21038H6.8ZM9.48027 12.9007L9.17445 13.2963C9.36977 13.4473 9.59281 13.6191 9.82205 13.7504C10.0513 13.8818 10.333 14.0007 10.65 14.0007V13.5007V13.0007C10.582 13.0007 10.4787 12.9741 10.3193 12.8828C10.1598 12.7914 9.9905 12.6632 9.78609 12.5051L9.48027 12.9007ZM11.8197 12.9007L12.1256 13.2963C12.662 12.8815 13.3879 12.3779 13.9553 11.7513C14.5399 11.1057 15 10.2877 15 9.21038H14.5H14C14 9.96916 13.6864 10.5584 13.214 11.0801C12.7245 11.6207 12.1102 12.0441 11.5139 12.5051L11.8197 12.9007ZM11.8197 12.9007L11.5139 12.5051C11.3095 12.6632 11.1402 12.7914 10.9807 12.8828C10.8213 12.9741 10.718 13.0007 10.65 13.0007V13.5007V14.0007C10.967 14.0007 11.2487 13.8818 11.478 13.7504C11.7072 13.6191 11.9302 13.4473 12.1256 13.2963L11.8197 12.9007ZM14.5 9.21038H15C15 8.47955 14.7228 7.81319 14.2702 7.32395L13.9031 7.66351L13.5361 8.00306C13.8202 8.31006 14 8.73482 14 9.21038H14.5ZM13.9031 7.66351L14.2702 7.32395C13.8075 6.82388 13.1564 6.50453 12.4331 6.50077C11.7043 6.49697 10.9546 6.81316 10.2931 7.48711L10.65 7.83734L11.0069 8.18756C11.5087 7.67617 12.0091 7.49857 12.4279 7.50075C12.8521 7.50296 13.2459 7.68937 13.5361 8.00306L13.9031 7.66351ZM13.9031 7.66351L14.3567 7.87386C14.7567 7.01136 15 6.03678 15 4.92002H14.5H14C14 5.88494 13.7912 6.71643 13.4495 7.45315L13.9031 7.66351ZM9.48027 12.9007L9.78609 12.5051C9.68663 12.4283 9.58456 12.351 9.48274 12.274L9.18127 12.6729L8.87981 13.0718C8.98176 13.1489 9.07983 13.2231 9.17445 13.2963L9.48027 12.9007ZM9.18127 12.6729L9.48274 12.274C8.35223 11.4197 7.3 10.6016 7.3 9.21038H6.8H6.3C6.3 11.1768 7.83522 12.2824 8.87981 13.0718L9.18127 12.6729ZM9.18127 12.6729L8.86676 12.2842C8.28649 12.7538 7.85806 13.0007 7.5 13.0007V13.5007V14.0007C8.25384 14.0007 8.93732 13.5135 9.49579 13.0616L9.18127 12.6729Z" fill={pathname === "/Favorites" ? "var(--color-primary, #f97316)" : "#6b7280"}/>
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
                  width="22" height="22" viewBox="0 0 17 16" fill="none"
                  className={`transition-all duration-200 ${isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "scale-110" : "group-active:opacity-70"}`}
                >
                  <path d="M15.0403 7.33337H13.1968C11.9329 7.33337 10.9083 8.2288 10.9083 9.33337C10.9083 10.4379 11.9329 11.3334 13.1968 11.3334H15.0403C15.0993 11.3334 15.1288 11.3334 15.1537 11.3319C15.5357 11.3101 15.84 11.0441 15.865 10.7103C15.8667 10.6885 15.8667 10.6627 15.8667 10.6112V8.0556C15.8667 8.00401 15.8667 7.97822 15.865 7.95644C15.84 7.6226 15.5357 7.35668 15.1537 7.3348C15.1288 7.33337 15.0993 7.33337 15.0403 7.33337Z" stroke={isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "var(--color-primary, #f97316)" : "#6b7280"}/>
                  <path d="M15.1336 7.33333C15.0786 6.08513 14.901 5.31983 14.3285 4.78105C13.4987 4 12.163 4 9.49174 4H7.36674C4.69545 4 3.3598 4 2.52994 4.78105C1.70007 5.5621 1.70007 6.81918 1.70007 9.33333C1.70007 11.8475 1.70007 13.1046 2.52994 13.8856C3.3598 14.6667 4.69545 14.6667 7.36674 14.6667H9.49174C12.163 14.6667 13.4987 14.6667 14.3285 13.8856C14.901 13.3468 15.0786 12.5815 15.1336 11.3333" stroke={isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "var(--color-primary, #f97316)" : "#6b7280"}/>
                  <path d="M4.53333 4L7.17929 2.34876C7.92443 1.88375 8.93389 1.88375 9.67902 2.34876L12.325 4" stroke={isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "var(--color-primary, #f97316)" : "#6b7280"} strokeLinecap="round"/>
                  <path d="M13.0271 9.33337H13.0324" stroke={isMyTicketsPopoverOpen || pathname === "/MyTickets" || pathname === "/MyListings" ? "var(--color-primary, #f97316)" : "#6b7280"} strokeLinecap="round" strokeLinejoin="round"/>
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
