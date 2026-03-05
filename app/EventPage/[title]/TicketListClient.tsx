"use client";

import React, { useState, useCallback, useMemo } from "react";
import SingleCard from "../../components/SingleCard/SingleCard";
import BundleCard from "../../components/BundleCard/BundleCard";
import type { BundleTicket } from "../../components/BundleCard/BundleCard";
import CheckoutDialog from "../../components/Dialogs/CheckoutDialog/CheckoutDialog";
import type { TicketInfo } from "../../components/Dialogs/CheckoutDialog/CheckoutDialog";
import { formatSeatLocation } from "../../utils/categoryConfig";

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

interface TicketListClientProps {
  tickets: Ticket[];
  event: Event;
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

function ticketToBundleTicket(ticket: Ticket): BundleTicket {
  return {
    id: ticket.id,
    date: ticket.date,
    venue: ticket.venue,
    category: ticket.category,
    section: ticket.section,
    block: ticket.block,
    row: ticket.row,
    seat: ticket.seat,
    isStanding: ticket.isStanding,
    askingPrice: ticket.askingPrice,
    originalPrice: ticket.originalPrice,
    sellerId: ticket.sellerId,
    canSplit: ticket.canSplit,
    bundleSize: ticket.bundleSize,
  };
}

type SortableItem =
  | { type: 'bundle'; sortPrice: number; data: Ticket[] }
  | { type: 'solo'; sortPrice: number; data: Ticket };

const TicketListClient: React.FC<TicketListClientProps> = ({
  tickets,
  event,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checkoutTickets, setCheckoutTickets] = useState<TicketInfo[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toTicketInfo = useCallback(
    (ticket: Ticket): TicketInfo => ({
      ticketId: ticket.id,
      title: event.artist,
      date: ticket.date,
      venue: ticket.venue,
      seatLocation: ticketSeatLocation(ticket),
      price: ticket.askingPrice,
      originalPrice: ticket.originalPrice,
      sellerId: ticket.sellerId,
    }),
    [event.artist],
  );

  // Group tickets by bundleId; tickets without a bundleId go into soloTickets
  const { bundledGroups, soloTickets } = useMemo(() => {
    const groupMap = new Map<string, Ticket[]>();
    const solo: Ticket[] = [];

    for (const ticket of tickets) {
      if (ticket.bundleId) {
        const existing = groupMap.get(ticket.bundleId) ?? [];
        groupMap.set(ticket.bundleId, [...existing, ticket]);
      } else {
        solo.push(ticket);
      }
    }

    return {
      bundledGroups: Array.from(groupMap.values()),
      soloTickets: solo,
    };
  }, [tickets]);

  const sortedItems = useMemo((): SortableItem[] => {
    const items: SortableItem[] = [
      ...bundledGroups.map((group) => ({
        type: 'bundle' as const,
        sortPrice: Math.min(...group.map((t) => t.askingPrice)),
        data: group,
      })),
      ...soloTickets.map((ticket) => ({
        type: 'solo' as const,
        sortPrice: ticket.askingPrice,
        data: ticket,
      })),
    ];
    return items.sort((a, b) =>
      sortOrder === 'asc' ? a.sortPrice - b.sortPrice : b.sortPrice - a.sortPrice,
    );
  }, [bundledGroups, soloTickets, sortOrder]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openInstantBuy = useCallback(
    (ticket: Ticket) => {
      setCheckoutTickets([toTicketInfo(ticket)]);
      setIsCheckoutOpen(true);
    },
    [toTicketInfo],
  );

  const openMultiBuy = useCallback(() => {
    const selected = soloTickets
      .filter((t) => selectedIds.has(t.id))
      .map(toTicketInfo);
    setCheckoutTickets(selected);
    setIsCheckoutOpen(true);
  }, [soloTickets, selectedIds, toTicketInfo]);

  // Bundle buy handler — maps BundleTicket[] back to TicketInfo[] via event context
  const openBundleBuy = useCallback(
    (bundleTickets: BundleTicket[]) => {
      const infos: TicketInfo[] = bundleTickets.map((t) => ({
        ticketId: t.id,
        title: event.artist,
        date: t.date,
        venue: t.venue,
        seatLocation: formatSeatLocation({ category: t.category, section: t.section, block: t.block, row: t.row, seat: t.seat, isStanding: t.isStanding }),
        price: t.askingPrice,
        originalPrice: t.originalPrice,
        sellerId: t.sellerId,
      }));
      setCheckoutTickets(infos);
      setIsCheckoutOpen(true);
    },
    [event.artist],
  );

  const handleCheckoutClose = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutTickets([]);
    setSelectedIds(new Set());
  }, []);

  const totalSelected = selectedIds.size;
  const totalPrice = soloTickets
    .filter((t) => selectedIds.has(t.id))
    .reduce((sum, t) => sum + t.askingPrice, 0);

  return (
    <>
      <div
        dir="rtl"
        className="flex flex-col items-stretch sm:items-center pt-6 px-4 pb-8 gap-3 sm:pt-14 sm:pr-32 sm:pb-14 sm:pl-32 sm:gap-8 shadow-small-inner w-full"
      >
        {/* Sort bar */}
        <div className="flex gap-2 justify-start w-full">
          {(['asc', 'desc'] as const).map((order) => (
            <button
              key={order}
              onClick={() => setSortOrder(order)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 border ${
                sortOrder === order
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {order === 'asc' ? 'מהזול ליקר ↑' : 'מהיקר לזול ↓'}
            </button>
          ))}
        </div>


        {sortedItems.map((item) => {
          if (item.type === 'bundle') {
            const group = item.data;
            if (group.length === 1) {
              const ticket = group[0];
              return (
                <div key={ticket.id} className="w-full sm:flex sm:items-center sm:justify-center">
                  <SingleCard
                    title={event.artist}
                    imageSrc={event.imageUrl || "/images/Artist/default.png"}
                    date={ticket.date}
                    location={ticket.venue}
                    seatLocation={ticketSeatLocation(ticket)}
                    price={ticket.askingPrice}
                    soldOut={false}
                    ticketsLeft={soloTickets.length + 1}
                    timeLeft=""
                    buttonAction="קנה"
                    ticketId={ticket.id}
                    sellerId={ticket.sellerId}
                    isSelectable={true}
                    isSelected={selectedIds.has(ticket.id)}
                    onToggleSelect={() => toggleSelect(ticket.id)}
                    onInstantBuy={() => openInstantBuy(ticket)}
                  />
                </div>
              );
            }
            const bundleId = group[0].bundleId;
            if (!bundleId) return null;
            return (
              <div key={bundleId} className="w-full sm:flex sm:items-center sm:justify-center">
                <BundleCard
                  tickets={group.map(ticketToBundleTicket)}
                  eventTitle={event.artist}
                  canSplit={group[0].canSplit}
                  onBuyAll={openBundleBuy}
                  onBuySelected={openBundleBuy}
                />
              </div>
            );
          }
          // solo
          const ticket = item.data;
          return (
            <div key={ticket.id} className="w-full sm:flex sm:items-center sm:justify-center">
              <SingleCard
                title={event.artist}
                imageSrc={event.imageUrl || "/images/Artist/default.png"}
                date={ticket.date}
                location={ticket.venue}
                seatLocation={ticketSeatLocation(ticket)}
                price={ticket.askingPrice}
                soldOut={false}
                ticketsLeft={soloTickets.length}
                timeLeft=""
                buttonAction="קנה"
                ticketId={ticket.id}
                sellerId={ticket.sellerId}
                isSelectable={true}
                isSelected={selectedIds.has(ticket.id)}
                onToggleSelect={() => toggleSelect(ticket.id)}
                onInstantBuy={() => openInstantBuy(ticket)}
              />
            </div>
          );
        })}
      </div>

      {/* Sticky multi-buy bar — only for solo ticket selections */}
      {totalSelected > 0 && (
        <div
          dir="rtl"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-primary shadow-lg px-4 py-3 sm:px-12 flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="font-bold text-strongText text-base">
              {totalSelected === 1
                ? "כרטיס אחד נבחר"
                : `${totalSelected} כרטיסים נבחרו`}
            </span>
            <span className="text-sm text-weakTextBluish">
              סה&quot;כ: ₪{totalPrice}
            </span>
          </div>
          <button
            onClick={openMultiBuy}
            className="btn btn-primary rounded-lg h-[44px] min-h-0 px-6 text-white font-bold text-base"
          >
            רכוש &nbsp;←
          </button>
        </div>
      )}

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        tickets={checkoutTickets}
      />
    </>
  );
};

export default TicketListClient;
