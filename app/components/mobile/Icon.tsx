// SVG icons used across the mobile redesign. Shapes match the unified design
// package (24-viewBox, round caps). Legacy keys (chev, shield, lock, pin,
// clock, filter) are kept so non-migrated screens keep rendering.
import React from "react";

type IconProps = { size?: number; color?: string };

const sv = (size: number, color: string, w = 1.75) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: color,
  strokeWidth: w,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Icon = {
  search: ({ size = 20, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  sliders: ({ size = 20, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  ),
  chev: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 2)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  chevL: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 2)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  chevR: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 2)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  chevDown: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 2)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  shield: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 1.4)}>
      <path d="M12 2.5l8 3v6.3c0 4.5-3.3 8.4-8 10.2-4.7-1.8-8-5.7-8-10.2V5.5l8-3z" />
      <path d="M8.5 12l2.5 2.5L16 9.5" />
    </svg>
  ),
  lock: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 1.4)}>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
      <path d="M7.5 10.5V7.5a4.5 4.5 0 019 0v3" />
    </svg>
  ),
  heart: ({ size = 20, color = "currentColor", fill = "none" }: IconProps & { fill?: string }) => (
    <svg {...sv(size, color)} fill={fill}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
  pin: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 1.4)}>
      <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.6" />
    </svg>
  ),
  cal: ({ size = 18, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  ),
  clock: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 1.4)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
  filter: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  ),
  x: ({ size = 20, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  check: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 2.2)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  user: ({ size = 22, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" />
    </svg>
  ),
  wallet: ({ size = 22, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M16 12.5h2M3 9.5h18" />
    </svg>
  ),
  ticket: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M14 6v12" strokeDasharray="2 2.5" />
    </svg>
  ),
  home: ({ size = 22, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color)}>
      <path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
    </svg>
  ),
  plus: ({ size = 22, color = "currentColor" }: IconProps) => (
    <svg {...sv(size, color, 2.2)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};
