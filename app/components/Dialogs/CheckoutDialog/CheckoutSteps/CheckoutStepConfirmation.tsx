"use client";

import React from "react";
import Link from "next/link";
import { TicketInfo } from "../CheckoutDialog";
import { nis, hebDateFull } from "../../../mobile/format";

interface CheckoutStepConfirmationProps {
  tickets: TicketInfo[];
  onClose: () => void;
  isGuest?: boolean;
  onLoginRequest?: () => void;
}

const parseDateParts = (dateStr: string) => {
  if (!dateStr) return { day: "", month: "" };
  try {
    let dateObj: Date;
    if (dateStr.includes("/") || dateStr.includes(".")) {
      const normalized = dateStr.replace(/\./g, "/");
      const [d, m, y] = normalized.split("/");
      dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    } else {
      dateObj = new Date(dateStr);
    }
    const months = [
      "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני",
      "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳",
    ];
    return {
      day: dateObj.getDate().toString(),
      month: months[dateObj.getMonth()],
    };
  } catch {
    return { day: "", month: "" };
  }
};

const CheckoutStepConfirmation: React.FC<CheckoutStepConfirmationProps> = ({
  tickets,
  onClose,
  isGuest,
  onLoginRequest,
}) => {
  return (
    <div className="flex flex-col w-full gap-5" dir="rtl">
      {/* Success icon */}
      <div className="flex justify-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            background: "var(--tk-lime)",
            border: "1px solid var(--tk-line-strong)",
          }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--tk-blue-ink)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <p
        className="text-center"
        style={{ fontSize: 14, color: "var(--tk-ink-2)", lineHeight: 1.5 }}
      >
        ניתן לראות את הכרטיסים שרכשת יחד עם שאר הכרטיסים בבעלותך
      </p>

      {/* Ticket cards (paper / dashed) */}
      <div className="flex flex-col gap-2.5">
        {tickets.map((ticket) => {
          const { day, month } = parseDateParts(ticket.date);
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
                  minWidth: 62,
                  background: "var(--tk-paper)",
                  borderInlineEnd: "1px dashed var(--tk-line-strong)",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--tk-ink)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {day}
                </span>
                <span
                  className="tk-mono"
                  style={{ fontSize: 9, color: "var(--tk-muted)", marginTop: 2 }}
                >
                  {month}
                </span>
              </div>

              <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center gap-1">
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--tk-ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ticket.title}
                </div>
                <div
                  className="tk-mono"
                  style={{ fontSize: 10, color: "var(--tk-muted)" }}
                >
                  {hebDateFull(ticket.date)}
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
                  {ticket.venue} · {ticket.seatLocation}
                </div>
              </div>

              <div
                className="flex flex-col items-end justify-center px-3.5 py-3 flex-shrink-0"
                style={{ borderInlineStart: "1px dashed var(--tk-line-strong)" }}
              >
                <span
                  className="tk-mono"
                  style={{ fontSize: 15, fontWeight: 700, color: "var(--tk-ink)" }}
                >
                  {nis(ticket.price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        {isGuest ? (
          <button
            onClick={onLoginRequest}
            style={{
              height: 50,
              width: "100%",
              background: "var(--tk-ink)",
              color: "var(--tk-lime)",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
            className="transition-transform active:scale-[0.99]"
          >
            הכרטיסים שלי
          </button>
        ) : (
          <Link href="/MyTickets" className="w-full">
            <button
              style={{
                height: 50,
                width: "100%",
                background: "var(--tk-ink)",
                color: "var(--tk-lime)",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
              className="transition-transform active:scale-[0.99]"
            >
              הכרטיסים שלי
            </button>
          </Link>
        )}

        <button
          onClick={onClose}
          style={{
            height: 48,
            width: "100%",
            background: "transparent",
            color: "var(--tk-ink-2)",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid var(--tk-line)",
            cursor: "pointer",
          }}
          className="transition-colors hover:bg-[var(--tk-bg)]"
        >
          לדף הבית
        </button>
      </div>
    </div>
  );
};

export default CheckoutStepConfirmation;
