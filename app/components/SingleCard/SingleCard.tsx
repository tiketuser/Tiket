"use client";

import React, { useState } from "react";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import TimeLeftIcon from "../../../public/images/Home Page/Web/TimeLeft.svg";
import Image from "next/image";
import Link from "next/link";
import CheckoutDialog from "../Dialogs/CheckoutDialog/CheckoutDialog";
import type { TicketInfo } from "../Dialogs/CheckoutDialog/CheckoutDialog";

interface SingleCardProps {
  imageSrc?: string;
  title: string;
  date: string;
  location: string;
  price: number;
  soldOut?: boolean;
  tag?: string;
  seatLocation?: string;
  ticketsLeft?: number;
  timeLeft?: string;
  buttonAction: string;
  ticketId?: string;
  sellerId?: string;
  // Selection mode (used by TicketListClient on EventPage)
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onInstantBuy?: () => void;
  // Show artist + date on mobile (use in pages where this context isn't already visible)
  showMobileHeader?: boolean;
}

const SingleCard: React.FC<SingleCardProps> = ({
  title,
  date,
  tag,
  location,
  seatLocation,
  price,
  timeLeft,
  buttonAction,
  ticketId,
  sellerId,
  isSelectable = false,
  isSelected = false,
  onToggleSelect,
  onInstantBuy,
  showMobileHeader = false,
}) => {
  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [buyPressed, setBuyPressed] = useState(false);

  // Parse date string (supports "dd/mm/yyyy", "dd.mm.yyyy", or Hebrew format like "חמישי, 6 אוק'")
  const parseDateInfo = (dateString: string) => {
    if (!dateString || dateString === "" || dateString === "undefined") {
      return { dayOfWeek: "-", day: "-", month: "-" };
    }

    const hebrewMonths = [
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
    const hebrewMonthNames = [
      "ינו",
      "פבר",
      "מרץ",
      "אפר",
      "מאי",
      "יוני",
      "יולי",
      "אוג",
      "ספט",
      "אוק",
      "נוב",
      "דצמ",
    ];

    const hebrewMatch = dateString.match(/^(.+?)?,?\s*(\d{1,2})\s+(.+?)['׳]?$/);
    if (hebrewMatch) {
      const dayOfWeek = hebrewMatch[1]?.trim() || "-";
      const day = hebrewMatch[2];
      const monthStr = hebrewMatch[3].trim().replace(/['׳]/g, "");
      const monthIndex = hebrewMonthNames.findIndex((m) =>
        monthStr.startsWith(m),
      );
      const month = monthIndex >= 0 ? hebrewMonths[monthIndex] : monthStr;
      return { dayOfWeek, day, month };
    }

    const normalizedDate = dateString.replace(/\./g, "/");
    const parts = normalizedDate.split("/");
    if (parts.length !== 3)
      return { dayOfWeek: "-", day: dateString, month: "-" };

    const [dayNum, monthNum, year] = parts.map(Number);
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(year))
      return { dayOfWeek: "-", day: dateString, month: "-" };

    const dateObj = new Date(year, monthNum - 1, dayNum);
    const hebrewDays = [
      "ראשון",
      "שני",
      "שלישי",
      "רביעי",
      "חמישי",
      "שישי",
      "שבת",
    ];

    return {
      dayOfWeek: hebrewDays[dateObj.getDay()],
      day: String(dayNum),
      month: hebrewMonths[monthNum - 1],
    };
  };

  const dateInfo = parseDateInfo(date);

  const handleBuyClick = () => {
    setBuyPressed(true);
    setTimeout(() => setBuyPressed(false), 200);
    if (onInstantBuy) {
      onInstantBuy();
    } else {
      setCheckoutDialogOpen(true);
    }
  };

  const ticketInfo: TicketInfo | null = ticketId
    ? {
        ticketId,
        title,
        date,
        venue: location,
        seatLocation: seatLocation || location,
        price,
        sellerId: sellerId || "",
      }
    : null;

  return (
    <>
      {/* ===== MOBILE LAYOUT (< sm) ===== */}
      <div className="sm:hidden flex flex-col w-full" dir="rtl">
        {/* Optional artist + date header for pages where context isn't shown above */}
        {showMobileHeader && (
          <div className="flex items-center justify-between px-1 pb-1.5">
            <span className="text-sm font-bold text-strongText">{title}</span>
            <span className="text-xs text-mutedText">
              {dateInfo.day} {dateInfo.month}
            </span>
          </div>
        )}

        {/* Modern ticket card */}
        <div
          className={`relative bg-white rounded-xl shadow-medium border overflow-hidden transition-all duration-200 ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-gray-100"}`}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-primary" />

          <div className="flex items-stretch">
            {/* Seat info */}
            <div className="flex flex-wrap items-center gap-1 flex-1 px-3 py-3 min-w-0">
              {tag && (
                <span className="inline-flex items-center bg-highlight text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                  {tag}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-strongText bg-gray-100 px-1.5 py-0.5 rounded leading-none">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4" />
                  <path d="M2 15v4a2 2 0 002 2h16a2 2 0 002-2v-4" />
                  <path d="M6 9h12M6 15h12" />
                </svg>
                {seatLocation || location}
              </span>
            </div>

            {/* Dashed separator */}
            <div className="flex items-center py-3">
              <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
            </div>

            {/* Price */}
            <div className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0 min-w-[56px]">
              <span className="text-base font-extrabold text-strongText leading-none">
                ₪{price}
              </span>
            </div>

            {/* Dashed separator */}
            <div className="flex items-center py-3">
              <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
            </div>

            {/* Buy button */}
            <div className="flex items-center justify-center px-3 py-3 flex-shrink-0">
              <button
                className={`btn btn-primary rounded-lg min-h-0 h-8 px-3 text-white text-xs font-semibold transition-transform duration-150 ${buyPressed ? "scale-90" : "scale-100"}`}
                onClick={handleBuyClick}
              >
                {buttonAction}
              </button>
            </div>

            {/* Checkbox — trailing edge in RTL */}
            {isSelectable && (
              <>
                <div className="flex items-center py-3">
                  <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
                </div>
                <div className="flex items-center justify-center px-3">
                  <button
                    onClick={onToggleSelect}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-300"
                    }`}
                    aria-label="בחר כרטיס"
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
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (>= sm) ===== */}
      <div className="hidden sm:flex items-center justify-center w-full gap-3">
        <div className="flex flex-row items-center justify-between border-b-4 border-highlight pt-4 pr-8 pb-4 pl-6 gap-4 sm:gap-6 md:gap-12 lg:gap-14 shadow-large flex-1 max-w-[700px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] min-h-[100px] md:min-h-[128px] bg-white select-none">
          {/* "כרטיס יחיד" label — mirrors BundleCard's count column */}
          <div className="flex flex-col items-center justify-center min-w-[60px] flex-shrink-0">
            <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">
              כרטיס
            </span>
            <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">
              יחיד
            </span>
          </div>

          {/* Strong divider — mirrors BundleCard */}
          <div className="w-[3px] h-20 md:h-24 bg-strongText flex-shrink-0" />

          {/* Seat location chip — mirrors BundleCard seat chips */}
          <div className="flex flex-wrap gap-2 flex-1 min-w-0 items-center">
            {tag && (
              <span className="inline-flex items-center gap-1.5 bg-highlight text-white text-text-extra-small md:text-text-large font-bold px-2.5 py-1 rounded-md">
                {tag}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-weakTextBluish text-text-extra-small md:text-text-large font-bold px-2.5 py-1 rounded-md">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4" />
                <path d="M2 15v4a2 2 0 002 2h16a2 2 0 002-2v-4" />
                <path d="M6 9h12M6 15h12" />
              </svg>
              {seatLocation || location}
            </span>
          </div>

          {/* Divider */}
          <div className="w-[3px] h-20 md:h-24 bg-weakText flex-shrink-0"></div>

          {/* Price Section */}
          <div className="flex flex-row items-center justify-center text-center gap-2 md:gap-4 min-w-[70px] md:min-w-[130px] flex-shrink-0">
            <span className="text-strongText text-heading-6-mobile md:text-heading-4-desktop font-extraBold leading-tight">
              ₪{price}
            </span>
            <Image
              src={PriceIcon}
              alt="Price icon"
              className="w-[16px] h-[30px] md:w-[21px] md:h-[40px]"
            />
          </div>

          {/* Action Button */}
          <button
            className={`btn rounded-md btn-primary min-h-0 w-[80px] h-[36px] md:w-[100px] md:h-[40px] text-white text-[10px] md:text-text-large font-normal px-3 flex-shrink-0 transition-transform duration-150 ${buyPressed ? "scale-90" : "scale-100"}`}
            onClick={handleBuyClick}
          >
            {buttonAction}
          </button>

          {/* Checkbox — inside card, left side (trailing in RTL) */}
          {isSelectable && (
            <>
              <div className="w-[3px] h-20 md:h-24 bg-weakText flex-shrink-0"></div>
              <button
                onClick={onToggleSelect}
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-white border-gray-300"
                }`}
                aria-label="בחר כרטיס"
              >
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-white"
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
              </button>
            </>
          )}
        </div>
      </div>

      {/* Internal checkout dialog — only used when not in selectable/instant-buy mode */}
      {!onInstantBuy && ticketInfo && (
        <CheckoutDialog
          isOpen={isCheckoutDialogOpen}
          onClose={() => setCheckoutDialogOpen(false)}
          tickets={[ticketInfo]}
        />
      )}
    </>
  );
};

export default SingleCard;
