"use client";

import React, { useCallback, useMemo, useState } from "react";
import CheckoutDialog from "../Dialogs/CheckoutDialog/CheckoutDialog";
import type { TicketInfo } from "../Dialogs/CheckoutDialog/CheckoutDialog";
import { formatSeatLocation } from "../../utils/categoryConfig";
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
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
      const per = Math.min(...group.map((t) => t.askingPrice));
      items.push({
        kind: "bundle",
        id: bundleId,
        tickets: group,
        sortPrice: per,
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
    if (!sortOrder) return items;
    return items.sort((a, b) =>
      sortOrder === "asc"
        ? a.sortPrice - b.sortPrice
        : b.sortPrice - a.sortPrice,
    );
  }, [tickets, sortOrder]);

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
    }),
    [event.artist],
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

  return (
    <>
      {/* Sort pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["asc", "desc"] as const).map((order) => {
          const active = sortOrder === order;
          return (
            <button
              key={order}
              onClick={() =>
                setSortOrder((p) => (p === order ? null : order))
              }
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "inherit",
                border:
                  "1px solid " +
                  (active ? "var(--tk-ink)" : "var(--tk-line-strong)"),
                background: active ? "var(--tk-ink)" : "transparent",
                color: active ? "#fff" : "var(--tk-ink)",
                cursor: "pointer",
              }}
            >
              {order === "asc" ? "מהזול ליקר" : "מהיקר לזול"}
            </button>
          );
        })}
      </div>

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
          const priceMain = isBundle ? l.total : t.askingPrice;
          const priceSub = isBundle ? `${l.qty} כרטיסים` : "לכרטיס";

          return (
            <button
              key={l.id}
              onClick={() => setSelectedId(isSel ? null : l.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "inherit",
                padding: 12,
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
              }}
            >
              {isBundle && (
                <div
                  className="tk-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#F4E4A6",
                    color: "#5C4A0E",
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    marginBottom: 8,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5C4A0E"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                  </svg>
                  חבילה של {l.qty}
                  {l.tickets[0].canSplit === false ? " · ללא הפרדה" : ""}
                </div>
              )}

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
                    {priceSub}
                  </div>
                </div>
              </div>
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
            bottom: "env(safe-area-inset-bottom, 0px)",
            background: "var(--tk-ink)",
            color: "var(--tk-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 18px",
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
                ? `אזור ${selected.tickets[0].section} · ${selected.qty} כרטיסים`
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
    </>
  );
}
