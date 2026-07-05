"use client";

import React, { useState } from "react";
import Image from "next/image";
import MobileShell from "./MobileShell";
import { Icon } from "./Icon";
import { hebDate, timeUntil, isPastDate, nis, abbrevCity } from "./format";
import { encodeImageUrl } from "@/utils/defaultImages";

export type MobileTicket = {
  id: string;
  artist: string;
  date: string;
  time?: string;
  venue: string;
  section?: string;
  block?: string;
  row?: string | number;
  seat?: string | number;
  isStanding?: boolean;
  amount: number;
  ticketImage?: string;
  eventImageUrl?: string;
};

type Tab = "upcoming" | "selling";

export default function MobileMyTickets({
  tickets,
  loading,
  notSignedIn,
}: {
  tickets: MobileTicket[];
  loading: boolean;
  notSignedIn?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [scanOpen, setScanOpen] = useState<MobileTicket | null>(null);

  const upcoming = tickets.filter((t) => !isPastDate(t.date));
  const past = tickets.filter((t) => isPastDate(t.date));

  const tabs: { id: Tab; label: string }[] = [
    { id: "upcoming", label: "קרובים" },
    { id: "selling", label: "למכירה" },
  ];

  return (
    <MobileShell>
      <div
        style={{
          padding: "calc(14px + var(--sat, env(safe-area-inset-top, 0px))) 18px 14px",
          borderBottom: "1px solid var(--tk-line)",
        }}
      >
        <div
          style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          הכרטיסים שלי
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 10,
            padding: 3,
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line-strong)",
            borderRadius: 999,
            width: "fit-content",
          }}
        >
          {tabs.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  background: active ? "var(--tk-ink)" : "transparent",
                  color: active ? "#fff" : "var(--tk-ink-2)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {notSignedIn ? (
          <EmptyState text="התחבר כדי לראות את הכרטיסים שלך" />
        ) : loading ? (
          <div
            style={{
              padding: "40px 18px",
              textAlign: "center",
              color: "var(--tk-muted)",
              fontSize: 13,
            }}
          >
            טוען כרטיסים…
          </div>
        ) : tab === "upcoming" ? (
          <>
            {upcoming.length === 0 ? (
              <EmptyState text="אין כרטיסים קרובים" />
            ) : (
              upcoming.map((t) => (
                <GlassTicketCard
                  key={t.id}
                  ticket={t}
                  onScan={() => setScanOpen(t)}
                />
              ))
            )}
            {past.length > 0 && (
              <>
                <SectionHeader
                  kicker="היסטוריה"
                  title="אירועים שעברו"
                  meta={`${past.length} ${past.length === 1 ? "אירוע" : "אירועים"}`}
                />
                {past.map((t) => (
                  <PastTicketCard key={t.id} ticket={t} />
                ))}
              </>
            )}
          </>
        ) : (
          <EmptyState text="אין מודעות פעילות" />
        )}
      </div>

      {scanOpen && (
        <ScanModal ticket={scanOpen} onClose={() => setScanOpen(null)} />
      )}
    </MobileShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "40px 18px",
        textAlign: "center",
        color: "var(--tk-muted)",
        fontSize: 13,
        background: "var(--tk-paper)",
        border: "1px dashed var(--tk-line-strong)",
        borderRadius: 14,
      }}
    >
      {text}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  meta,
}: {
  kicker: string;
  title: string;
  meta?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "14px 2px 2px",
        marginTop: 4,
      }}
    >
      <div>
        <div
          className="tk-mono"
          style={{
            fontSize: 9,
            color: "var(--tk-muted)",
            letterSpacing: "0.14em",
            marginBottom: 2,
          }}
        >
          {kicker}
        </div>
        <div
          style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          {title}
        </div>
      </div>
      {meta && (
        <div
          className="tk-mono"
          style={{ fontSize: 10, color: "var(--tk-muted)" }}
        >
          {meta}
        </div>
      )}
    </div>
  );
}

function PosterBg({ src }: { src?: string }) {
  if (!src) return <div style={{ position: "absolute", inset: 0, background: "#1A1A1A" }} />;
  return (
    <Image
      src={encodeImageUrl(src)}
      alt=""
      fill
      sizes="100vw"
      style={{ objectFit: "cover" }}
      unoptimized
    />
  );
}

