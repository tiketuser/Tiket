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

  return (
    <MobileShell showBottomNav={false}>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
            <div
              className="tk-mono"
              style={{
                fontSize: 10,
                color: "var(--tk-muted)",
                letterSpacing: "0.08em",
              }}
            >
              {event.category.toUpperCase()}
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
            {event.artist}
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
              icon={<Icon.clock size={14} color="var(--tk-blue)" />}
              label="שעה"
              value={event.time || "—"}
            />
            <Stat
              icon={<Icon.cal size={14} color="var(--tk-blue)" />}
              label="תאריך"
              value={hebDateFull(event.date)}
            />
            <Stat
              icon={<Icon.pin size={14} color="var(--tk-blue)" />}
              label="מיקום"
              value={event.venue || "—"}
            />
          </div>
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
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 14,
          justifyContent: "center",
        }}
      >
        {icon}
        <span
          className="tk-mono"
          style={{
            color: "var(--tk-muted)",
            fontSize: 9,
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          letterSpacing: "-0.01em",
          textAlign: "center",
        }}
      >
        {value}
      </div>
    </div>
  );
}
