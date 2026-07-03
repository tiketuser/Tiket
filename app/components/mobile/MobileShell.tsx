"use client";

import React from "react";
import MobileBottomNav from "./MobileBottomNav";

export default function MobileShell({
  children,
  showBottomNav = true,
}: {
  children: React.ReactNode;
  showBottomNav?: boolean;
}) {
  return (
    <div
      className="tk-mobile md:hidden"
      style={{
        minHeight: "100vh",
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
