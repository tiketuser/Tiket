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
    <div style={{ padding: "4px 20px 0" }}>
      <div
        style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingInlineStart: 16,
          paddingInlineEnd: 6,
          borderRadius: 14,
          background: "var(--surface-2)",
        }}
      >
        <Icon.search size={19} color="var(--ink-2)" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit?.();
          }}
          placeholder="חפש הופעה, אמן או עיר"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: 0,
            outline: "none",
            background: "transparent",
            fontSize: 15,
            fontFamily: "inherit",
            color: "var(--ink)",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="נקה"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--faint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: 0,
              cursor: "pointer",
            }}
          >
            <Icon.x size={12} color="#fff" />
          </button>
        )}
        {onOpenFilter && (
          <>
            <span style={{ width: 1, height: 22, background: "var(--line-strong)" }} />
            <button
              type="button"
              className="press"
              onClick={onOpenFilter}
              aria-label="סינון"
              style={{
                position: "relative",
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: activeFilterCount ? "var(--ink)" : "transparent",
                border: 0,
                cursor: "pointer",
              }}
            >
              <Icon.sliders size={19} color={activeFilterCount ? "#fff" : "var(--ink)"} />
              {activeFilterCount > 0 && (
                <span
                  className="num"
                  style={{
                    position: "absolute",
                    top: -4,
                    left: -4,
                    minWidth: 17,
                    height: 17,
                    padding: "0 4px",
                    borderRadius: 9,
                    background: "var(--brand)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 2px var(--surface-2)",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
