"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CheckoutDialog from "../Dialogs/CheckoutDialog/CheckoutDialog";
import type { TicketInfo } from "../Dialogs/CheckoutDialog/CheckoutDialog";
import { formatSeatLocation } from "../../utils/categoryConfig";
import { encodeImageUrl } from "@/utils/defaultImages";
import { setNavBarInk } from "@/lib/native-chrome";
import { nis } from "./format";

interface Ticket {
  id: string;
  eventId: string;
  artist: string;
  date: string;
  venue: string;
  time: string;
  category?: string;
  section: string;
  block?: string | null;
  row: number | null;
  seat: number | null;
  isStanding: boolean;
  askingPrice: number;
  originalPrice: number;
  status: string;
  sellerId: string;
  bundleId: string | null;
  canSplit: boolean | null;
  bundleSize: number | null;
}

interface Event {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageUrl?: string;
  status: string;
}

type Listing =
  | { kind: "single"; id: string; ticket: Ticket; sortPrice: number }
  | {
      kind: "bundle";
      id: string;
      tickets: Ticket[];
      sortPrice: number;
      qty: number;
      total: number;
    };

function joinSeats(tickets: Ticket[]): string {
  const seats = tickets
    .map((t) => t.seat)
    .filter((s): s is number => typeof s === "number")
    .sort((a, b) => a - b);
  if (seats.length === 0) return "";
  if (seats.length === 1) return String(seats[0]);
  const first = seats[0];
  const last = seats[seats.length - 1];
  const isContiguous = seats.every((s, i) => s === first + i);
  return isContiguous ? `${first}-${last}` : seats.join(", ");
}

function ticketSeatLocation(ticket: Ticket): string {
  return formatSeatLocation({
    category: ticket.category,
    section: ticket.section,
    block: ticket.block,
    row: ticket.row,
    seat: ticket.seat,
    isStanding: ticket.isStanding,
  });
}

