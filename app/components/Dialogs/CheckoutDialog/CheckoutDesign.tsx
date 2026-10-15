"use client";

// Design-language building blocks for the checkout screen ("תשלום" in the
// Tiket design project). Shared by CheckoutDialog (loading state) and
// CheckoutStepPayment (live Stripe form) so both render the same layout.
// Styled to the unified redesign (white canvas, --brand, squircle radii).

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
        height: 44,
        padding: "0 14px",
        borderRadius: "var(--r-sm)",
        background: "var(--surface-2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          color: "var(--ink-2)",
        }}
      >
        <Icon.clock size={18} color="var(--ink-2)" />
        הכרטיסים שמורים לך
      </span>
      <span
        className={urgent ? "num animate-pulse" : "num"}
        style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)" }}
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

export function TicketStub({ tickets }: { tickets: TicketInfo[] }) {
  const first = tickets[0];
  if (!first) return null;
  const hasSeatInfo =
    first.section != null || first.row != null || first.seat != null || first.isStanding;
  const seatCount = tickets.length;
  const venueParts = (first.venue || "").split(",").map((p) => p.trim());

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Compact event row */}
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          padding: "4px 0 18px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 64,
            height: 64,
            borderRadius: 14,
            overflow: "hidden",
            background: "var(--surface-2)",
            flex: "0 0 auto",
          }}
        >
          {first.imageUrl && (
            <Image
              src={first.imageUrl}
              alt={first.title}
              fill
              sizes="64px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {first.title}
          </div>
          <div className="num" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {hebDate(first.date)}
            {first.time ? ` · ${first.time}` : ""}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {venueParts.filter(Boolean).join(", ")}
          </div>
        </div>
      </div>

      {/* Seat detail grid */}
      {hasSeatInfo ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            padding: "14px 0",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {[
            ["אזור", first.section || "—"],
            ["שורה", first.row != null ? String(first.row) : "—"],
            [seatCount > 1 ? "מושבים" : "מושב", seatsValue(tickets)],
          ].map(([label, value], i) => (
            <div
              key={label}
              style={{
                paddingInlineStart: i ? 14 : 0,
                borderInlineStart: i ? "1px solid var(--line)" : "none",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
              <div className="num" style={{ fontSize: 16, fontWeight: 600, marginTop: 1 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="num"
          style={{
            fontSize: 13,
            color: "var(--muted)",
            padding: "14px 0",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {first.seatLocation}
        </div>
      )}
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
  const row = {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 15,
    color: "var(--ink-2)",
  } as const;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 10 }}>
        סיכום
      </div>
      <div style={row}>
        <span>
          כרטיס × <span className="num">{tickets.length}</span>
        </span>
        <span className="num">{nis(subtotal)}</span>
      </div>
      {platformFee > 0 && (
        <div style={row}>
          <span>עמלת שירות</span>
          <span className="num">{nis(platformFee)}</span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 10,
          paddingTop: 14,
          borderTop: "1px solid var(--line)",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700 }}>סה״כ</span>
        <span className="num" style={{ fontSize: 20, fontWeight: 700 }}>
          {nis(total)}
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 12,
          background: "var(--brand-soft)",
          borderRadius: "var(--r-sm)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0, marginTop: 1 }}>
          <Icon.shield size={16} color="var(--brand)" />
        </span>
        <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
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
      style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 14 }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 cursor-pointer flex-shrink-0"
        style={{ accentColor: "var(--brand)" }}
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
        padding: "12px 20px calc(16px + var(--sab, env(safe-area-inset-bottom, 0px)))",
        background: "var(--bg)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="press disabled:cursor-not-allowed"
        style={{
          width: "100%",
          height: 52,
          borderRadius: "var(--r-md)",
          border: "none",
          background: disabled ? "var(--line-strong)" : "var(--brand)",
          color: disabled ? "var(--muted)" : "#fff",
          fontSize: 15,
          fontWeight: 600,
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
            <Icon.lock size={16} color={disabled ? "var(--muted)" : "#fff"} />
            שלם <span className="num">{nis(total)}</span> באבטחה
          </>
        )}
      </button>
    </div>
  );
}
