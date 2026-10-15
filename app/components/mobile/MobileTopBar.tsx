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
        <span
          style={{
            fontSize: 25,
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
              width: 5.5,
              height: 5.5,
              borderRadius: "50%",
              background: "var(--brand)",
              marginLeft: 1.5,
            }}
          />
        </span>
      )}
    </div>
  );
}
