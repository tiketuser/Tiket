"use client";

import MobileShell from "./MobileShell";

/** Route-level loading state on phones: the paper background and a quiet
 *  label, so the old desktop navigation never flashes in before the page. */
export default function MobileLoading({ label = "טוען..." }: { label?: string }) {
  return (
    <MobileShell showBottomNav={false}>
      <div
        className="tk-mono"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--tk-muted)",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </MobileShell>
  );
}
