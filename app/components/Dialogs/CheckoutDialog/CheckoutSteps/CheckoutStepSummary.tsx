"use client";

import React, { useState } from "react";
import { TicketInfo } from "../CheckoutDialog";
import { nis, hebDateFull } from "../../../mobile/format";

interface CheckoutStepSummaryProps {
  tickets: TicketInfo[];
  platformFee: number;
  total: number;
  onProceed: () => Promise<void>;
  error: string | null;
}

const parseDateParts = (dateStr: string) => {
  if (!dateStr) return { dayOfWeek: "", day: "", month: "" };
  try {
    let dateObj: Date;
    if (dateStr.includes("/") || dateStr.includes(".")) {
      const normalized = dateStr.replace(/\./g, "/");
      const [d, m, y] = normalized.split("/");
      dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    } else {
      dateObj = new Date(dateStr);
    }
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const months = [
      "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני",
      "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳",
    ];
    return {
      dayOfWeek: days[dateObj.getDay()],
      day: dateObj.getDate().toString(),
      month: months[dateObj.getMonth()],
    };
  } catch {
    return { dayOfWeek: "", day: "", month: "" };
  }
};

const CheckoutStepSummary: React.FC<CheckoutStepSummaryProps> = ({
  tickets,
  platformFee,
  total,
  onProceed,
  error,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleProceed = async () => {
    if (!termsAccepted) return;
    setIsLoading(true);
    try {
      await onProceed();
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = tickets.reduce((s, t) => s + t.price, 0);

  return (
    <div className="flex flex-col w-full gap-4" dir="rtl">
      {/* Ticket cards */}
      <div className="flex flex-col gap-2.5">
        {tickets.map((ticket) => {
          const { dayOfWeek, day, month } = parseDateParts(ticket.date);
          return (
            <div
              key={ticket.ticketId}
              className="flex items-stretch overflow-hidden"
              style={{
                background: "var(--tk-bg)",
                border: "1px solid var(--tk-line)",
                borderRadius: 14,
              }}
            >
              {/* Date column */}
              <div
                className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0"
                style={{
                  minWidth: 64,
                  background: "var(--tk-paper)",
                  borderInlineEnd: "1px dashed var(--tk-line-strong)",
                }}
              >
                <span
                  className="tk-mono"
                  style={{ fontSize: 9, color: "var(--tk-muted)", letterSpacing: "0.04em" }}
                >
                  {dayOfWeek}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--tk-ink)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {day}
                </span>
                <span
                  className="tk-mono"
                  style={{ fontSize: 9, color: "var(--tk-muted)" }}
                >
                  {month}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center gap-1">
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--tk-ink)",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ticket.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--tk-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ticket.venue}
                </div>
                <div
                  className="tk-mono"
                  style={{ fontSize: 10, color: "var(--tk-muted)", marginTop: 1 }}
                >
                  {ticket.seatLocation}
                </div>
              </div>

              {/* Price */}
              <div
                className="flex flex-col items-end justify-center px-3.5 py-3 flex-shrink-0"
                style={{ borderInlineStart: "1px dashed var(--tk-line-strong)" }}
              >
                <span
                  className="tk-mono"
                  style={{ fontSize: 16, fontWeight: 700, color: "var(--tk-ink)", lineHeight: 1 }}
                >
                  {nis(ticket.price)}
                </span>
                {ticket.originalPrice && ticket.originalPrice !== ticket.price && (
                  <span
                    className="tk-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--tk-muted)",
                      textDecoration: "line-through",
                      marginTop: 3,
                    }}
                  >
                    {nis(ticket.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Price breakdown */}
      <div
        className="flex flex-col gap-2.5 px-4 py-4"
        style={{
          background: "var(--tk-bg)",
          border: "1px solid var(--tk-line)",
          borderRadius: 14,
        }}
      >
        {tickets.length > 1 && (
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 13, color: "var(--tk-muted)" }}>
              {tickets.length} כרטיסים
            </span>
            <span className="tk-mono" style={{ fontSize: 13, color: "var(--tk-ink-2)" }}>
              {nis(subtotal)}
            </span>
          </div>
        )}
        {platformFee > 0 && (
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 13, color: "var(--tk-muted)" }}>
              עמלת שירות
            </span>
            <span className="tk-mono" style={{ fontSize: 13, color: "var(--tk-ink-2)" }}>
              {nis(platformFee)}
            </span>
          </div>
        )}

        <div
          className={
            platformFee > 0 || tickets.length > 1 ? "pt-2.5" : ""
          }
          style={
            platformFee > 0 || tickets.length > 1
              ? { borderTop: "1px dashed var(--tk-line-strong)" }
              : {}
          }
        >
          <div className="flex justify-between items-baseline">
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tk-ink)" }}>
              סה&quot;כ לתשלום
            </span>
            <span
              className="tk-mono"
              style={{ fontSize: 22, fontWeight: 800, color: "var(--tk-ink)" }}
            >
              {nis(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Date helper (only when single ticket) */}
      {tickets.length === 1 && (
        <div
          className="tk-mono text-center"
          style={{ fontSize: 10, color: "var(--tk-muted)", letterSpacing: "0.04em" }}
        >
          {hebDateFull(tickets[0].date)}
        </div>
      )}

      {/* Terms */}
      <label
        className="flex items-center gap-2.5 cursor-pointer select-none px-1"
        style={{ fontSize: 13, color: "var(--tk-ink-2)" }}
      >
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          required
          className="w-4 h-4 cursor-pointer accent-[var(--tk-ink)]"
          style={{ accentColor: "var(--tk-ink)" }}
        />
        <span>אני מאשר את תנאי השימוש ומדיניות הביטולים</span>
      </label>

      {error && (
        <p
          className="text-center"
          style={{
            fontSize: 12,
            color: "#C4373E",
            background: "rgba(196,55,62,0.08)",
            border: "1px solid rgba(196,55,62,0.18)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          {error}
        </p>
      )}

      {/* Proceed Button */}
      <button
        onClick={handleProceed}
        disabled={!termsAccepted || isLoading}
        className="relative w-full overflow-hidden transition-transform active:scale-[0.99] disabled:cursor-not-allowed"
        style={{
          height: 52,
          background: termsAccepted && !isLoading ? "var(--tk-ink)" : "var(--tk-line-strong)",
          color: termsAccepted && !isLoading ? "var(--tk-lime)" : "var(--tk-muted)",
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          border: "none",
          marginTop: 4,
        }}
      >
        {isLoading && (
          <span className="absolute inset-0 overflow-hidden" style={{ borderRadius: 14 }}>
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </span>
        )}
        <span className="relative flex items-center justify-center gap-2">
          {isLoading && (
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isLoading ? "מכין תשלום…" : "המשך לתשלום"}
        </span>
      </button>
    </div>
  );
};

export default CheckoutStepSummary;
