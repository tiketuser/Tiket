"use client";

import React, { useState } from "react";

export interface BundleTicket {
  id: string;
  date: string;
  venue: string;
  section: string;
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
  concertTitle: string;
  canSplit: boolean | null;
  onBuyAll: (tickets: BundleTicket[]) => void;
  onBuySelected: (tickets: BundleTicket[]) => void;
}

function formatSeat(ticket: BundleTicket): string {
  if (ticket.isStanding) {
    return `עמידה${ticket.section ? ` | ${ticket.section}` : ""}`;
  }
  const parts: string[] = [];
  if (ticket.section) parts.push(`אזור ${ticket.section}`);
  if (ticket.row) parts.push(`שורה ${ticket.row}`);
  if (ticket.seat) parts.push(`מושב ${ticket.seat}`);
  return parts.join(" | ") || "מיקום לא צוין";
}

const BundleCard: React.FC<BundleCardProps> = ({
  tickets,
  concertTitle,
  canSplit,
  onBuyAll,
  onBuySelected,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  return (
    <div className="relative w-full max-w-[880px]">
      {/* Stack layers behind main card */}
      {tickets.length >= 3 && (
        <div className="absolute top-3 left-3 right-0 h-full bg-gray-100 rounded-xl border border-gray-200 -z-10" />
      )}
      {tickets.length >= 2 && (
        <div className="absolute top-1.5 left-1.5 right-0 h-full bg-gray-200 rounded-xl border border-gray-300 -z-10" />
      )}

      {/* Main card */}
      <div
        className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden z-0"
        dir="rtl"
      >
        {/* Colored top bar */}
        <div className="h-1 w-full bg-primary" />

        {/* Card header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="font-bold text-strongText text-base leading-tight flex-1">
              {concertTitle}
            </span>
            <span className="flex-shrink-0 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
              {tickets.length} כרטיסים יחד
            </span>
          </div>

          <div className="text-xs text-mutedText mb-1">
            {tickets[0]?.date} | {tickets[0]?.venue}
          </div>

          <div className="text-xs text-mutedText mb-3">
            {tickets.map((t) => formatSeat(t)).join(" • ")}
          </div>

          {/* Price + primary CTA */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xl font-extrabold text-strongText">
                ₪{totalPrice}
              </span>
              <span className="text-xs text-mutedText mr-1">לכולם</span>
            </div>

            {canSplit === false ? (
              <button
                className="btn btn-primary rounded-lg min-h-0 h-10 px-4 text-white text-sm font-bold"
                onClick={() => onBuyAll(tickets)}
              >
                רכוש {tickets.length} כרטיסים ←
              </button>
            ) : (
              <div className="flex gap-2">
                {selectedInBundle.size > 0 ? (
                  <button
                    className="btn btn-primary rounded-lg min-h-0 h-10 px-4 text-white text-sm font-bold"
                    onClick={() => onBuySelected(selectedTickets)}
                  >
                    רכוש {selectedInBundle.size} נבחרים ←
                  </button>
                ) : (
                  <button
                    className="btn btn-primary rounded-lg min-h-0 h-10 px-4 text-white text-sm font-bold"
                    onClick={() => onBuyAll(tickets)}
                  >
                    רכוש הכל ({tickets.length}) ←
                  </button>
                )}
              </div>
            )}
          </div>

          {/* "Must buy all" notice */}
          {canSplit === false && (
            <p className="text-xs text-mutedText mt-2">
              * כרטיסים אלו נמכרים כחבילה בלבד
            </p>
          )}
        </div>

        {/* Expandable per-ticket selector (canSplit=true only) */}
        {canSplit !== false && (
          <>
            <div className="border-t border-gray-100">
              <button
                className="w-full text-xs text-primary font-semibold py-2.5 px-4 text-right hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded((v) => !v)}
              >
                {isExpanded ? "סגור ▲" : "בחר כרטיסים בנפרד ▼"}
              </button>
            </div>

            {isExpanded && (
              <div className="divide-y divide-gray-50 border-t border-gray-100">
                {tickets.map((ticket) => {
                  const isSelected = selectedInBundle.has(ticket.id);
                  return (
                    <button
                      key={ticket.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right"
                      onClick={() => toggleTicket(ticket.id)}
                    >
                      {/* Custom checkbox */}
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1 text-xs text-strongText text-right">
                        {formatSeat(ticket)}
                      </span>
                      <span className="text-sm font-bold text-strongText">
                        ₪{ticket.askingPrice}
                      </span>
                    </button>
                  );
                })}

                {/* Selected subtotal */}
                {selectedInBundle.size > 0 && (
                  <div className="px-4 py-2.5 bg-primary/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                      {selectedInBundle.size} כרטיסים נבחרו
                    </span>
                    <span className="text-sm font-bold text-primary">
                      ₪{selectedPrice}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BundleCard;
