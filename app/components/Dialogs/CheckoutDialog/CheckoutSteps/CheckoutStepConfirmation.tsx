"use client";

import React from "react";
import Link from "next/link";
import MinimalCard from "../../../MinimalCard/MinimalCard";
import { TicketInfo } from "../CheckoutDialog";

interface CheckoutStepConfirmationProps {
  ticket: TicketInfo;
  onClose: () => void;
}

const CheckoutStepConfirmation: React.FC<CheckoutStepConfirmationProps> = ({
  ticket,
  onClose,
}) => {
  return (
    <div className="flex flex-col items-center w-full gap-4 sm:gap-6" dir="rtl">
      {/* Success Icon */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <p className="text-text-regular text-strongText text-center w-full">
        ניתן לראות את הכרטיסים שרכשת יחד עם שאר הכרטיסים בבעלותך
      </p>

      {/* Ticket Preview */}
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <MinimalCard
          title={ticket.title}
          date={ticket.date}
          seatLocation={ticket.seatLocation}
          venue={ticket.venue}
          price={ticket.price}
          priceBefore={ticket.originalPrice}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col w-full gap-2">
        <Link href="/MyTickets" className="w-full">
          <button className="w-full h-[48px] bg-primary text-white rounded-lg font-bold text-text-regular hover:bg-red-700 transition-colors">
            הכרטיסים שלי
          </button>
        </Link>

        <button
          onClick={onClose}
          className="w-full h-[48px] text-primary hover:bg-gray-100 rounded-lg font-bold text-text-regular transition-colors"
        >
          לדף הבית
        </button>
      </div>
    </div>
  );
};

export default CheckoutStepConfirmation;
