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
  // ticketsLeft,
  priceBefore,
  seatLocation,
  price,
  // soldOut,
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

    // Check if it's in Hebrew display format like "חמישי, 6 אוק'"
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

    // Handle dd/mm/yyyy or dd.mm.yyyy format
    const normalizedDate = dateString.replace(/\./g, "/");
    const parts = normalizedDate.split("/");

    if (parts.length !== 3) {
      return { dayOfWeek: "-", day: dateString, month: "-" };
    }

    const [dayNum, monthNum, year] = parts.map(Number);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(year)) {
      return { dayOfWeek: "-", day: dateString, month: "-" };
    }

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
    <div className="flex flex-row items-center justify-between border-b-2 sm:border-b-4 border-highlight p-1.5 xs:p-2 sm:pt-4 sm:pr-8 sm:pb-4 sm:pl-6 gap-1 xs:gap-2 sm:gap-8 md:gap-12 lg:gap-14 shadow-large w-full max-w-full sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] h-auto min-h-[75px] xs:min-h-[80px] sm:min-h-[100px] md:min-h-[128px] bg-white select-none transition-transform duration-700 hover:scale-[1.01] cursor-pointer">
      {/* Date Section */}
      <div className="flex flex-col items-center justify-center min-w-[40px] xs:min-w-[45px] sm:min-w-[60px]">
        <span className="text-[10px] xs:text-[11px] sm:text-text-small md:text-text-large leading-tight font-normal text-strongText">
          {dateInfo.dayOfWeek}
        </span>
        <span className="text-base xs:text-lg sm:text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">
          {dateInfo.day}
        </span>
        <span className="text-[10px] xs:text-[11px] sm:text-text-small md:text-text-large leading-tight font-normal text-strongText">
          {dateInfo.month}
        </span>
      </div>

      {/* Divider */}
      <div className="w-[1.5px] xs:w-[2px] sm:w-[3px] h-[50px] xs:h-[55px] sm:h-20 md:h-24 bg-strongText flex-shrink-0"></div>

      {/* Event Title Section */}
      <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-0.5 xs:px-1 sm:px-2">
        {tag && (
          <div className="flex items-center justify-center mb-1">
            <span className="flex justify-center items-center bg-highlight px-1.5 xs:px-2 h-4 xs:h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 text-white text-[8px] xs:text-[9px] sm:text-[10px] md:text-text-extra-small leading-tight font-semibold">
              {tag}
            </span>
          </div>
        )}
        <span className="text-xs xs:text-sm sm:text-text-small md:text-heading-5-desktop lg:text-heading-4-desktop font-bold text-strongText text-center truncate w-full">
          {title}
        </span>

        {timeLeft && (
          <div
            dir="rtl"
            className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 mt-1 sm:mt-2"
          >
            <Image
              src={TimeLeftIcon}
              alt="Time Left"
              className="w-2.5 xs:w-3 h-2.5 xs:h-3 sm:w-[12px] sm:h-[12px] md:w-[15px] md:h-[15px]"
            />
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-text-medium font-light text-mutedText">
              זמן לאירוע:
            </span>
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-text-medium font-semibold text-primary">
              {timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-[1px] xs:w-[1.5px] sm:w-[3px] h-[50px] xs:h-[55px] sm:h-20 md:h-24 bg-weakText flex-shrink-0"></div>

      {/* Location Section */}
      <div className="flex items-center justify-center text-center text-[9px] xs:text-[10px] sm:text-text-extra-small md:text-heading-5-desktop font-bold text-weakTextBluish min-w-[55px] xs:min-w-[70px] sm:min-w-[120px] md:min-w-[180px] px-0.5 xs:px-1">
        <span className="truncate max-w-full">{seatLocation || location}</span>
      </div>

      {/* Divider */}
      <div className="w-[1px] xs:w-[1.5px] sm:w-[3px] h-[50px] xs:h-[55px] sm:h-20 md:h-24 bg-weakText flex-shrink-0"></div>

      {/* Price Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-0 xs:gap-0.5 sm:gap-2 md:gap-4 min-w-[50px] xs:min-w-[60px] sm:min-w-[100px] md:min-w-[130px]">
        <span className="text-strongText text-sm xs:text-base sm:text-heading-6-mobile md:text-heading-4-desktop font-extraBold leading-tight">
          ₪{price}
        </span>
        {priceBefore && (
          <span className="text-weakTextBluish font-bold text-[8px] xs:text-[9px] sm:text-text-small md:text-text-large line-through leading-tight">
            ₪{priceBefore}
          </span>
        )}
        <Image
          src={PriceIcon}
          alt="Price icon"
          className="w-[12px] h-[20px] sm:w-[16px] sm:h-[30px] md:w-[21px] md:h-[40px] hidden sm:block"
        />
      </div>

      {/* Action Button */}
      <Link href="/EventPage" className="flex-shrink-0">
        <button
          className="btn rounded-md btn-primary min-h-0 w-[31px] xs:w-[23px] h-[23px] xs:h-[26px] sm:w-[80px] sm:h-[36px] md:w-[100px] md:h-[40px] text-white text-[8px] xs:text-[9px] sm:text-[10px] md:text-text-large font-normal px-0.5 xs:px-1 sm:px-3"
          onClick={() => setCheckoutDialogOpen(true)}
        >
          {buttonAction}
        </button>

        <CheckoutDialog
          isOpen={isCheckoutDialogOpen}
          onClose={() => setCheckoutDialogOpen(false)}
          isUserConnected={false}
        />
      </Link>
    </div>
  );
};

export default SingleCard;
