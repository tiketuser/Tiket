"use client";

import React from "react";
import Link from "next/link";
import { TicketInfo } from "../CheckoutDialog";
import { nis, hebDateFull } from "../../../mobile/format";
import { hebDatePartsShort } from "@/utils/eventDate";

interface CheckoutStepConfirmationProps {
  tickets: TicketInfo[];
  onClose: () => void;
  isGuest?: boolean;
  onLoginRequest?: () => void;
}

const parseDateParts = (dateStr: string) => {
  const parts = hebDatePartsShort(dateStr);
  return parts ? { day: parts.day, month: parts.month } : { day: "", month: "" };
};

const CheckoutStepConfirmation: React.FC<CheckoutStepConfirmationProps> = ({
  tickets,
  onClose,
  isGuest,
  onLoginRequest,
}) => {
  const total = tickets.reduce((s, t) => s + t.price, 0);

  return (
    <div className="flex flex-col w-full" dir="rtl">
      {/* Success header */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <span
          className="round"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#E3EFE7",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 18 }}>
          התשלום אושר
        </div>
        <div style={{ fontSize: 15, color: "var(--muted)", marginTop: 6 }}>
          {tickets.length > 1 ? "הכרטיסים מחכים לך" : "הכרטיס מחכה לך"} בכרטיסים שלי
        </div>
        <div className="num" style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 22 }}>
          {nis(total)}
        </div>
      </div>

      {/* Ticket cards */}
      <div className="flex flex-col gap-2.5" style={{ marginTop: 24 }}>
        {tickets.map((ticket) => {
          const { day, month } = parseDateParts(ticket.date);
          return (
            <div
              key={ticket.ticketId}
              className="flex items-stretch overflow-hidden"
              style={{
                background: "var(--surface)",
                boxShadow: "0 0 0 1px var(--line)",
                borderRadius: "var(--r-md)",
              }}
            >
              {/* Date column */}
              <div
                className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0"
                style={{
                  minWidth: 62,
                  background: "var(--surface-2)",
                  borderInlineEnd: "1px dashed var(--line-strong)",
                }}
              >
                <span className="num" style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {day}
                </span>
                <span className="num" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                  {month}
                </span>
              </div>

              <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center gap-1">
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ticket.title}
                </div>
                <div className="num" style={{ fontSize: 12, color: "var(--muted)" }}>
                  {hebDateFull(ticket.date)}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ticket.venue} · {ticket.seatLocation}
                </div>
              </div>

              <div
                className="flex flex-col items-end justify-center px-3.5 py-3 flex-shrink-0"
                style={{ borderInlineStart: "1px dashed var(--line-strong)" }}
              >
                <span className="num" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                  {nis(ticket.price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", marginTop: 14 }}>
        אישור נשלח גם למייל שלך
      </div>

      {/* Buttons */}
      <div className="flex flex-col" style={{ gap: 6, marginTop: 20 }}>
        {isGuest ? (
          <button
            onClick={onLoginRequest}
            className="press"
            style={{
              height: 52,
              width: "100%",
              background: "var(--ink)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            לכרטיסים שלי
          </button>
        ) : (
          <Link href="/MyTickets" className="w-full">
            <button
              className="press"
              style={{
                height: 52,
                width: "100%",
                background: "var(--ink)",
                color: "#fff",
                borderRadius: "var(--r-md)",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              לכרטיסים שלי
            </button>
          </Link>
        )}

        <button
          onClick={onClose}
          style={{
            height: 46,
            width: "100%",
            background: "transparent",
            color: "var(--muted)",
            fontSize: 15,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          חזרה לבית
        </button>
      </div>
    </div>
  );
};

export default CheckoutStepConfirmation;
