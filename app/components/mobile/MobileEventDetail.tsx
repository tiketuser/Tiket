"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MobileShell from "./MobileShell";
import { Icon } from "./Icon";
import { hebDateFull, abbrevCity } from "./format";
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

  return (
    <MobileShell showBottomNav={false}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Poster */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 320,
            background: "#1A1A1A",
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
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.05) 100%)",
            }}
          />
          <button
            onClick={() => router.back()}
            aria-label="חזרה"
            style={{
              position: "absolute",
              top: "calc(14px + env(safe-area-inset-top, 0px))",
              insetInlineStart: 14,
              zIndex: 2,
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "rgba(251,248,241,0.92)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon.chev size={16} />
          </button>
        </div>

        {/* Title + stats */}
        <div style={{ padding: "18px 18px 0" }}>
          {event.category && (
            <div style={{ fontSize: 10, color: "var(--tk-muted)" }}>
              {event.category}
            </div>
          )}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: "6px 0 14px",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {abbrevCity(event.artist)}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              padding: "14px 0",
              borderTop: "1px dashed var(--tk-line-strong)",
              borderBottom: "1px dashed var(--tk-line-strong)",
            }}
          >
            <Stat
              icon={<Icon.clock size={22} color="var(--tk-blue)" />}
              label="שעה"
              value={event.time || "—"}
            />
            <Stat
              icon={<Icon.cal size={22} color="var(--tk-blue)" />}
              label="תאריך"
              value={hebDateFull(event.date)}
            />
            <Stat
              icon={<Icon.pin size={22} color="var(--tk-blue)" />}
              label="מיקום"
              value={event.venue?.split(",")[0]?.trim() || "—"}
            />
          </div>
        </div>

        {/* Seat map */}
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
            מפת האולם
          </div>
          <VenueSeatMap />
        </div>

        {/* Listings */}
        <div style={{ padding: "18px 18px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              כרטיסים זמינים{" "}
              <span
                className="tk-mono"
                style={{
                  color: "var(--tk-muted)",
                  fontWeight: 400,
                  fontSize: 11,
                }}
              >
                ({availableTickets})
              </span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </MobileShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "var(--tk-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ color: "var(--tk-muted)", fontSize: 10 }}>{label}</span>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function VenueSeatMap() {
  return (
    <div
      style={{
        background: "var(--tk-paper)",
        borderRadius: 16,
        padding: "16px 12px 20px",
        border: "1px solid var(--tk-line)",
      }}
    >
      {/* Exact paths from Tiket design project — src/detail.jsx VenueMap */}
      <svg viewBox="0 0 400 260" width="100%" style={{ display: "block" }} aria-label="מפת אולם">
        {/* D · VIP */}
        <path d="M 80 16 L 320 16 L 320 116 L 80 116 Z" fill="#EAC4C7" stroke="#FBF8F1" strokeWidth="1.5" />
        <text x="200" y="70" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#0A0A0A">D · VIP</text>

        {/* B — south stand */}
        <path d="M 80 120 L 320 120 L 280 176 L 120 176 Z" fill="#0A0A0A" stroke="#FBF8F1" strokeWidth="1.5" />
        <text x="200" y="152" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FBF8F1">B</text>

        {/* C — west wing */}
        <path d="M 20 40 L 80 40 L 76 116 L 20 200 Z" fill="#6E6A60" stroke="#FBF8F1" strokeWidth="1.5" />
        <text x="45" y="114" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FBF8F1">C</text>

        {/* C — east wing */}
        <path d="M 320 40 L 380 40 L 380 200 L 324 116 Z" fill="#6E6A60" stroke="#FBF8F1" strokeWidth="1.5" />
        <text x="355" y="114" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FBF8F1">C</text>

        {/* A — pit */}
        <path d="M 120 180 L 280 180 L 260 214 L 140 214 Z" fill="#B54653" stroke="#FBF8F1" strokeWidth="1.5" />
        <text x="200" y="200" textAnchor="middle" fontFamily="inherit" fontSize="13" fontWeight="700" fill="#FBF8F1">A</text>

        {/* Stage */}
        <rect x="140" y="220" width="120" height="24" rx="4" fill="#0A0A0A" />
        <text x="200" y="236" textAnchor="middle" fontFamily="inherit" fontSize="11" fill="#EAC4C7">◆ במה ◆</text>
      </svg>
    </div>
  );
}
