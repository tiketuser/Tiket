"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileBottomNav from "./MobileBottomNav";
import { Icon } from "./Icon";
import { initMobileChrome, setHeroStatusBar } from "@/lib/native-chrome";

/**
 * Mobile chrome for admin pages: sticky white top bar (back, centered title,
 * admin tag) and the standard bottom nav. Pages keep a single DOM tree —
 * this only replaces NavBar/Footer below the lg breakpoint.
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
        className="tk-mobile lg:hidden"
        dir="rtl"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          paddingTop: "var(--sat, env(safe-area-inset-top, 0px))",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            height: 52,
            padding: "0 16px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            className="press round"
            onClick={() => router.push(backHref)}
            aria-label="חזרה"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--surface-2)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <Icon.chevR size={17} />
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "52vw",
            }}
          >
            {title}
          </h1>
          <span
            style={{
              justifySelf: "end",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              height: 26,
              padding: "0 10px",
              borderRadius: 999,
              background: "var(--brand-soft)",
              color: "var(--brand)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Icon.shield size={12} />
            ניהול
          </span>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
