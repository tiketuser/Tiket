"use client";

import React, { useRef, useState } from "react";
import { nis, hebDate } from "./format";

export const PRICE_MIN = 80;
export const PRICE_MAX = 500;

export type FilterState = {
  priceMin: number;
  priceMax: number;
  city: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_FILTERS: FilterState = {
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  city: "הכל",
  venue: "הכל",
  dateFrom: "",
  dateTo: "",
};

export function countActiveFilters(f: FilterState): number {
  return (
    (f.priceMin > PRICE_MIN ? 1 : 0) +
    (f.priceMax < PRICE_MAX ? 1 : 0) +
    (f.city !== "הכל" ? 1 : 0) +
    (f.venue !== "הכל" ? 1 : 0) +
    (f.dateFrom || f.dateTo ? 1 : 0)
  );
}

// ─── Chevron ─────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--tk-muted)",
        flexShrink: 0,
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform .15s",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Dropdown ────────────────────────────────────────────
function Dropdown({
  value,
  options,
  onChange,
  fullWidth,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid " + (open ? "var(--tk-blue)" : "var(--tk-line-strong)"),
          background: "var(--tk-paper)",
          textAlign: "inherit",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 14,
          fontFamily: "inherit",
          width: fullWidth ? "100%" : "100%",
          cursor: "pointer",
          gap: 8,
        }}
      >
        <span style={{ color: value === "הכל" ? "var(--tk-muted)" : "var(--tk-ink)" }}>
          {value}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            zIndex: 10,
            background: "var(--tk-paper)",
            border: "1px solid var(--tk-line-strong)",
            borderRadius: 12,
            maxHeight: 200,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                textAlign: "inherit",
                background: o === value ? "rgba(181,70,83,0.08)" : "transparent",
                color: o === value ? "var(--tk-blue)" : "var(--tk-ink)",
                fontSize: 13,
                fontFamily: "inherit",
                fontWeight: o === value ? 600 : 400,
                borderBottom: "1px solid var(--tk-line)",
                cursor: "pointer",
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Date field ──────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tk-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

const HEB_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HEB_DAYS   = ["א","ב","ג","ד","ה","ו","ש"]; // Sun–Sat (RTL: א rightmost)

function HebrewCalendar({ dateFrom, dateTo, onSelect }: {
  dateFrom: string;
  dateTo: string;
  onSelect: (from: string, to: string) => void;
}) {
  const now    = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const parseD = (s: string) => {
    if (!s) return null;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])) : null;
  };
  const selFrom = parseD(dateFrom);
  const selTo   = parseD(dateTo);

  const [viewY, setViewY] = useState(selFrom?.getFullYear() ?? todayY);
  const [viewM, setViewM] = useState(selFrom?.getMonth() ?? todayM);

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstDow    = new Date(viewY, viewM, 1).getDay();

  const cells: (number | null)[] = [...Array(firstDow).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevM = () => {
    if (viewM === 0) { setViewY((y) => y - 1); setViewM(11); }
    else setViewM((m) => m - 1);
  };
  const nextM = () => {
    if (viewM === 11) { setViewY((y) => y + 1); setViewM(0); }
    else setViewM((m) => m + 1);
  };

  const fmt = (d: number) =>
    `${String(d).padStart(2,"0")}/${String(viewM+1).padStart(2,"0")}/${viewY}`;

  const pick = (d: number) => {
    const date = new Date(viewY, viewM, d);
    if (date < new Date(todayY, todayM, todayD)) return;
    const ds = fmt(d);
    if (!dateFrom || (dateFrom && dateTo)) {
      onSelect(ds, "");
    } else if (date >= (selFrom ?? date)) {
      onSelect(dateFrom, ds);
    } else {
      onSelect(ds, "");
    }
  };

  const cellDate = (d: number) => new Date(viewY, viewM, d);
  const isEndpoint = (d: number) => {
    const cd = cellDate(d);
    return (selFrom && +cd === +selFrom) || (selTo && +cd === +selTo);
  };
  const inRange = (d: number) => {
    if (!selFrom || !selTo) return false;
    const cd = cellDate(d);
    return cd > selFrom && cd < selTo;
  };
  const isToday = (d: number) => d === todayD && viewM === todayM && viewY === todayY;
  const isPast  = (d: number) => cellDate(d) < new Date(todayY, todayM, todayD);

  return (
    <div style={{ background:"var(--tk-paper)", borderRadius:16, border:"1px solid var(--tk-line-strong)", padding:"16px 12px", marginTop:8 }}>
      {/* Month nav — left=prev(‹), right=next(›) */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <button onClick={prevM} style={{ fontSize:20, lineHeight:1, color:"var(--tk-muted)", background:"none", border:"none", cursor:"pointer", padding:"0 6px" }}>‹</button>
        <span style={{ fontWeight:700, fontSize:14 }}>{HEB_MONTHS[viewM]} {viewY}</span>
        <button onClick={nextM} style={{ fontSize:20, lineHeight:1, color:"var(--tk-muted)", background:"none", border:"none", cursor:"pointer", padding:"0 6px" }}>›</button>
      </div>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
        {HEB_DAYS.map((h) => (
          <div key={h} style={{ textAlign:"center", fontSize:11, color:"var(--tk-muted)", fontWeight:600, paddingBottom:6 }}>{h}</div>
        ))}
      </div>
      {/* Date cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", rowGap:2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const end  = isEndpoint(d);
          const mid  = inRange(d);
          const past = isPast(d);
          return (
            <div key={i} style={{ display:"flex", justifyContent:"center", background: mid ? "rgba(181,70,83,0.09)" : "transparent" }}>
              <button
                onClick={() => pick(d)}
                style={{
                  width:34, height:34, borderRadius:8, padding:0,
                  border: isToday(d) && !end ? "1.5px solid var(--tk-blue)" : "1.5px solid transparent",
                  background: end ? "var(--tk-blue)" : "transparent",
                  color: end ? "#fff" : past ? "var(--tk-line-strong)" : "var(--tk-ink)",
                  fontSize:13, fontWeight: end ? 700 : 400,
                  cursor: past ? "default" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>
      {/* Range hint */}
      {dateFrom && !dateTo && (
        <div style={{ marginTop:10, textAlign:"center", fontSize:11, color:"var(--tk-muted)" }}>
          בחר תאריך סיום
        </div>
      )}
    </div>
  );
}

function DateField({ dateFrom, dateTo, onChange }: {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasValue = !!(dateFrom || dateTo);
  const label = dateFrom
    ? dateTo
      ? `${hebDate(dateFrom)} – ${hebDate(dateTo)}`
      : hebDate(dateFrom)
    : "בחר תאריך";

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding:"12px 14px", borderRadius:12,
          border:"1px solid " + (open ? "var(--tk-blue)" : "var(--tk-line-strong)"),
          background:"var(--tk-paper)", textAlign:"inherit",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          fontSize:14, fontFamily:"inherit", width:"100%", cursor:"pointer",
        }}
      >
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          <CalendarIcon />
          <span style={{ color: hasValue ? "var(--tk-ink)" : "var(--tk-muted)" }}>{label}</span>
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
          {hasValue && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange("", ""); }}
              style={{ fontSize:11, color:"var(--tk-blue)", fontWeight:600, cursor:"pointer" }}
            >
              נקה
            </span>
          )}
          <Chevron open={open} />
        </span>
      </button>
      {open && (
        <HebrewCalendar
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSelect={(from, to) => {
            onChange(from, to);
            if (from && to) setOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Price range slider ───────────────────────────────────
function PriceRange({
  valueMin,
  valueMax,
  onChange,
}: {
  valueMin: number;
  valueMax: number;
  onChange: (lo: number, hi: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"lo" | "hi" | null>(null);

  const pct = (v: number) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const loP = pct(valueMin);
  const hiP = pct(valueMax);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.round(PRICE_MIN + ratio * (PRICE_MAX - PRICE_MIN));
    if (dragRef.current === "lo") {
      onChange(Math.min(v, valueMax - 10), valueMax);
    } else {
      onChange(valueMin, Math.max(v, valueMin + 10));
    }
  };

  const thumbStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 22,
    height: 22,
    borderRadius: 6,
    background: "var(--tk-blue)",
    border: "none",
    boxShadow: "0 2px 6px rgba(181,70,83,0.35)",
    cursor: "grab",
    touchAction: "none",
    padding: 0,
    margin: 0,
    zIndex: 2,
  };

  return (
    <div>
      {/* Current values — direction:ltr so left=min, right=max matches thumb positions */}
      <div
        className="tk-mono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          direction: "ltr",
          fontSize: 12,
          marginBottom: 16,
          color: "var(--tk-ink)",
        }}
      >
        <span>{nis(valueMin)}</span>
        <span style={{ color: "var(--tk-muted)" }}>—</span>
        <span>{nis(valueMax)}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
        style={{ position: "relative", height: 26, touchAction: "none" }}
      >
        {/* Base track */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: 4,
            background: "var(--tk-line-strong)",
            borderRadius: 2,
          }}
        />
        {/* Active fill — physical left/right so it ignores page RTL direction */}
        <div
          style={{
            position: "absolute",
            left: `${loP}%`,
            right: `${100 - hiP}%`,
            top: "50%",
            transform: "translateY(-50%)",
            height: 4,
            background: "var(--tk-blue)",
            borderRadius: 2,
          }}
        />
        {/* Lo thumb — physical left */}
        <button
          onPointerDown={(e) => {
            dragRef.current = "lo";
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          style={{ ...thumbStyle, left: `${loP}%` }}
        />
        {/* Hi thumb — physical left */}
        <button
          onPointerDown={(e) => {
            dragRef.current = "hi";
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          style={{ ...thumbStyle, left: `${hiP}%` }}
        />
      </div>

      {/* Range endpoint labels */}
      <div
        className="tk-mono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          direction: "ltr",
          fontSize: 11,
          marginTop: 6,
          color: "var(--tk-muted)",
        }}
      >
        <span>{nis(PRICE_MIN)}</span>
        <span>{nis(PRICE_MAX)}</span>
      </div>
    </div>
  );
}

// ─── Sheet ───────────────────────────────────────────────
export default function MobileFilterSheet({
  draft,
  setDraft,
  cities,
  venues,
  onClose,
  onApply,
  onReset,
}: {
  draft: FilterState;
  setDraft: React.Dispatch<React.SetStateAction<FilterState>>;
  cities: string[];
  venues: string[];
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--tk-bg)",
          width: "100%",
          borderRadius: "24px 24px 0 0",
          padding: `14px 20px calc(32px + env(safe-area-inset-bottom, 0px))`,
          maxHeight: "88dvh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: "var(--tk-line-strong)",
            borderRadius: 4,
            margin: "0 auto 18px",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>
            סינון
          </div>
          <button
            onClick={onReset}
            style={{
              fontSize: 13,
              color: "var(--tk-blue)",
              fontWeight: 600,
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
            }}
          >
            איפוס
          </button>
        </div>

        {/* Price range */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            טווח מחיר
          </div>
          <PriceRange
            valueMin={draft.priceMin}
            valueMax={draft.priceMax}
            onChange={(lo, hi) =>
              setDraft((d) => ({ ...d, priceMin: lo, priceMax: hi }))
            }
          />
        </div>

        {/* City + Venue */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>עיר</div>
            <Dropdown
              value={draft.city}
              options={["הכל", ...cities]}
              onChange={(v) => setDraft((d) => ({ ...d, city: v }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>אולם</div>
            <Dropdown
              value={draft.venue}
              options={["הכל", ...venues]}
              onChange={(v) => setDraft((d) => ({ ...d, venue: v }))}
            />
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>תאריך</div>
          <DateField
            dateFrom={draft.dateFrom}
            dateTo={draft.dateTo}
            onChange={(from, to) => setDraft((d) => ({ ...d, dateFrom: from, dateTo: to }))}
          />
        </div>

        {/* Apply */}
        <button
          onClick={onApply}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 14,
            background: "var(--tk-ink)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          החל סינון
        </button>
      </div>
    </div>
  );
}
