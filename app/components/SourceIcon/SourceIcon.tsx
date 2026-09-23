import React from "react";

/** Hebrew names for the campaign channels the middleware records. */
export const SOURCE_LABELS: Record<string, string> = {
  instagram: "אינסטגרם",
  facebook: "פייסבוק",
  x: "X",
  tiktok: "טיקטוק",
  whatsapp: "וואטסאפ",
  telegram: "טלגרם",
  linkedin: "לינקדאין",
  youtube: "יוטיוב",
  snapchat: "סנאפצ׳אט",
  reddit: "רדיט",
  google: "גוגל",
  newsletter: "ניוזלטר",
  email: "אימייל",
  qr: "QR",
  poster: "פוסטר",
  flyer: "פלייר",
};

export function sourceLabel(source: string): string {
  if (!source) return "ישיר";
  return SOURCE_LABELS[source] ?? source;
}

/** Badge fill per channel, with the ink that stays legible on it. */
const SOURCE_COLORS: Record<string, { bg: string; ink: string }> = {
  instagram: { bg: "#E1306C", ink: "#fff" },
  facebook: { bg: "#1877F2", ink: "#fff" },
  x: { bg: "#111111", ink: "#fff" },
  tiktok: { bg: "#FE2C55", ink: "#fff" },
  whatsapp: { bg: "#25D366", ink: "#fff" },
  telegram: { bg: "#229ED9", ink: "#fff" },
  linkedin: { bg: "#0A66C2", ink: "#fff" },
  youtube: { bg: "#FF0000", ink: "#fff" },
  snapchat: { bg: "#FFFC00", ink: "#1A1A1A" },
  reddit: { bg: "#FF4500", ink: "#fff" },
  google: { bg: "#4285F4", ink: "#fff" },
  newsletter: { bg: "#6366f1", ink: "#fff" },
  email: { bg: "#6366f1", ink: "#fff" },
  qr: { bg: "#3C3E5F", ink: "#fff" },
  poster: { bg: "#8C5A5F", ink: "#fff" },
  flyer: { bg: "#8C5A5F", ink: "#fff" },
};

const FALLBACK = { bg: "#98A2B3", ink: "#fff" };

/** Glyphs are drawn from primitives in a 16x16 box, matching the hand-drawn
 *  icon set in components/mobile/Icon.tsx rather than pasted brand artwork. */
