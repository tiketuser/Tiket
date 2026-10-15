"use client";

import React from "react";

export default function MobileTopBar({ title }: { title?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "calc(14px + var(--sat, env(safe-area-inset-top, 0px))) 20px 2px",
      }}
    >
      {title ? (
        <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
      ) : (
        <Logo size={25} />
      )}
    </div>
  );
}

/** The lowercase "tiket" wordmark with the brand dot. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        direction: "ltr",
        display: "inline-flex",
        alignItems: "baseline",
      }}
    >
      tiket
      <span
        style={{
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: "50%",
          background: "var(--brand)",
          marginLeft: size * 0.06,
        }}
      />
    </span>
  );
}
