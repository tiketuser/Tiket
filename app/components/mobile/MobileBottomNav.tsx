"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Icon } from "./Icon";
import { forgetTabScroll, useTabScrollMemory } from "./useTabScrollMemory";

const AuthDialog = dynamic(() => import("./MobileAuthSheet"), { ssr: false });
const MobileSell = dynamic(() => import("./MobileSell"), { ssr: false });

type TabId = "home" | "favorites" | "sell" | "tickets" | "profile";

const TABS: { id: TabId; label: string; href: string; gated: boolean }[] = [
  { id: "home", label: "בית", href: "/", gated: false },
  { id: "favorites", label: "מועדפים", href: "/Favorites", gated: false },
  // Sell uses a dialog, not a route — href left empty
  { id: "sell", label: "מכירה", href: "", gated: true },
  { id: "tickets", label: "הכרטיסים", href: "/MyTickets", gated: true },
  { id: "profile", label: "פרופיל", href: "/Profile", gated: true },
];

// Tab icons from the design (New.html TabBar): outlined when idle, filled
// in ink on the active tab.
function tabIcon(id: TabId, color: string, on: boolean) {
  const p = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: on ? color : "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (id === "home")
    return (
      <svg {...p}>
        <path d="M3.8 10.4c0-.7.3-1.3.9-1.7l6.1-4.6a2 2 0 0 1 2.4 0l6.1 4.6c.6.4.9 1 .9 1.7v7.8a2.2 2.2 0 0 1-2.2 2.2h-3.2v-4.9a1.2 1.2 0 0 0-1.2-1.2h-2.2a1.2 1.2 0 0 0-1.2 1.2v4.9H6a2.2 2.2 0 0 1-2.2-2.2z" />
      </svg>
    );
  if (id === "favorites")
    return (
      <svg {...p}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  if (id === "tickets")
    return (
      <svg {...p} fill="none">
        <path d="M5.5 7l9.6-3a1.8 1.8 0 0 1 2.3 1.7V7" />
        <rect x="3" y="7" width="18" height="13" rx="3.4" fill={on ? color : "none"} />
        <path d="M21 11.2h-3.4a2 2 0 0 0 0 4H21" fill={on ? "var(--bg)" : "none"} stroke={on ? "var(--bg)" : color} />
        <circle cx="17.6" cy="13.2" r=".6" fill={color} stroke="none" />
      </svg>
    );
  if (id === "profile")
    return (
      <svg {...p}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.6 20.4c.9-3.5 3.8-5.4 7.4-5.4s6.5 1.9 7.4 5.4a.8.8 0 0 1-.8 1H5.4a.8.8 0 0 1-.8-1z" />
      </svg>
    );
  return null;
}

const ADMIN_PREFIXES = [
  "/Admin",
  "/edit-events",
  "/approve-tickets",
  "/regenerate-tickets",
  "/manage-categories",
  "/manage-themes",
  "/manage-artists",
  "/manage-default-images",
  "/diagnostic",
];

function activeTab(pathname: string): TabId {
  if (pathname.startsWith("/Favorites")) return "favorites";
  if (pathname.startsWith("/MyTickets")) return "tickets";
  if (pathname.startsWith("/Profile")) return "profile";
  // Admin pages are reached from the profile tab
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) return "profile";
  return "home";
}

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const current = activeTab(pathname);
  // Scroll memory only on the tab roots themselves (not event pages etc.).
  const tabRoot = TABS.some((t) => t.href && t.href === pathname);
  useTabScrollMemory(pathname, tabRoot);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [sellOpen, setSellOpen] = useState(false);

  const runAuthed = (action: () => void) => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) action();
      else {
        setPendingAction(() => action);
        setAuthOpen(true);
      }
    });
  };

  const handleTab = (t: (typeof TABS)[number]) => {
    if (t.id === "sell") {
      runAuthed(() => setSellOpen(true));
      return;
    }
    // Tapping the tab you're on scrolls it back to the top, like native apps.
    if (pathname === t.href) {
      forgetTabScroll(t.href);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // scroll:false so the target tab can restore its own position.
    const go = () => router.push(t.href, { scroll: false });
    if (!t.gated) go();
    else runAuthed(go);
  };

  return (
    <>
      <nav
        className="tk-mobile fixed inset-x-0 bottom-0 z-40 lg:hidden"
        style={{
          background: "var(--bg)",
          borderTop: "1px solid var(--line)",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: "var(--sab, env(safe-area-inset-bottom, 0px))",
          paddingInline: 16,
          height: "calc(64px + var(--sab, env(safe-area-inset-bottom, 0px)))",
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        {TABS.map((t) => {
          const isActive = current === t.id;
          const color = isActive ? "var(--ink)" : "var(--faint)";
          if (t.id === "sell") {
            // Lifted sell tab — unified: brand rounded square with a white plus.
            return (
              <div key={t.id} style={{ position: "relative", height: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    bottom: "100%",
                    marginBottom: -12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    pointerEvents: "none",
                    zIndex: 5,
                  }}
                >
                  <button
                    onClick={() => handleTab(t)}
                    aria-label={t.label}
                    className="press round"
                    style={{
                      pointerEvents: "auto",
                      width: 48,
                      height: 40,
                      borderRadius: 12,
                      background: "var(--brand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: 0,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(20,20,19,.18)",
                    }}
                  >
                    <Icon.plus size={22} color="#fff" />
                  </button>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "var(--ink)",
                      pointerEvents: "auto",
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <button
              key={t.id}
              onClick={() => handleTab(t)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10.5,
                color,
                fontWeight: isActive ? 600 : 500,
                padding: 0,
                background: "transparent",
                border: 0,
                transition: "color .15s",
              }}
            >
              {tabIcon(t.id, color, isActive)}
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>
      <AuthDialog
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          // If the user just signed in, run the action they were trying to perform
          const action = pendingAction;
          setPendingAction(null);
          if (action && getAuth().currentUser) {
            setTimeout(action, 50);
          }
        }}
      />
      <MobileSell open={sellOpen} onClose={() => setSellOpen(false)} />
    </>
  );
}
