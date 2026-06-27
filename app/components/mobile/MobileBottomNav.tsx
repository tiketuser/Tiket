"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Icon } from "./Icon";

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

function tabIcon(id: TabId, color: string) {
  const size = 20;
  if (id === "home") return <Icon.home size={size} color={color} />;
  if (id === "favorites") return <Icon.heart size={size} color={color} />;
  if (id === "tickets") return <Icon.wallet size={size} color={color} />;
  if (id === "profile") return <Icon.user size={size} color={color} />;
  return null;
}

function activeTab(pathname: string): TabId {
  if (pathname.startsWith("/Favorites")) return "favorites";
  if (pathname.startsWith("/MyTickets")) return "tickets";
  if (pathname.startsWith("/Profile")) return "profile";
  return "home";
}

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const current = activeTab(pathname);
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
    if (!t.gated) {
      router.push(t.href);
      return;
    }
    runAuthed(() => router.push(t.href));
  };

  return (
    <>
      <nav
        className="tk-mobile fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{
          background: "rgba(251,248,241,0.96)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid var(--tk-line)",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          paddingTop: 10,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          paddingInline: 16,
          height: "calc(80px + env(safe-area-inset-bottom, 0px))",
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        {TABS.map((t) => {
          const isActive = current === t.id;
          const color = isActive ? "var(--tk-ink)" : "var(--tk-muted)";
          if (t.id === "sell") {
            // Lifted sell tab — v4 variant: rotated dark square with lime plus.
            return (
              <div key={t.id} style={{ position: "relative", height: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    bottom: "100%",
                    marginBottom: -16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    pointerEvents: "none",
                    zIndex: 5,
                  }}
                >
                  <button
                    onClick={() => handleTab(t)}
                    aria-label={t.label}
                    style={{
                      pointerEvents: "auto",
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "var(--tk-ink)",
                      color: "var(--tk-lime)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: 0,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(10,10,10,0.25)",
                      transform: "rotate(-4deg)",
                    }}
                  >
                    <Icon.plus size={22} color="var(--tk-lime)" />
                  </button>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--tk-ink)",
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
                fontSize: 10,
                color,
                fontWeight: 600,
                padding: 0,
                background: "transparent",
                border: 0,
              }}
            >
              {tabIcon(t.id, color)}
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
