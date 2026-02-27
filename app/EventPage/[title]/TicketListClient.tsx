"use client";

import React, { useState, useCallback } from "react";
import SingleCard from "../../components/SingleCard/SingleCard";
import CheckoutDialog from "../../components/Dialogs/CheckoutDialog/CheckoutDialog";
import type { TicketInfo } from "../../components/Dialogs/CheckoutDialog/CheckoutDialog";

interface Ticket {
  id: string;
  concertId: string;
  artist: string;
  date: string;
  venue: string;
  time: string;
  section: string;
  row: number | null;
  seat: number | null;
  isStanding: boolean;
  askingPrice: number;
  originalPrice: number;
  status: string;
  sellerId: string;
}

interface Concert {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageData?: string;
  status: string;
}

interface TicketListClientProps {
  tickets: Ticket[];
  concert: Concert;
}

function formatSeatLocation(ticket: Ticket): string {
  if (ticket.isStanding) {
    return `עמידה${ticket.section ? ` | ${ticket.section}` : ""}`;
  }
  const parts: string[] = [];
  if (ticket.section) parts.push(`אזור ${ticket.section}`);
  if (ticket.row) parts.push(`שורה ${ticket.row}`);
  if (ticket.seat) parts.push(`מושב ${ticket.seat}`);
  return parts.join(" | ");
}

const TicketListClient: React.FC<TicketListClientProps> = ({
  tickets,
  concert,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checkoutTickets, setCheckoutTickets] = useState<TicketInfo[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const toTicketInfo = useCallback(
    (ticket: Ticket): TicketInfo => ({
      ticketId: ticket.id,
      title: concert.artist,
      date: ticket.date,
      venue: ticket.venue,
      seatLocation: formatSeatLocation(ticket),
      price: ticket.askingPrice,
      originalPrice: ticket.originalPrice,
      sellerId: ticket.sellerId,
    }),
    [concert.artist],
  );

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
    const selected = tickets
      .filter((t) => selectedIds.has(t.id))
      .map(toTicketInfo);
    setCheckoutTickets(selected);
    setIsCheckoutOpen(true);
  }, [tickets, selectedIds, toTicketInfo]);

  const handleCheckoutClose = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutTickets([]);
    setSelectedIds(new Set());
  }, []);

  const totalSelected = selectedIds.size;
  const totalPrice = tickets
    .filter((t) => selectedIds.has(t.id))
    .reduce((sum, t) => sum + t.askingPrice, 0);

  return (
    <>
      <div
        dir="rtl"
        className="flex flex-col items-stretch sm:items-center pt-6 px-4 pb-8 gap-3 sm:pt-14 sm:pr-32 sm:pb-14 sm:pl-32 sm:gap-8 shadow-small-inner w-full"
      >
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="w-full sm:flex sm:items-center sm:justify-center"
          >
            <SingleCard
              title={concert.artist}
              imageSrc={concert.imageData || "/images/Artist/default.png"}
              date={ticket.date}
              location={ticket.venue}
              seatLocation={formatSeatLocation(ticket)}
              priceBefore={ticket.originalPrice}
              price={ticket.askingPrice}
              soldOut={false}
              ticketsLeft={tickets.length}
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
        ))}
      </div>

      {/* Sticky multi-buy bar — shown when 1+ tickets selected */}
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
