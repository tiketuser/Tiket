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

  // Parse date string (format: "dd/mm/yyyy" or "dd.mm.yyyy")
  const parseDateInfo = (dateString: string) => {
    console.log("=== SingleCard Date Debug ===");
    console.log("Received date:", dateString);
    console.log("Date type:", typeof dateString);
    console.log("Date is empty?", !dateString || dateString === "");

    if (!dateString || dateString === "" || dateString === "undefined") {
      console.error("❌ No valid date provided");
      return { dayOfWeek: "-", day: "-", month: "-" };
    }

    // Normalize date separator to /
    const normalizedDate = dateString.replace(/\./g, "/");
    console.log("Normalized date:", normalizedDate);

    const parts = normalizedDate.split("/");
    console.log("Date parts:", parts);

    if (parts.length !== 3) {
      console.error(
        "❌ Invalid date format - expected 3 parts, got:",
        parts.length
      );
      return { dayOfWeek: "-", day: "-", month: "-" };
    }

    const [day, month, year] = parts.map(Number);
    console.log("Parsed values:", { day, month, year });

    // Validate parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.error("❌ Invalid date values (NaN):", {
        day,
        month,
        year,
        dateString,
      });
      return { dayOfWeek: "-", day: "-", month: "-" };
    }

    const dateObj = new Date(year, month - 1, day);
    console.log("Created date object:", dateObj);

    const hebrewDays = [
      "ראשון",
      "שני",
      "שלישי",
      "רביעי",
      "חמישי",
      "שישי",
      "שבת",
    ];
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

    const result = {
      dayOfWeek: hebrewDays[dateObj.getDay()],
      day: day,
      month: hebrewMonths[month - 1],
    };

    console.log("✅ Final result:", result);
    console.log("=== End Date Debug ===");

    return result;
  };

  const dateInfo = parseDateInfo(date);

  return (
    <div className="flex flex-row items-center justify-between border-b-2 sm:border-b-4 border-highlight pt-2 pr-2 pb-2 pl-2 sm:pt-4 sm:pr-8 sm:pb-4 sm:pl-6 gap-2 sm:gap-8 md:gap-12 lg:gap-14 shadow-large w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] h-auto min-h-[85px] sm:min-h-[100px] md:min-h-[128px] bg-white select-none transition-transform duration-700 hover:scale-[1.01] cursor-pointer">
      {/* Date Section */}
      <div className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px]">
        <span className="text-[10px] sm:text-text-small md:text-text-large leading-tight sm:leading-normal font-normal text-strongText">
          {dateInfo.dayOfWeek}
        </span>
        <span className="text-text-regular sm:text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight sm:leading-normal">
          {dateInfo.day}
        </span>
        <span className="text-[10px] sm:text-text-small md:text-text-large leading-tight sm:leading-normal font-normal text-strongText">
          {dateInfo.month}
        </span>
      </div>

      {/* Divider */}
      <div className="w-[2px] sm:w-[3px] h-[60px] sm:h-20 md:h-24 bg-strongText flex-shrink-0"></div>

      {/* Event Title Section */}
      <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-1 sm:px-2">
        {tag && (
          <div className="flex items-center justify-center mb-1">
            <span className="flex justify-center items-center bg-highlight w-10 h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 text-white text-[8px] sm:text-[10px] md:text-text-extra-small leading-tight font-semibold">
              {tag}
            </span>
          </div>
        )}
        <span className="text-[10px] sm:text-text-small md:text-heading-5-desktop lg:text-heading-4-desktop font-bold text-strongText text-center truncate w-full">
          {title}
        </span>

        {timeLeft && (
          <div
            dir="rtl"
            className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2"
          >
            <Image
              src={TimeLeftIcon}
              alt="Time Left"
              className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] md:w-[15px] md:h-[15px]"
            />
            <span className="text-[8px] sm:text-[10px] md:text-text-medium font-light text-mutedText">
              זמן לאירוע:
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-text-medium font-semibold text-primary">
              {timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-[1.5px] sm:w-[3px] h-[60px] sm:h-20 md:h-24 bg-weakText flex-shrink-0"></div>

      {/* Location Section */}
      <div className="flex items-center justify-center text-center text-[8px] sm:text-text-extra-small md:text-heading-5-desktop font-bold text-weakTextBluish min-w-[80px] sm:min-w-[120px] md:min-w-[180px] px-1">
        <span className="truncate">{seatLocation || location}</span>
      </div>

      {/* Divider */}
      <div className="w-[1.5px] sm:w-[3px] h-[60px] sm:h-20 md:h-24 bg-weakText flex-shrink-0"></div>

      {/* Price Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-1 sm:gap-2 md:gap-4 min-w-[70px] sm:min-w-[100px] md:min-w-[130px]">
        <span className="text-strongText text-text-extra-small sm:text-heading-6-mobile md:text-heading-4-desktop font-extraBold leading-tight">
          ₪{price}
        </span>
        {priceBefore && (
          <span className="text-weakTextBluish font-bold text-[8px] sm:text-text-small md:text-text-large line-through leading-tight">
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
          className="btn rounded-md btn-primary min-h-0 w-[60px] h-[30px] sm:w-[80px] sm:h-[36px] md:w-[100px] md:h-[40px] text-white text-[8px] sm:text-[10px] md:text-text-large font-normal"
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
