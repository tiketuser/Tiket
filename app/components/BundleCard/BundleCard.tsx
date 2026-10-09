"use client";

import React, { useState } from "react";
import { formatSeatLocation } from "../../utils/categoryConfig";

export interface BundleTicket {
  id: string;
  date: string;
  venue: string;
  category?: string;
  section: string;
  block?: string | null;
  row: number | null;
  seat: number | null;
  isStanding: boolean;
  askingPrice: number;
  originalPrice: number;
  sellerId: string;
  canSplit: boolean | null;
  bundleSize: number | null;
}

interface BundleCardProps {
  tickets: BundleTicket[];
  eventTitle: string;
  canSplit: boolean | null;
  onBuyAll: (tickets: BundleTicket[]) => void;
  onBuySelected: (tickets: BundleTicket[]) => void;
}

function formatSeat(ticket: BundleTicket): string {
  return formatSeatLocation({
    category: ticket.category,
    section: ticket.section,
    block: ticket.block,
    row: ticket.row,
    seat: ticket.seat,
    isStanding: ticket.isStanding,
  });
}

const BundleCard: React.FC<BundleCardProps> = ({
  tickets,
  canSplit,
  onBuyAll,
  onBuySelected,
}) => {
  const [selectedInBundle, setSelectedInBundle] = useState<Set<string>>(
    new Set()
  );

  const totalPrice = tickets.reduce((s, t) => s + t.askingPrice, 0);
  const selectedTickets = tickets.filter((t) => selectedInBundle.has(t.id));
  const selectedPrice = selectedTickets.reduce((s, t) => s + t.askingPrice, 0);

  const toggleTicket = (id: string) => {
    setSelectedInBundle((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buyLabel = selectedInBundle.size > 0
    ? `קנה ${selectedInBundle.size} ←`
    : `קנה ${tickets.length} ←`;

  const handleBuy = () =>
    selectedInBundle.size > 0 ? onBuySelected(selectedTickets) : onBuyAll(tickets);

  return (
    <div className="flex flex-col w-full" dir="rtl">
      <div className="flex items-center justify-center w-full gap-3">
        <div className="flex flex-row items-center justify-between border-b-4 border-highlight pt-4 pr-8 pb-4 pl-6 gap-4 sm:gap-6 md:gap-12 lg:gap-14 shadow-large flex-1 max-w-[700px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] min-h-[100px] md:min-h-[128px] bg-white select-none">

          {/* Bundle count — mirrors Date column */}
          <div className="flex flex-col items-center justify-center min-w-[60px] flex-shrink-0">
            <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">{tickets.length}</span>
            <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">כרטיסים</span>
            <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">יחד</span>
          </div>

          {/* Divider */}
          <div className="w-[3px] h-20 md:h-24 bg-strongText flex-shrink-0" />

          {/* Seat chips — mirrors Title+Seat columns */}
          <div className="flex flex-wrap gap-2 flex-1 min-w-0 items-center">
            {tickets.map((t) => (
              <span
                key={t.id}
                className={`inline-flex items-center gap-1.5 text-text-extra-small md:text-text-large font-bold px-2.5 py-1 rounded-md transition-colors ${
                  canSplit !== false
                    ? `cursor-pointer ${selectedInBundle.has(t.id) ? "bg-primary text-white" : "bg-gray-100 text-weakTextBluish hover:bg-gray-200"}`
                    : "bg-gray-100 text-weakTextBluish"
                }`}
                onClick={() => canSplit !== false && toggleTicket(t.id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4"/><path d="M2 15v4a2 2 0 002 2h16a2 2 0 002-2v-4"/><path d="M6 9h12M6 15h12"/>
                </svg>
                {formatSeat(t)}
              </span>
            ))}
            {canSplit !== false && (
              <span className="text-[10px] text-mutedText w-full mt-0.5">לחץ על כרטיס לבחירה</span>
            )}
            {canSplit === false && (
              <span className="text-[10px] text-mutedText w-full mt-0.5">* נמכרים כחבילה בלבד</span>
            )}
          </div>

          {/* Divider */}
          <div className="w-[3px] h-20 md:h-24 bg-weakText flex-shrink-0" />

          {/* Price — mirrors Price column */}
          <div className="flex flex-row items-center justify-center text-center gap-2 md:gap-4 min-w-[70px] md:min-w-[130px] flex-shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-strongText text-heading-6-mobile md:text-heading-4-desktop font-extraBold leading-tight">
                ₪{selectedInBundle.size > 0 ? selectedPrice : totalPrice}
              </span>
              {selectedInBundle.size > 0 && (
                <span className="text-[10px] text-mutedText leading-tight">{selectedInBundle.size} נבחרו</span>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            className="btn rounded-md btn-primary min-h-0 w-[80px] h-[36px] md:w-[100px] md:h-[40px] text-white text-[10px] md:text-text-large font-normal px-3 flex-shrink-0"
            onClick={handleBuy}
          >
            {buyLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BundleCard;
