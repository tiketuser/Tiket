"use client";

import React, { useEffect } from "react";
import MobileBottomNav from "./MobileBottomNav";
import { initMobileChrome, setHeroStatusBar } from "@/lib/native-chrome";
import { initNativePush } from "@/lib/native-push";
import { initOtaUpdates } from "@/lib/ota";
import { auth } from "@/firebase";

export default function MobileShell({
  children,
  showBottomNav = true,
  heroStatusBar = false,
}: {
  children: React.ReactNode;
  showBottomNav?: boolean;
  /** Screen opens with a dark hero under the status bar → light icons */
  heroStatusBar?: boolean;
}) {
  useEffect(() => {
    void initMobileChrome();
    void setHeroStatusBar(heroStatusBar);
  }, [heroStatusBar]);

  // Pull any over-the-air web-bundle update for this build's channel. Runs once,
  // guarded to native + plugin-available, and never throws.
  useEffect(() => {
    initOtaUpdates();
  }, []);

  // Ask for notification permission only once someone is signed in — a prompt
  // on first cold launch, before the user has any reason to want alerts, gets
  // denied and can never be asked again.
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) void initNativePush();
    });
    return unsubscribe;
  }, []);

  return (
    <div
      className="tk-mobile md:hidden"
      style={{
        minHeight: showBottomNav ? "100dvh" : undefined,
        background:
          "radial-gradient(circle at 50% 30%, #EAE4D3 0%, var(--tk-bg) 70%)",
        paddingBottom: showBottomNav
          ? "calc(80px + var(--sab, env(safe-area-inset-bottom, 0px)))"
          : "var(--sab, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {children}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
