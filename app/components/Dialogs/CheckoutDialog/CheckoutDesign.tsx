"use client";

// Design-language building blocks for the checkout screen ("תשלום" in the
// Tiket design project). Shared by CheckoutDialog (loading state) and
// CheckoutStepPayment (live Stripe form) so both render the same layout.

import React from "react";
import Image from "next/image";
import type { TicketInfo } from "./CheckoutDialog";
import { nis, hebDate } from "../../mobile/format";
import { Icon } from "../../mobile/Icon";

export function CountdownBar({
  display,
  urgent,
}: {
  display: string;
  urgent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--tk-ink)",
        color: "var(--tk-bg)",
        padding: "10px 14px",
        borderRadius: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 12 }}>הכרטיס שמור לך</span>
      <span
        className={urgent ? "tk-mono animate-pulse" : "tk-mono"}
        style={{ fontSize: 14, fontWeight: 700, color: "var(--tk-lime)" }}
      >
        {display}
      </span>
    </div>
  );
}

function seatsValue(tickets: TicketInfo[]): string {
  if (tickets[0]?.isStanding) {
    return tickets.length > 1 ? `עמידה ×${tickets.length}` : "עמידה";
  }
  const seats = tickets
    .map((t) => t.seat)
    .filter((s): s is number => typeof s === "number")
    .sort((a, b) => a - b);
  if (seats.length === 0) return "—";
  if (seats.length === 1) return String(seats[0]);
  const first = seats[0];
  const last = seats[seats.length - 1];
  const contiguous = seats.every((s, i) => s === first + i);
  return contiguous ? `${first}-${last}` : seats.join(", ");
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="tk-mono" style={{ fontSize: 9, color: "var(--tk-muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function TicketStub({ tickets }: { tickets: TicketInfo[] }) {
  const first = tickets[0];
  if (!first) return null;
  const hasSeatInfo =
    first.section != null || first.row != null || first.seat != null || first.isStanding;
  const seatCount = tickets.length;

  return (
    <div
      style={{
        background: "var(--tk-paper)",
        border: "1px solid var(--tk-line-strong)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      {first.imageUrl && (
        <div style={{ position: "relative", width: "100%", height: 150, background: "#1A1A1A" }}>
          <Image
            src={first.imageUrl}
            alt={first.title}
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        </div>
      )}
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{first.title}</div>
        <div style={{ fontSize: 10, color: "var(--tk-muted)", marginBottom: 10 }}>
          {hebDate(first.date)}
          {first.time ? ` · ${first.time}` : ""} · {first.venue?.split(",")[0]?.trim()}
        </div>
        {hasSeatInfo ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              paddingTop: 8,
              borderTop: "1px dashed var(--tk-line-strong)",
            }}
          >
            <Mini label="אזור" value={first.section || "—"} />
            <Mini label="שורה" value={first.row != null ? String(first.row) : "—"} />
            <Mini label={seatCount > 1 ? "מושבים" : "מושב"} value={seatsValue(tickets)} />
          </div>
        ) : (
          <div
            className="tk-mono"
            style={{
              fontSize: 11,
              color: "var(--tk-muted)",
              paddingTop: 8,
              borderTop: "1px dashed var(--tk-line-strong)",
            }}
          >
            {first.seatLocation}
          </div>
        )}
      </div>
    </div>
  );
}

export function PaySummary({
  tickets,
  platformFee,
  total,
}: {
  tickets: TicketInfo[];
  platformFee: number;
  total: number;
}) {
  const subtotal = tickets.reduce((s, t) => s + t.price, 0);
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          background: "var(--tk-paper)",
          border: "1px solid var(--tk-line)",
          borderRadius: 10,
          padding: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
          <span style={{ fontSize: 12, color: "var(--tk-muted)" }}>
            כרטיס × {tickets.length}
          </span>
          <span className="tk-mono" style={{ fontSize: 13 }}>
            {nis(subtotal)}
          </span>
        </div>
        {platformFee > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ fontSize: 12, color: "var(--tk-muted)" }}>עמלת שירות</span>
            <span className="tk-mono" style={{ fontSize: 13 }}>
              {nis(platformFee)}
            </span>
          </div>
        )}
        <div style={{ height: 1, background: "var(--tk-line)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>סה״כ</span>
          <span className="tk-mono" style={{ fontSize: 18, fontWeight: 700 }}>
            {nis(total)}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 12,
          background: "rgba(181, 70, 83, 0.05)",
          borderRadius: 10,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0, marginTop: 1 }}>
          <Icon.shield size={16} color="var(--tk-blue)" />
        </span>
        <div style={{ fontSize: 11, color: "var(--tk-ink-2)", lineHeight: 1.5 }}>
          הכסף מוחזק בנאמנות ומועבר למוכר רק אחרי האירוע. אם המופע מבוטל — החזר
          מלא אוטומטית.
        </div>
      </div>
    </div>
  );
}

export function TermsRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-2.5 cursor-pointer select-none"
      style={{ fontSize: 12.5, color: "var(--tk-ink-2)", marginTop: 14 }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 cursor-pointer flex-shrink-0"
        style={{ accentColor: "var(--tk-blue)" }}
      />
      <span>אני מאשר את תנאי השימוש ומדיניות הביטולים</span>
    </label>
  );
}

export function PayFooter({
  total,
  disabled,
  processing,
  type = "submit",
  onClick,
}: {
  total: number;
  disabled: boolean;
  processing?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "10px 14px calc(14px + env(safe-area-inset-bottom, 0px))",
        background: "rgba(245, 241, 232, 0.96)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--tk-line)",
      }}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="transition-transform active:scale-[0.99] disabled:cursor-not-allowed"
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 999,
          border: "none",
          background: disabled ? "var(--tk-line-strong)" : "var(--tk-blue)",
          color: disabled ? "var(--tk-muted)" : "#fff",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {processing ? (
          <>
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            מעבד תשלום…
          </>
        ) : (
          <>
            <Icon.lock size={14} color={disabled ? "var(--tk-muted)" : "#fff"} />
            שלם {nis(total)} באבטחה
          </>
        )}
      </button>
    </div>
  );
}
