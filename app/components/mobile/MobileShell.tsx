"use client";

import React, { useEffect } from "react";
import MobileBottomNav from "./MobileBottomNav";
import { initMobileChrome, setHeroStatusBar } from "@/lib/native-chrome";

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

  return (
    <div
      className="tk-mobile md:hidden"
      style={{
        minHeight: showBottomNav ? "100dvh" : undefined,
        background:
          "radial-gradient(circle at 50% 30%, #EAE4D3 0%, var(--tk-bg) 70%)",
        paddingBottom: showBottomNav
          ? "calc(80px + env(safe-area-inset-bottom, 0px))"
          : "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {children}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
