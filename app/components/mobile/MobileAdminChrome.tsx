"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileBottomNav from "./MobileBottomNav";
import { Icon } from "./Icon";
import { initMobileChrome, setHeroStatusBar } from "@/lib/native-chrome";

/**
 * Mobile chrome for admin pages: sticky paper-cream top bar (back + title +
 * admin badge) and the standard bottom nav. Pages keep a single DOM tree —
 * this only replaces NavBar/Footer below the md breakpoint.
 */
export default function MobileAdminChrome({
  title,
  backHref = "/Profile",
}: {
  title: string;
  backHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    void initMobileChrome();
    void setHeroStatusBar(false);
  }, []);

  return (
    <>
      <div
        className="tk-mobile md:hidden"
        dir="rtl"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding:
            "calc(12px + var(--sat, env(safe-area-inset-top, 0px))) 16px 12px",
          background: "rgba(245,241,232,0.96)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--tk-line)",
        }}
      >
        <button
          onClick={() => router.push(backHref)}
          aria-label="חזרה"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Icon.chev size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          <div
            className="tk-mono"
            style={{
              fontSize: 9,
              color: "var(--tk-muted)",
              letterSpacing: "0.14em",
              marginTop: 2,
            }}
            dir="ltr"
          >
            ◆ TIKET ADMIN
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 999,
            background: "var(--tk-lime)",
            color: "var(--tk-blue-ink)",
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <Icon.shield size={12} />
          ניהול
        </span>
      </div>
      <MobileBottomNav />
    </>
  );
}
