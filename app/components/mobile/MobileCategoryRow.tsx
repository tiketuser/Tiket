"use client";

import React from "react";

export const MOBILE_CATEGORIES = [
  { id: "music", cat: "מוזיקה", label: "מוזיקה" },
  { id: "standup", cat: "סטנדאפ", label: "סטנדאפ" },
  { id: "theatre", cat: "תיאטרון", label: "תיאטרון" },
  { id: "sport", cat: "ספורט", label: "ספורט" },
  { id: "kids", cat: "ילדים", label: "ילדים" },
] as const;

const svg = (c: string) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const CAT_ICONS: Record<string, (c: string) => React.ReactElement> = {
  music: (c) => (
    <svg {...svg(c)}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  ),
  standup: (c) => (
    <svg {...svg(c)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </svg>
  ),
  theatre: (c) => (
    <svg {...svg(c)}>
      <path d="M3.5 4.5h11v5.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M7 8.5h.01M11 8.5h.01M7 12c1.1.9 2.9.9 4 0" />
      <path d="M14.5 9h6v4.5a5.2 5.2 0 0 1-8.6 3.9" />
    </svg>
  ),
  sport: (c) => (
    <svg {...svg(c)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5M12 3.5C9.6 5.8 8.3 8.7 8.3 12s1.3 6.2 3.7 8.5" />
    </svg>
  ),
  kids: (c) => (
    <svg {...svg(c)}>
      <path d="M12 15c-3.2 0-5.5-3-5.5-6a5.5 5.5 0 0 1 11 0c0 3-2.3 6-5.5 6z" />
      <path d="M11 16.5h2L12 15zM12 16.5c0 2.2-2 2.3-2 4.5" />
    </svg>
  ),
};

export default function MobileCategoryRow({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        padding: "10px 12px 0",
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0,1fr))",
      }}
    >
      {MOBILE_CATEGORIES.map((c) => {
        const on = selected === c.cat;
        const col = on ? "var(--ink)" : "var(--muted)";
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(on ? null : c.cat)}
            style={{
              position: "relative",
              height: 62,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              color: col,
              background: "transparent",
              border: 0,
              cursor: "pointer",
              transition: "color .15s",
            }}
          >
            {CAT_ICONS[c.id](col)}
            <span style={{ fontSize: 12, fontWeight: on ? 600 : 500 }}>
              {c.label}
            </span>
            <span
              style={{
                position: "absolute",
                bottom: 0,
                left: "22%",
                right: "22%",
                height: 2,
                borderRadius: 2,
                background: "var(--ink)",
                transform: on ? "scaleX(1)" : "scaleX(0)",
                transition: "transform .2s",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
