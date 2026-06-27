// SVG icons used across the mobile redesign. Ported from the design package.
import React from "react";

type IconProps = { size?: number; color?: string };

export const Icon = {
  search: ({ size = 20, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke={color} strokeWidth="1.8" />
      <path d="M13.5 13.5L18 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  chev: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M10 4l-4 4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevDown: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shield: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l5.5 2v4.2c0 3-2.2 5.6-5.5 6.8C4.7 13.3 2.5 10.7 2.5 7.7V3.5L8 1.5z" stroke={color} strokeWidth="1.3" fill="none" />
      <path d="M5.5 8l1.7 1.7L10.5 6.4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lock: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="1.2" stroke={color} strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 016 0v2" stroke={color} strokeWidth="1.3" />
    </svg>
  ),
  heart: ({ size = 16, color = "currentColor", fill = "none" }: IconProps & { fill?: string }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={fill}>
      <path d="M8 13.5S2 10 2 6a3 3 0 015.5-1.6A3 3 0 0113 6c0 4-5 7.5-5 7.5z" stroke={color} strokeWidth="1.3" />
    </svg>
  ),
  pin: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 14s5-4.5 5-8.5A5 5 0 003 5.5C3 9.5 8 14 8 14z" stroke={color} strokeWidth="1.3" />
      <circle cx="8" cy="5.5" r="1.8" stroke={color} strokeWidth="1.3" />
    </svg>
  ),
  cal: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="10" rx="1.2" stroke={color} strokeWidth="1.3" />
      <path d="M2 6.5h12M5 2v3M11 2v3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  clock: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3" />
      <path d="M8 4.5V8l2.5 1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  filter: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M4 8h8M6 12h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  x: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  user: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke={color} strokeWidth="1.3" />
      <path d="M3 14c1-2.5 3-4 5-4s4 1.5 5 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  wallet: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4.5C2.5 3.7 3.2 3 4 3h7c0.5 0 1 0.4 1 1v1.5" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <rect x="1.5" y="5" width="12.5" height="8.5" rx="1.4" stroke={color} strokeWidth="1.3" />
      <path d="M14 8.5h-2.5a1.5 1.5 0 000 3H14" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="11.5" cy="10" r="0.7" fill={color} />
    </svg>
  ),
  ticket: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 5.5a1 1 0 011-1h10a1 1 0 011 1v1.2a1.3 1.3 0 000 2.6v1.2a1 1 0 01-1 1H3a1 1 0 01-1-1V9.3a1.3 1.3 0 000-2.6V5.5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 4.8v1M9 7.5v1M9 10.2v1" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
  home: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2.5 7L8 2.5 13.5 7v6.5a.5.5 0 01-.5.5h-3v-4h-4v4h-3a.5.5 0 01-.5-.5V7z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  plus: ({ size = 16, color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};
