"use client";

import React from "react";
import { Icon } from "./Icon";

export default function MobileSearchBar({
  value,
  onChange,
  onSubmit,
  onOpenFilter,
  activeFilterCount = 0,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  onOpenFilter?: () => void;
  activeFilterCount?: number;
}) {
  return (
    <div style={{ padding: "6px 18px 10px", display: "flex", gap: 8 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          background: "var(--tk-paper)",
          border: "1px solid var(--tk-line-strong)",
          borderRadius: 14,
          padding: "11px 14px",
        }}
      >
        <Icon.search size={16} color="var(--tk-muted)" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="חפש הופעה, אמן או עיר"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            fontFamily: "inherit",
            color: "var(--tk-ink)",
            minWidth: 0,
          }}
        />
      </form>
      {onOpenFilter && (
        <button
          onClick={onOpenFilter}
          aria-label="סינון"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "0 14px",
            borderRadius: 14,
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 600,
            border:
              "1px solid " +
              (activeFilterCount ? "var(--tk-blue)" : "var(--tk-line-strong)"),
            background: activeFilterCount ? "var(--tk-blue)" : "var(--tk-paper)",
            color: activeFilterCount ? "#fff" : "var(--tk-ink)",
          }}
        >
          <Icon.filter
            size={14}
            color={activeFilterCount ? "#fff" : "currentColor"}
          />
          {activeFilterCount > 0 && (
            <span className="tk-mono">{activeFilterCount}</span>
          )}
        </button>
      )}
    </div>
  );
}
