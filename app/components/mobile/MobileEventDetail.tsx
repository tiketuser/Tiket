"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MobileShell from "./MobileShell";
import { Icon } from "./Icon";
import { hebDateFull } from "./format";
import { encodeImageUrl } from "@/utils/defaultImages";

export type MobileEventDetailEvent = {
  artist: string;
  date: string;
  time: string;
  venue: string;
  imageUrl?: string;
  category?: string;
};

export default function MobileEventDetail({
  event,
  availableTickets,
  children,
}: {
  event: MobileEventDetailEvent;
  availableTickets: number;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const img = event.imageUrl
    ? encodeImageUrl(event.imageUrl)
    : "/images/Artist/default.png";

  const venueParts = (event.venue || "").split(",").map((p) => p.trim());
  const venueName = venueParts[0] || "—";
  const cityName = venueParts[1] || "";

  const h2 = {
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    marginBottom: 12,
  } as const;

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 0",
    borderBottom: "1px solid var(--line)",
  } as const;

  const chip = {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "var(--surface-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  } as const;

  return (
    <MobileShell showBottomNav={false} heroStatusBar>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Poster */}
        <div
          style={{
            position: "relative",
            height: 320,
            background: "var(--surface-2)",
            overflow: "hidden",
          }}
        >
          <Image
            src={img}
            alt={event.artist}
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            unoptimized
            priority
          />
          <div
            style={{
              position: "absolute",
              top: "calc(14px + var(--sat, env(safe-area-inset-top, 0px)))",
              insetInline: 16,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              className="press round"
              onClick={() => router.back()}
              aria-label="חזרה"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(20,20,19,.12)",
                cursor: "pointer",
              }}
            >
              <Icon.chevR size={18} color="var(--ink)" />
            </button>
          </div>
        </div>

        {/* Title + date/venue rows */}
        <div style={{ padding: "20px 20px 0" }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              margin: 0,
              textWrap: "pretty",
            }}
          >
            {event.artist}
          </h1>

          <div style={{ marginTop: 16, borderTop: "1px solid var(--line)" }}>
            <div style={rowStyle}>
              <span style={chip}>
                <Icon.cal size={20} color="var(--ink-2)" />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {hebDateFull(event.date)}
                </div>
                {event.time && (
                  <div
                    className="num"
                    style={{ fontSize: 13, color: "var(--muted)", marginTop: 1 }}
                  >
                    {event.time}
                  </div>
                )}
              </div>
            </div>
            <div style={rowStyle}>
              <span style={chip}>
                <Icon.pin size={20} color="var(--ink-2)" />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{venueName}</div>
                {cityName && (
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 1 }}>
                    {cityName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seat map */}
        <div style={{ padding: "24px 20px 0" }}>
          <div style={h2}>מפת האולם</div>
          <VenueSeatMap />
        </div>

        {/* Listings */}
        <div style={{ padding: "24px 20px 24px" }}>
          <div
            style={{
              ...h2,
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span>כרטיסים זמינים</span>
            <span
              className="num"
              style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}
            >
              ({availableTickets})
            </span>
          </div>
          {children}
        </div>
      </div>
    </MobileShell>
  );
}

function VenueSeatMap() {
  return (
    <div
      style={{
        borderRadius: "var(--r-md)",
        padding: "12px 8px 8px",
        border: "1px solid var(--line)",
        background: "var(--bg)",
      }}
    >
      {/* Exact paths from Tiket design project — src/detail.jsx VenueMap */}
      <svg viewBox="0 0 400 260" width="100%" style={{ display: "block" }} aria-label="מפת אולם">
        {/* D · VIP */}
        <path d="M 80 16 L 320 16 L 320 116 L 80 116 Z" fill="#EAC4C7" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="200" y="70" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#141413">D · VIP</text>

        {/* B — south stand */}
        <path d="M 80 120 L 320 120 L 280 176 L 120 176 Z" fill="#141413" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="200" y="152" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FFFFFF">B</text>

        {/* C — west wing */}
        <path d="M 20 40 L 80 40 L 76 116 L 20 200 Z" fill="#6F6B63" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="45" y="114" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FFFFFF">C</text>

        {/* C — east wing */}
        <path d="M 320 40 L 380 40 L 380 200 L 324 116 Z" fill="#6F6B63" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="355" y="114" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FFFFFF">C</text>

        {/* A — pit */}
        <path d="M 120 180 L 280 180 L 260 214 L 140 214 Z" fill="#B54653" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="200" y="200" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FFFFFF">A</text>

        {/* Stage */}
        <rect x="140" y="220" width="120" height="24" rx="4" fill="#141413" />
        <text x="200" y="236" textAnchor="middle" fontFamily="inherit" fontSize="11" fill="#EAC4C7">◆ במה ◆</text>
      </svg>
    </div>
  );
}
