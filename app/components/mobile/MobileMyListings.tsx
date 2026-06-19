"use client";

import React, { useState } from "react";
import Image from "next/image";
import MobileShell from "./MobileShell";
import { hebDate, nis } from "./format";
import { encodeImageUrl } from "@/utils/defaultImages";

export type MobileListing = {
  id: string;
  artist: string;
  date: string;
  time?: string;
  venue: string;
  section?: string;
  row?: string | number;
  seat?: string | number;
  isStanding?: boolean;
  askingPrice: number;
  status:
    | "active"
    | "pending"
    | "rejected"
    | "sold";
  rejectionReason?: string;
  eventImageUrl?: string;
};

type Tab = "active" | "pending" | "rejected" | "sold";

export default function MobileMyListings({
  listings,
  loading,
  notSignedIn,
  onCancel,
}: {
  listings: MobileListing[];
  loading: boolean;
  notSignedIn?: boolean;
  onCancel?: (id: string) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const [confirm, setConfirm] = useState<MobileListing | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = {
    active: listings.filter((l) => l.status === "active"),
    pending: listings.filter((l) => l.status === "pending"),
    rejected: listings.filter((l) => l.status === "rejected"),
    sold: listings.filter((l) => l.status === "sold"),
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "active", label: "פעילות", count: groups.active.length },
    { id: "pending", label: "ממתינות", count: groups.pending.length },
    { id: "rejected", label: "נדחו", count: groups.rejected.length },
    { id: "sold", label: "נמכרו", count: groups.sold.length },
  ];

  const list = groups[tab];

  return (
    <MobileShell>
      <div
        style={{
          padding: "14px 18px 14px",
          borderBottom: "1px solid var(--tk-line)",
        }}
      >
        <div
          style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          המודעות שלי
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
            overflowX: "auto",
          }}
        >
          {tabs.map(({ id, label, count }) => {
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
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    className="tk-mono"
                    style={{
                      fontSize: 9,
                      opacity: active ? 0.7 : 0.5,
                    }}
                  >
                    {count}
                  </span>
                )}
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
          <EmptyBox text="התחבר כדי לראות את המודעות שלך" />
        ) : loading ? (
          <div
            style={{
              padding: "40px 18px",
              textAlign: "center",
              color: "var(--tk-muted)",
              fontSize: 13,
            }}
          >
            טוען מודעות…
          </div>
        ) : list.length === 0 ? (
          <EmptyBox
            text={
              tab === "active"
                ? "אין מודעות פעילות"
                : tab === "pending"
                  ? "אין מודעות הממתינות לאישור"
                  : tab === "rejected"
                    ? "אין מודעות שנדחו"
                    : "אין מודעות שנמכרו"
            }
          />
        ) : (
          list.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              onCancel={onCancel ? () => setConfirm(l) : undefined}
            />
          ))
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            if (!onCancel) return;
            setBusy(true);
            try {
              await onCancel(confirm.id);
            } finally {
              setBusy(false);
              setConfirm(null);
            }
          }}
        />
      )}
    </MobileShell>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "24px 18px",
        textAlign: "center",
        background: "var(--tk-paper)",
        border: "1px dashed var(--tk-line-strong)",
        borderRadius: 14,
        color: "var(--tk-muted)",
        fontSize: 12,
      }}
    >
      {text}
    </div>
  );
}

function ListingCard({
  listing: l,
  onCancel,
}: {
  listing: MobileListing;
  onCancel?: () => void;
}) {
  const seat = l.isStanding ? "עמידה" : l.seat ?? "—";
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        minHeight: 260,
        color: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: l.status === "sold" ? "grayscale(0.6)" : undefined,
        }}
      >
        {l.eventImageUrl ? (
          <Image
            src={encodeImageUrl(l.eventImageUrl)}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#1A1A1A" }} />
        )}
      </div>
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.22)" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.5) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          minHeight: 260,
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
          <StatusPill status={l.status} onCancel={onCancel} />
          <div
            className="tk-mono"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 999,
              padding: "6px 10px",
            }}
          >
            {nis(l.askingPrice)}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 14px rgba(0,0,0,0.55)",
            }}
          >
            {l.artist}
          </div>
          <div
            className="tk-mono"
            style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}
          >
            {hebDate(l.date)}
            {l.time ? ` · ${l.time}` : ""} · {l.venue}
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
            <SmallStat label="אזור" value={l.section || "—"} />
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
            <SmallStat label="שורה" value={l.row ?? "—"} />
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
            <SmallStat label="מושב" value={seat} />
          </div>
        </div>

        {l.status === "rejected" && l.rejectionReason && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 10,
            }}
          >
            <div
              className="tk-mono"
              style={{
                fontSize: 9,
                opacity: 0.8,
                letterSpacing: "0.12em",
                marginBottom: 4,
              }}
            >
              סיבת דחייה
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.6 }}>
              {l.rejectionReason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  status,
  onCancel,
}: {
  status: MobileListing["status"];
  onCancel?: () => void;
}) {
  if (status === "active" && onCancel) {
    return (
      <button
        onClick={onCancel}
        style={{
          background: "rgba(10,10,10,0.72)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          borderRadius: 999,
          padding: "6px 10px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--tk-lime)",
          }}
        />
        <span style={{ opacity: 0.9, fontWeight: 600 }}>בטל מכירה</span>
      </button>
    );
  }
  const map: Record<MobileListing["status"], { label: string; dot: string }> = {
    active: { label: "פעיל", dot: "var(--tk-lime)" },
    pending: { label: "ממתין לאישור", dot: "#F4E4A6" },
    rejected: { label: "נדחה", dot: "#E5715C" },
    sold: { label: "נמכר", dot: "var(--tk-lime)" },
  };
  const s = map[status];
  return (
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
          background: s.dot,
        }}
      />
      <span style={{ opacity: 0.9, fontWeight: 600 }}>{s.label}</span>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
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
        {value}
      </div>
    </div>
  );
}

function ConfirmDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,10,10,0.55)",
        backdropFilter: "blur(8px)",
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
          background: "var(--tk-paper)",
          color: "var(--tk-ink)",
          borderRadius: 16,
          padding: "20px 20px 16px",
          border: "1px solid var(--tk-line-strong)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div
          className="tk-mono"
          style={{
            fontSize: 9,
            color: "var(--tk-blue)",
            letterSpacing: "0.14em",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          ◆ אישור פעולה
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          לבטל את המכירה?
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--tk-muted)",
            textAlign: "center",
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          המודעה תוסר מ-Tiket והכרטיס יחזור לכרטיסים הקרובים שלך.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid var(--tk-line-strong)",
              color: "var(--tk-ink)",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: busy ? "default" : "pointer",
            }}
          >
            חזור
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              background: "var(--tk-blue)",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "מבטל…" : "כן, בטל"}
          </button>
        </div>
      </div>
    </div>
  );
}