function glyph(source: string, ink: string) {
  switch (source) {
    case "instagram":
      return (
        <>
          <rect x="3.2" y="3.2" width="9.6" height="9.6" rx="3" stroke={ink} strokeWidth="1.3" />
          <circle cx="8" cy="8" r="2.5" stroke={ink} strokeWidth="1.3" />
          <circle cx="11" cy="5" r="0.8" fill={ink} />
        </>
      );
    case "facebook":
      return (
        <path
          d="M10.7 4.1H9.4C7.9 4.1 7 5 7 6.5V7.6H5.6v2H7v3.9h2.2V9.6h1.5l.3-2H9.2V6.7c0-.5.2-.7.7-.7h.8z"
          fill={ink}
        />
      );
    case "x":
      return (
        <>
          <path d="M4.6 4.6l6.8 6.8M11.4 4.6l-6.8 6.8" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />
        </>
      );
    case "tiktok":
      return (
        <>
          <circle cx="6.4" cy="10.8" r="2.1" stroke={ink} strokeWidth="1.3" />
          <path d="M8.5 10.8V3.6c.6 1.6 1.8 2.5 3.4 2.6" stroke={ink} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case "whatsapp":
      return (
        <>
          <path
            d="M8 3.1a4.9 4.9 0 00-4.2 7.4l-.7 2.4 2.5-.7A4.9 4.9 0 108 3.1z"
            stroke={ink}
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M6.4 6.2c.3-.1.5 0 .6.3l.4.9-.5.6c.3.6.8 1.1 1.4 1.4l.6-.5.9.4c.3.1.4.3.3.6-.2.6-.9.9-1.6.7A4.6 4.6 0 015.7 7.8c-.2-.7.1-1.4.7-1.6z"
            fill={ink}
          />
        </>
      );
    case "telegram":
      return (
        <path
          d="M13.2 3.6L2.9 7.9c-.4.2-.4.6 0 .7l2.6.8 1 3c.1.4.4.4.6.1l1.4-1.6 2.6 1.9c.3.2.6.1.7-.3l1.9-8.4c.1-.4-.2-.6-.5-.5zM6.1 9l4.9-3.2-3.9 4.1-.2 1.9z"
          fill={ink}
        />
      );
    case "linkedin":
      return (
        <>
          <circle cx="4.9" cy="4.4" r="1.15" fill={ink} />
          <rect x="3.95" y="6.5" width="1.9" height="6" fill={ink} />
          <path
            d="M7.5 12.5v-6h1.8v.8c.4-.6 1-.9 1.8-.9 1.4 0 2.3.9 2.3 2.5v3.6h-1.9V9.3c0-.8-.3-1.2-1-1.2s-1.2.5-1.2 1.3v3.1z"
            fill={ink}
          />
        </>
      );
    case "youtube":
      return (
        <>
          <rect x="2.4" y="4.4" width="11.2" height="7.2" rx="2.2" stroke={ink} strokeWidth="1.3" />
          <path d="M7 6.5l3.4 1.5L7 9.5z" fill={ink} />
        </>
      );
    case "snapchat":
      return (
        <path
          d="M8 3.2c1.9 0 3 1.3 3 3.1v1.4c.4.2.9.2 1.3.1.4-.1.6.4.2.7-.4.3-.9.5-1.3.6.3.9 1.2 1.5 2 1.6.4.1.4.5 0 .7-.5.3-1.2.4-1.6.5-.1.2-.1.5-.3.6-.3.2-.9 0-1.4 0-.6 0-1.2.6-1.9.6s-1.3-.6-1.9-.6c-.5 0-1.1.2-1.4 0-.2-.1-.2-.4-.3-.6-.4-.1-1.1-.2-1.6-.5-.4-.2-.4-.6 0-.7.8-.1 1.7-.7 2-1.6-.4-.1-.9-.3-1.3-.6-.4-.3-.2-.8.2-.7.4.1.9.1 1.3-.1V6.3c0-1.8 1.1-3.1 3-3.1z"
          fill={ink}
        />
      );
    case "reddit":
      return (
        <>
          <circle cx="8" cy="9.3" r="4.2" stroke={ink} strokeWidth="1.3" />
          <circle cx="6.4" cy="9" r="0.85" fill={ink} />
          <circle cx="9.6" cy="9" r="0.85" fill={ink} />
          <path d="M6.3 11.2c1 .7 2.4.7 3.4 0" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M9.6 5.3l1.5-1.4" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="11.9" cy="3.2" r="0.9" fill={ink} />
        </>
      );
    case "google":
      return (
        <path
          d="M12.4 8.2c0-.3 0-.6-.1-.9H8v1.8h2.5a2.2 2.2 0 01-2.5 1.6 2.7 2.7 0 110-5.4c.7 0 1.3.3 1.7.7l1.3-1.3A4.5 4.5 0 108 12.5c2.6 0 4.4-1.8 4.4-4.3z"
          fill={ink}
        />
      );
    case "newsletter":
    case "email":
      return (
        <>
          <rect x="2.6" y="4.2" width="10.8" height="7.6" rx="1.6" stroke={ink} strokeWidth="1.3" />
          <path d="M3.2 5.4L8 8.6l4.8-3.2" stroke={ink} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="4" height="4" rx="1" stroke={ink} strokeWidth="1.2" />
          <rect x="9" y="3" width="4" height="4" rx="1" stroke={ink} strokeWidth="1.2" />
          <rect x="3" y="9" width="4" height="4" rx="1" stroke={ink} strokeWidth="1.2" />
          <path d="M9 9h1.6v1.6H9zM11.4 11.4H13V13h-1.6z" fill={ink} />
        </>
      );
    case "poster":
    case "flyer":
      return (
        <>
          <rect x="3.6" y="2.8" width="8.8" height="10.4" rx="1.4" stroke={ink} strokeWidth="1.3" />
          <path d="M5.6 5.6h4.8M5.6 8h4.8M5.6 10.4h3" stroke={ink} strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    default:
      // Direct, or a channel code we have no artwork for: a plain globe.
      return (
        <>
          <circle cx="8" cy="8" r="4.6" stroke={ink} strokeWidth="1.3" />
          <path d="M3.4 8h9.2M8 3.4c1.2 1.3 1.8 2.9 1.8 4.6S9.2 11.3 8 12.6c-1.2-1.3-1.8-2.9-1.8-4.6S6.8 4.7 8 3.4z" stroke={ink} strokeWidth="1.2" fill="none" />
        </>
      );
  }
}

/** Round, brand-coloured badge for one signup channel. */
export default function SourceIcon({
  source,
  size = 26,
}: {
  source: string;
  size?: number;
}) {
  const { bg, ink } = SOURCE_COLORS[source] ?? FALLBACK;
  const label = sourceLabel(source);

  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: bg }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {glyph(source, ink)}
      </svg>
    </span>
  );
}
