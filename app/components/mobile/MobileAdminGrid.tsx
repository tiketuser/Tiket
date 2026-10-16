"use client";

import React from "react";
import Link from "next/link";

type AdminPage = {
  href: string;
  title: string;
  description: string;
  /** Banner colour; every one is dark enough for a white icon. */
  tint: string;
  icon: React.ReactNode;
};

const svg = (children: React.ReactNode) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ICONS = {
  plusCal: svg(<><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" /></>),
  edit: svg(<><path d="M12 20h8" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  check: svg(<><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" /><path d="M8.5 12l2.3 2.3 4.7-4.6" /></>),
  refresh: svg(<><path d="M20 11a8 8 0 0 0-14.7-4.4L3 9" /><path d="M3 4v5h5" /><path d="M4 13a8 8 0 0 0 14.7 4.4L21 15" /><path d="M21 20v-5h-5" /></>),
  grid: svg(<><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>),
  palette: svg(<><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.9 1.8-1.8 0-1.3-1.1-1.6-1.1-2.8 0-1 .8-1.7 1.8-1.7h2.2a3.8 3.8 0 0 0 3.8-3.8C20.5 6.7 16.7 3.5 12 3.5z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.3" r="1" /><circle cx="14.5" cy="7.3" r="1" /></>),
  mic: svg(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></>),
  image: svg(<><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-4.5-4.5L6 19.5" /></>),
  users: svg(<><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15.3c1.9.7 3.1 2.3 3.5 4.7" /></>),
  inbox: svg(<><path d="M3.5 13.5 6 5.5h12l2.5 8V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" /></>),
  plug: svg(<><path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 0 1-10 0z" /><path d="M12 16v5" /></>),
  chart: svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  pulse: svg(<><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></>),
};

export const ADMIN_PAGES: AdminPage[] = [
  { href: "/Admin", title: "יצירת אירועים", description: "אירוע חדש או ייבוא מקובץ", tint: "#B54653", icon: ICONS.plusCal },
  { href: "/edit-events", title: "עריכת אירועים", description: "פרטים, תאריכים וסטטוס", tint: "#141413", icon: ICONS.edit },
  { href: "/approve-tickets", title: "אישור כרטיסים", description: "כרטיסים שממתינים לבדיקה", tint: "#1F7A4A", icon: ICONS.check },
  { href: "/Admin/EarlyAccess", title: "הרשמות מוקדמות", description: "רשימת ההמתנה ומקורות", tint: "#8C5A5F", icon: ICONS.inbox },
  { href: "/Admin/users", title: "ניהול משתמשים", description: "חשבונות והרשאות מנהל", tint: "#3B3A37", icon: ICONS.users },
  { href: "/Admin/venue-providers", title: "ניהול ספקים", description: "חיבור למערכות הכרטוס", tint: "#2F4A6B", icon: ICONS.plug },
  { href: "/manage-artists", title: "ניהול אמנים", description: "שמות, תמונות וכינויים", tint: "#6B4E8C", icon: ICONS.mic },
  { href: "/manage-categories", title: "ניהול קטגוריות", description: "הוספה, סידור ושמות", tint: "#5E6B3A", icon: ICONS.grid },
  { href: "/manage-themes", title: "צבע קטגוריות", description: "צבעי הנושא לכל קטגוריה", tint: "#A0623A", icon: ICONS.palette },
  { href: "/manage-default-images", title: "תמונות ברירת מחדל", description: "לאירועים בלי תמונה", tint: "#4A6E6A", icon: ICONS.image },
  { href: "/Admin/pnl-calculator", title: "מחשבון P&L", description: "רווח והפסד לפי תרחיש", tint: "#6F6B63", icon: ICONS.chart },
  { href: "/diagnostic", title: "אבחון מערכת", description: "בדיקת מסד הנתונים", tint: "#2E2D2A", icon: ICONS.pulse },
  { href: "/regenerate-tickets", title: "כרטיסי דמו", description: "מוחק ויוצר כרטיסים מחדש", tint: "#7A2E36", icon: ICONS.refresh },
];

/** The admin panel: one banner card per admin page, two to a row. */
export default function MobileAdminGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
      {ADMIN_PAGES.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="press"
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            background: "var(--surface)",
            boxShadow: "inset 0 0 0 1px var(--line)",
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              height: 86,
              background: `linear-gradient(135deg, ${p.tint} 0%, color-mix(in srgb, ${p.tint} 72%, #000) 100%)`,
              color: "#fff",
              overflow: "hidden",
            }}
          >
            {/* Oversized faint copy of the icon as texture */}
            <span
              aria-hidden="true"
              style={{ position: "absolute", left: -14, bottom: -22, opacity: 0.14, transform: "scale(3.4) rotate(-12deg)", transformOrigin: "left bottom" }}
            >
              {p.icon}
            </span>
            <span
              className="round"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,.16)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p.icon}
            </span>
          </div>
          <div style={{ padding: "11px 12px 13px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{p.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{p.description}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
