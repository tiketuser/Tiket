"use client";

import React from "react";

export const MOBILE_CATEGORIES = [
  { id: "music", cat: "מוזיקה", label: "מוזיקה" },
  { id: "standup", cat: "סטנדאפ", label: "סטנדאפ" },
  { id: "theatre", cat: "תיאטרון", label: "תיאטרון" },
  { id: "sport", cat: "ספורט", label: "ספורט" },
  { id: "kids", cat: "ילדים", label: "ילדים" },
] as const;

export default function MobileCategoryRow({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}) {
  return (
    <div
      style={{
        padding: "4px 12px 14px",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 6,
        color: "var(--tk-muted)",
        fontSize: 10,
        height: 55,
      }}
    >
      {MOBILE_CATEGORIES.map((c) => {
        const active = selected === c.cat;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(active ? null : c.cat)}
            style={{
              padding: "10px 4px",
              borderRadius: 14,
              background: active ? "var(--tk-ink)" : "var(--tk-paper)",
              border:
                "1px solid " +
                (active ? "var(--tk-ink)" : "var(--tk-line-strong)"),
              fontSize: 12,
              fontWeight: 600,
              color: active ? "#fff" : "var(--tk-ink)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