export default function MobileTicketList({
  tickets,
  event,
}: {
  tickets: Ticket[];
  event: Event;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkoutTickets, setCheckoutTickets] = useState<TicketInfo[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const listings = useMemo<Listing[]>(() => {
    const groupMap = new Map<string, Ticket[]>();
    const solo: Ticket[] = [];
    for (const t of tickets) {
      if (t.bundleId) {
        const arr = groupMap.get(t.bundleId) ?? [];
        arr.push(t);
        groupMap.set(t.bundleId, arr);
      } else {
        solo.push(t);
      }
    }
    const items: Listing[] = [];
    for (const [bundleId, group] of groupMap) {
      if (group.length === 1) {
        const t = group[0];
        items.push({
          kind: "single",
          id: t.id,
          ticket: t,
          sortPrice: t.askingPrice,
        });
        continue;
      }
      const total = group.reduce((s, t) => s + t.askingPrice, 0);
      items.push({
        kind: "bundle",
        id: bundleId,
        tickets: group,
        // Sort by the same per-ticket price the card displays (the average).
        sortPrice: total / group.length,
        qty: group.length,
        total,
      });
    }
    for (const t of solo) {
      items.push({
        kind: "single",
        id: t.id,
        ticket: t,
        sortPrice: t.askingPrice,
      });
    }
    // Always cheapest-first — whoever wants VIP scrolls down.
    return items.sort((a, b) => a.sortPrice - b.sortPrice);
  }, [tickets]);

  const selected = useMemo(
    () => listings.find((l) => l.id === selectedId) ?? null,
    [listings, selectedId],
  );

  const toInfo = useCallback(
    (t: Ticket): TicketInfo => ({
      ticketId: t.id,
      title: event.artist,
      date: t.date,
      venue: t.venue,
      seatLocation: ticketSeatLocation(t),
      price: t.askingPrice,
      originalPrice: t.originalPrice,
      sellerId: t.sellerId,
      imageUrl: event.imageUrl
        ? encodeImageUrl(event.imageUrl)
        : "/images/Artist/default.png",
      time: t.time || event.time,
      section: t.section,
      row: t.row,
      seat: t.seat,
      isStanding: t.isStanding,
    }),
    [event.artist, event.imageUrl, event.time],
  );

  const onContinue = useCallback(() => {
    if (!selected) return;
    const infos =
      selected.kind === "single"
        ? [toInfo(selected.ticket)]
        : selected.tickets.map(toInfo);
    setCheckoutTickets(infos);
    setIsCheckoutOpen(true);
  }, [selected, toInfo]);

  const onCheckoutClose = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutTickets([]);
    setSelectedId(null);
  }, []);

  // Android: the system gesture bar sits outside the webview, so paint it
  // ink while the black buy bar is up (checkout screen is cream again).
  useEffect(() => {
    const ink = selected !== null && !isCheckoutOpen;
    void setNavBarInk(ink);
    return () => {
      void setNavBarInk(false);
    };
  }, [selected, isCheckoutOpen]);

  return (
    <div style={{ paddingBottom: selected ? "calc(80px + env(safe-area-inset-bottom, 0px))" : 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {listings.map((l) => {
          const isSel = selectedId === l.id;
          const isBundle = l.kind === "bundle";
          const t = l.kind === "single" ? l.ticket : l.tickets[0];
          const seatLabel = isBundle
            ? `מושבים ${joinSeats(l.tickets)}`
            : t.isStanding
              ? "עמידה"
              : t.seat != null
                ? `מושב ${t.seat}`
                : "";
          const rowLabel = t.row != null ? ` · שורה ${t.row}` : "";
          const blockLabel = t.block ? ` · בלוק ${t.block}` : "";
          const priceMain = isBundle
            ? Math.round(l.total / l.qty)
            : t.askingPrice;

          return (
            <button
              key={l.id}
              onClick={(e) => {
                const el = e.currentTarget;
                setSelectedId(isSel ? null : l.id);
                // The fixed buy bar appears over the tapped card — scroll it
                // clear once the bar (and list bottom padding) have rendered.
                if (!isSel) {
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                      el.scrollIntoView({ behavior: "smooth", block: "nearest" }),
                    ),
                  );
                }
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "inherit",
                padding: isBundle ? "12px 12px 0" : 12,
                border:
                  "2px solid " +
                  (isSel ? "var(--tk-blue)" : "var(--tk-line)"),
                background: isSel
                  ? "rgba(181, 70, 83, 0.04)"
                  : "var(--tk-paper)",
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
                fontFamily: "inherit",
                cursor: "pointer",
                scrollMarginBottom: 96,
                scrollMarginTop: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    אזור {t.section || "—"}
                    {blockLabel}
                    {rowLabel}
                  </div>
                  <div
                    className="tk-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--tk-muted)",
                      marginTop: 3,
                    }}
                  >
                    {seatLabel}
                  </div>
                </div>
                <div style={{ textAlign: "left", flexShrink: 0 }}>
                  <div
                    className="tk-mono"
                    style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}
                  >
                    {nis(priceMain)}
                  </div>
                  <div
                    className="tk-mono"
                    style={{
                      fontSize: 9,
                      color: "var(--tk-muted)",
                      marginTop: 3,
                    }}
                  >
                    לכרטיס
                  </div>
                </div>
              </div>

              {/* Bundle strip — bleeds to the card edges, clipped by overflow:hidden */}
              {isBundle && (
                <div
                  className="tk-mono"
                  style={{
                    margin: "12px -12px 0",
                    background: "var(--tk-ink)",
                    color: "var(--tk-bg)",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      letterSpacing: "0.04em",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    חבילה ×{l.qty} · לקנייה יחד
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    סה״כ {nis(l.total)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sticky buy bar */}
      {selected && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--tk-ink)",
            color: "var(--tk-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            // Bar hugs the screen edge; the home-indicator inset becomes
            // padding so the black fills the safe area instead of floating.
            padding: "12px 18px calc(12px + env(safe-area-inset-bottom, 0px))",
            borderRadius: "14px 14px 0 0",
            boxShadow: "0 -8px 20px rgba(0,0,0,0.18)",
            zIndex: 30,
          }}
          dir="rtl"
        >
          <div style={{ minWidth: 0 }}>
            <div
              className="tk-mono"
              style={{
                fontSize: 10,
                opacity: 0.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selected.kind === "bundle"
                ? `אזור ${selected.tickets[0].section} · מושבים ${joinSeats(selected.tickets)} · ${selected.qty} כרטיסים`
                : `אזור ${selected.ticket.section}${
                    selected.ticket.seat != null
                      ? ` · מושב ${selected.ticket.seat}`
                      : ""
                  }`}
            </div>
            <div
              className="tk-mono"
              style={{ fontSize: 20, fontWeight: 700 }}
            >
              {nis(
                selected.kind === "bundle"
                  ? selected.total
                  : selected.ticket.askingPrice,
              )}
            </div>
          </div>
          <button
            onClick={onContinue}
            style={{
              background: "var(--tk-lime)",
              color: "var(--tk-blue-ink)",
              padding: "12px 20px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            המשך לתשלום
          </button>
        </div>
      )}

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={onCheckoutClose}
        tickets={checkoutTickets}
      />
    </div>
  );
}