function Countdown({ date, time }: { date: string; time?: string }) {
  const ttl = timeUntil(date, time);
  const dim = { opacity: 0.6, fontWeight: 500 } as const;
  return (
    <div
      style={{
        background: "rgba(10,10,10,0.72)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
        borderRadius: 999,
        padding: "6px 10px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        whiteSpace: "nowrap",
        flexShrink: 0,
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "var(--tk-lime)",
          flexShrink: 0,
        }}
      />
      <span style={{ opacity: 0.7, fontWeight: 500 }}>בעוד</span>
      <span
        className="tk-mono"
        style={{
          fontWeight: 700,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        {ttl.days}
        <span style={dim}>י</span>
        {" "}
        {String(ttl.hours).padStart(2, "0")}
        <span style={dim}>ש</span>
        {" "}
        {String(ttl.mins).padStart(2, "0")}
        <span style={dim}>ד</span>
      </span>
    </div>
  );
}

function GlassStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        className="tk-mono"
        style={{ fontSize: 9, opacity: 0.7, letterSpacing: "0.12em" }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          marginTop: 2,
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function QrIcon({ size = 28, color = "#0A0A0A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5" height="5" stroke={color} strokeWidth="1.2" />
      <rect x="9.5" y="1.5" width="5" height="5" stroke={color} strokeWidth="1.2" />
      <rect x="1.5" y="9.5" width="5" height="5" stroke={color} strokeWidth="1.2" />
      <rect x="3.5" y="3.5" width="1" height="1" fill={color} />
      <rect x="11.5" y="3.5" width="1" height="1" fill={color} />
      <rect x="3.5" y="11.5" width="1" height="1" fill={color} />
      <rect x="9" y="9" width="2" height="2" fill={color} />
      <rect x="12.5" y="12.5" width="2" height="2" fill={color} />
      <rect x="9" y="13" width="2" height="1" fill={color} />
    </svg>
  );
}

function GlassTicketCard({
  ticket,
  onScan,
}: {
  ticket: MobileTicket;
  onScan: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        minHeight: 320,
        color: "#fff",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <PosterBg src={ticket.eventImageUrl} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,10,10,0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.25) 50%, rgba(10,10,10,0.45) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          minHeight: 320,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Countdown date={ticket.date} time={ticket.time} />
          {ticket.amount != null && (
            <div
              style={{
                background: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: 999,
                padding: "5px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10,
              }}
            >
              <span
                className="tk-mono"
                style={{ fontWeight: 700, fontSize: 12 }}
              >
                {nis(ticket.amount)}
              </span>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 14px rgba(0,0,0,0.55)",
            }}
          >
            {ticket.artist}
          </div>
          <div
            className="tk-mono"
            style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}
          >
            {hebDate(ticket.date)}
            {ticket.time ? ` · ${ticket.time}` : ""} · {abbrevCity(ticket.venue)}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 12,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 0 }}>
            <GlassStat label="אזור" value={ticket.section} />
            <div
              style={{ width: 1, background: "rgba(255,255,255,0.2)" }}
            />
            <GlassStat
              label="שורה"
              value={ticket.isStanding ? "עמידה" : ticket.row}
            />
            <div
              style={{ width: 1, background: "rgba(255,255,255,0.2)" }}
            />
            <GlassStat label="מושב" value={ticket.seat} />
          </div>
          <button
            onClick={onScan}
            aria-label="הצג כרטיס"
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              background: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <QrIcon size={30} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PastTicketCard({ ticket }: { ticket: MobileTicket }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        minHeight: 220,
        color: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: "grayscale(0.6)",
        }}
      >
        <PosterBg src={ticket.eventImageUrl} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 50%, rgba(10,10,10,0.65) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          minHeight: 220,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
              borderRadius: 999,
              padding: "6px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "rgba(255,255,255,0.6)",
              }}
            />
            <span style={{ opacity: 0.9, fontWeight: 600 }}>
              האירוע הסתיים
            </span>
          </div>
          <div
            className="tk-mono"
            style={{ fontSize: 10, opacity: 0.7 }}
          >
            {hebDate(ticket.date)}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ marginBottom: 10 }}>
          <div
            className="tk-mono"
            style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}
          >
            {abbrevCity(ticket.venue)}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 14px rgba(0,0,0,0.55)",
            }}
          >
            {ticket.artist}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 12,
            padding: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            <PastStat label="אזור" value={ticket.section} />
            <PastStat
              label="שורה"
              value={ticket.isStanding ? "עמידה" : ticket.row}
            />
            <PastStat label="מושב" value={ticket.seat} />
          </div>
          {ticket.amount != null ? (
            <div style={{ textAlign: "end" }}>
              <div
                className="tk-mono"
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                {nis(ticket.amount)}
              </div>
            </div>
          ) : (
            <div
              className="tk-mono"
              style={{
                fontSize: 9,
                opacity: 0.55,
                letterSpacing: "0.12em",
              }}
            >
              USED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PastStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="tk-mono"
        style={{ fontSize: 9, opacity: 0.65, letterSpacing: "0.12em" }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{value || "—"}</div>
    </div>
  );
}

function ScanModal({
  ticket,
  onClose,
}: {
  ticket: MobileTicket;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,10,10,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 320,
          background: "#fff",
          color: "#0A0A0A",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="סגור"
          style={{
            position: "absolute",
            top: 10,
            insetInlineEnd: 10,
            zIndex: 2,
            width: 30,
            height: 30,
            borderRadius: 999,
            background: "rgba(0,0,0,0.06)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Icon.x size={14} color="#0A0A0A" />
        </button>

        <div style={{ padding: "22px 20px 12px", textAlign: "center" }}>
          <div
            className="tk-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--tk-muted)",
              marginBottom: 6,
            }}
          >
            ◆ TIKET PASS
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {ticket.artist}
          </div>
          <div
            style={{ fontSize: 11, color: "var(--tk-muted)", marginTop: 2 }}
          >
            {hebDate(ticket.date)}
            {ticket.time ? ` · ${ticket.time}` : ""} · {abbrevCity(ticket.venue)}
          </div>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          {ticket.ticketImage ? (
            <div
              style={{
                width: "100%",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #eee",
                background: "#f7f7f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 220,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.ticketImage}
                alt="כרטיס"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  maxHeight: "60vh",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: "40px 12px",
                textAlign: "center",
                color: "var(--tk-muted)",
                fontSize: 12,
                border: "1px dashed var(--tk-line-strong)",
                borderRadius: 12,
              }}
            >
              אין תמונת כרטיס
            </div>
          )}

          {ticket.ticketImage && (
            <a
              href={ticket.ticketImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 12,
                display: "block",
                width: "100%",
                background: "var(--tk-blue)",
                color: "#fff",
                textAlign: "center",
                padding: "12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              הורד כרטיס
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
