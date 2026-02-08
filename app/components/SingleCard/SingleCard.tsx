"use client";

import React, { useState } from "react";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import TimeLeftIcon from "../../../public/images/Home Page/Web/TimeLeft.svg";
import Image from "next/image";
import Link from "next/link";
import CheckoutDialog from "../Dialogs/CheckoutDialog/CheckoutDialog";

interface SingleCardProps {
  imageSrc?: string;
  title: string;
  date: string;
  location: string;
  priceBefore?: number;
  price: number;
  soldOut?: boolean;
  tag?: string;
  seatLocation?: string;
  ticketsLeft?: number;
  timeLeft?: string;
  buttonAction: string;
}

const SingleCard: React.FC<SingleCardProps> = ({
  title,
  date,
  tag,
  location,
  priceBefore,
  seatLocation,
  price,
  timeLeft,
  buttonAction,
}) => {
  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);

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

  return (
    <>
      {/* ===== MOBILE LAYOUT (< sm) ===== */}
      <div
        dir="rtl"
        className="sm:hidden grid grid-cols-[1fr_auto_auto_auto_auto] items-center h-[60px] border-b-[3px] border-highlight px-2 shadow-large w-full bg-white select-none rounded-sm"
      >
        {/* Seat / Location */}
        <div className="flex items-center justify-start min-w-0 pr-1 pl-1">
          <span className="text-sm font-bold text-strongText leading-snug">
            {seatLocation || location}
          </span>
        </div>

        {/* Divider */}
        <div className="w-[1.5px] h-[32px] bg-gray-300 mx-2"></div>

        {/* Price */}
        <div className="flex flex-col items-center justify-center px-4">
          <span className="text-strongText text-lg font-extrabold leading-tight">
            ₪{price}
          </span>
          {priceBefore && priceBefore > price && (
            <span className="text-mutedText font-medium text-sm line-through leading-tight">
              ₪{priceBefore}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-[1.5px] h-[32px] bg-gray-300 mx-2"></div>

        {/* Button */}
        <div className="flex items-center justify-center">
          <button
            className="btn rounded-lg btn-primary min-h-0 w-[56px] h-[36px] text-white text-base font-medium px-4"
            onClick={() => setCheckoutDialogOpen(true)}
          >
            {buttonAction}
          </button>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (>= sm) ===== */}
      <div className="hidden sm:flex flex-row items-center justify-between border-b-4 border-highlight pt-4 pr-8 pb-4 pl-6 gap-8 md:gap-12 lg:gap-14 shadow-large w-full max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] min-h-[100px] md:min-h-[128px] bg-white select-none transition-transform duration-700 hover:scale-[1.01] cursor-pointer">
        {/* Date Section */}
        <div className="flex flex-col items-center justify-center min-w-[60px]">
          <span className="text-text-small md:text-text-large leading-tight font-normal text-strongText">
            {dateInfo.dayOfWeek}
          </span>
          <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">
            {dateInfo.day}
          </span>
          <span className="text-text-small md:text-text-large leading-tight font-normal text-strongText">
            {dateInfo.month}
          </span>
        </div>

        {/* Divider */}
        <div className="w-[3px] h-20 md:h-24 bg-strongText flex-shrink-0"></div>

        {/* Event Title Section */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-2">
          {tag && (
            <div className="flex items-center justify-center mb-1">
              <span className="flex justify-center items-center bg-highlight px-2 w-12 h-6 md:w-14 md:h-7 text-white text-[10px] md:text-text-extra-small leading-tight font-semibold rounded-sm">
                {tag}
              </span>
            </div>
          )}
          <span className="text-text-small md:text-heading-5-desktop lg:text-heading-4-desktop font-bold text-strongText text-center truncate w-full">
            {title}
          </span>
          {timeLeft && (
            <div dir="rtl" className="flex items-center gap-2 mt-2">
              <Image
                src={TimeLeftIcon}
                alt="Time Left"
                className="w-[12px] h-[12px] md:w-[15px] md:h-[15px]"
              />
              <span className="text-[10px] md:text-text-medium font-light text-mutedText">
                זמן לאירוע:
              </span>
              <span className="text-[10px] md:text-text-medium font-semibold text-primary">
                {timeLeft}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-[3px] h-20 md:h-24 bg-weakText flex-shrink-0"></div>

        {/* Location Section */}
        <div className="flex items-center justify-center text-center text-text-extra-small md:text-heading-5-desktop font-bold text-weakTextBluish min-w-[120px] md:min-w-[180px] px-1">
          <span className="line-clamp-2 max-w-full">
            {seatLocation || location}
          </span>
        </div>

        {/* Divider */}
        <div className="w-[3px] h-20 md:h-24 bg-weakText flex-shrink-0"></div>

        {/* Price Section */}
        <div className="flex flex-row items-center justify-center text-center gap-2 md:gap-4 min-w-[100px] md:min-w-[130px]">
          <span className="text-strongText text-heading-6-mobile md:text-heading-4-desktop font-extraBold leading-tight">
            ₪{price}
          </span>
          {priceBefore && (
            <span className="text-weakTextBluish font-bold text-text-small md:text-text-large line-through leading-tight">
              ₪{priceBefore}
            </span>
          )}
          <Image
            src={PriceIcon}
            alt="Price icon"
            className="w-[16px] h-[30px] md:w-[21px] md:h-[40px]"
          />
        </div>

        {/* Action Button */}
        <Link href="/EventPage" className="flex-shrink-0">
          <button
            className="btn rounded-md btn-primary min-h-0 w-[80px] h-[36px] md:w-[100px] md:h-[40px] text-white text-[10px] md:text-text-large font-normal px-3"
            onClick={() => setCheckoutDialogOpen(true)}
          >
            {buttonAction}
          </button>
        </Link>
      </div>

      <CheckoutDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => setCheckoutDialogOpen(false)}
        isUserConnected={false}
      />
    </>
  );
};

export default SingleCard;
