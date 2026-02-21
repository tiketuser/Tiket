"use client";

import React, { useState } from "react";
import CheckBox from "../../../CheckBox/CheckBox";
import { TicketInfo } from "../CheckoutDialog";

interface CheckoutStepSummaryProps {
  ticket: TicketInfo;
  platformFee: number;
  total: number;
  onProceed: () => Promise<void>;
  error: string | null;
}

const parseDateString = (dateStr: string) => {
  if (!dateStr) return { dayOfWeek: "", day: "", month: "" };
  try {
    let dateObj: Date;
    if (dateStr.includes("/") || dateStr.includes(".")) {
      const normalized = dateStr.replace(/\./g, "/");
      const [d, m, y] = normalized.split("/");
      dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    } else {
      dateObj = new Date(dateStr);
    }
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const months = [
      "ינו׳",
      "פבר׳",
      "מרץ",
      "אפר׳",
      "מאי",
      "יוני",
      "יולי",
      "אוג׳",
      "ספט׳",
      "אוק׳",
      "נוב׳",
      "דצמ׳",
    ];
    return {
      dayOfWeek: days[dateObj.getDay()],
      day: dateObj.getDate().toString(),
      month: months[dateObj.getMonth()],
    };
  } catch {
    return { dayOfWeek: "", day: "", month: "" };
  }
};

const CheckoutStepSummary: React.FC<CheckoutStepSummaryProps> = ({
  ticket,
  platformFee,
  total,
  onProceed,
  error,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { dayOfWeek, day, month } = parseDateString(ticket.date);

  const handleProceed = async () => {
    if (!termsAccepted) return;
    setIsLoading(true);
    try {
      await onProceed();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-4 sm:gap-6" dir="rtl">
      {/* Ticket Card */}
      <div className="w-full rounded-xl overflow-hidden shadow-small border border-gray-100">
        <div className="bg-primary h-1.5" />
        <div className="bg-white px-4 py-4 sm:px-6 sm:py-5 flex gap-4 items-center">
          {/* Date Badge */}
          <div className="flex-shrink-0 w-[60px] sm:w-[72px] h-[72px] sm:h-[84px] rounded-lg bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-xs text-weakTextBluish leading-tight">
              {dayOfWeek}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-strongText leading-tight">
              {day}
            </span>
            <span className="text-[10px] sm:text-xs text-weakTextBluish leading-tight">
              {month}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-strongText truncate">
              {ticket.title}
            </h3>
            <p className="text-xs sm:text-sm text-weakTextBluish truncate">
              {ticket.venue}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-weakTextBluish">
              {ticket.seatLocation}
            </p>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 flex flex-col items-start gap-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-strongText">
              ₪{ticket.price}
            </span>
            {ticket.originalPrice && (
              <span className="text-xs text-weakTextBluish line-through">
                ₪{ticket.originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="w-full bg-gray-50 rounded-lg p-4 sm:p-6 space-y-3">
        {platformFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-text-regular text-weakTextBluish">
              עמלת שירות
            </span>
            <span className="text-text-regular text-weakTextBluish">
              ₪{platformFee.toFixed(2)}
            </span>
          </div>
        )}

        <div className={platformFee > 0 ? "border-t border-gray-300 pt-3" : ""}>
          <div className="flex justify-between items-center">
            <span className="text-heading-5-desktop font-bold text-strongText">
              סה"כ לתשלום
            </span>
            <span className="text-heading-5-desktop font-bold text-primary">
              ₪{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="w-full">
        <CheckBox
          text="אני מאשר את תנאי השימוש ומדיניות הביטולים"
          required
          onChange={(checked) => setTermsAccepted(checked)}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center w-full">{error}</p>
      )}

      {/* Proceed Button */}
      <button
        onClick={handleProceed}
        disabled={!termsAccepted || isLoading}
        className="w-full h-[48px] sm:h-[56px] bg-primary text-white rounded-lg font-bold text-text-regular sm:text-heading-5-desktop hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "מעבד..." : "המשך לתשלום"}
      </button>
    </div>
  );
};

export default CheckoutStepSummary;
