"use client";

import React from "react";

export default function MobileTopBar({ title }: { title?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "calc(14px + var(--sat, env(safe-area-inset-top, 0px))) 18px 14px",
      }}
    >
      {title ? (
        <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
      ) : (
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
          tiket<span className="tk-logo-dot">.</span>
        </span>
      )}
    </div>
  );
}
