"use client";

import React from "react";

interface MyTicketCardProps {
  artist: string;
  date: string;
  venue: string;
  price: number;
  seatLabel: string;
  tag?: string;
  buttonLabel: string;
  onButtonClick?: () => void;
}

function parseDateInfo(dateString: string) {
  if (!dateString) return { dayOfWeek: "-", day: "-", month: "-" };

  const hebrewMonths = [
    "ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני",
    "יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳",
  ];
  const hebrewDays = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];

  const normalized = dateString.replace(/\./g, "/");
  const parts = normalized.split("/");
  if (parts.length !== 3) return { dayOfWeek: "-", day: dateString, month: "-" };

  const [dayNum, monthNum, year] = parts.map(Number);
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(year))
    return { dayOfWeek: "-", day: dateString, month: "-" };

  const dateObj = new Date(year, monthNum - 1, dayNum);
  return {
    dayOfWeek: hebrewDays[dateObj.getDay()],
    day: String(dayNum),
    month: hebrewMonths[monthNum - 1],
  };
}

const MyTicketCard: React.FC<MyTicketCardProps> = ({
  artist,
  date,
  venue,
  price,
  seatLabel,
  tag,
  buttonLabel,
  onButtonClick,
}) => {
  const dateInfo = parseDateInfo(date);

  return (
    <div className="w-full" dir="rtl">
      {/* ===== MOBILE (< sm) ===== */}
      <div className="sm:hidden relative bg-white rounded-xl shadow-medium overflow-hidden border border-gray-100">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-primary" />

        {/* Main content */}
        <div className="flex items-stretch">
          {/* Date column */}
          <div className="flex flex-col items-center justify-center bg-secondary/30 px-4 py-4 min-w-[64px]">
            <span className="text-[10px] font-medium text-strongText leading-none">{dateInfo.dayOfWeek}</span>
            <span className="text-2xl font-extrabold text-primary leading-tight">{dateInfo.day}</span>
            <span className="text-[10px] font-medium text-strongText leading-none">{dateInfo.month}</span>
          </div>

          {/* Dotted separator */}
          <div className="flex flex-col justify-center py-3 px-0">
            <div className="w-px h-full border-l-2 border-dashed border-gray-300" />
          </div>

          {/* Event info */}
          <div className="flex flex-col justify-center flex-1 px-3 py-3 gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              {tag && (
                <span className="bg-highlight text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-sm leading-none flex-shrink-0">
                  {tag}
                </span>
              )}
              <span className="text-sm font-bold text-strongText leading-tight truncate">{artist}</span>
            </div>
            <span className="text-xs text-mutedText leading-tight truncate">{venue}</span>
            <span className="text-xs text-mutedText leading-tight">{seatLabel}</span>
          </div>

          {/* Price + button column */}
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-3 border-r border-dashed border-gray-300 flex-shrink-0">
            <span className="text-base font-extrabold text-strongText leading-none">₪{price}</span>
            <button
              onClick={onButtonClick}
              className="btn btn-primary rounded-lg min-h-0 h-8 px-3 text-white text-xs font-medium whitespace-nowrap"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP (>= sm) — reuse existing SingleCard style ===== */}
      <div className="hidden sm:flex flex-row items-center justify-between border-b-4 border-highlight pt-4 pr-8 pb-4 pl-6 gap-14 shadow-large w-full max-w-[1000px] mx-auto min-h-[128px] bg-white select-none rounded-sm">
        {/* Date */}
        <div className="flex flex-col items-center justify-center min-w-[60px]">
          <span className="text-text-small font-normal text-strongText leading-tight">{dateInfo.dayOfWeek}</span>
          <span className="text-heading-3-desktop font-bold text-strongText leading-tight">{dateInfo.day}</span>
          <span className="text-text-small font-normal text-strongText leading-tight">{dateInfo.month}</span>
        </div>

        <div className="w-[3px] h-24 bg-strongText flex-shrink-0" />

        {/* Title + seat */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-[80px] px-2">
          {tag && (
            <span className="bg-highlight text-white text-text-extra-small font-semibold px-2 py-0.5 rounded-sm mb-1 leading-tight">
              {tag}
            </span>
          )}
          <span className="text-heading-5-desktop font-bold text-strongText text-center">{artist}</span>
          <span className="text-text-medium font-light text-mutedText mt-1">{seatLabel}</span>
        </div>

        <div className="w-[3px] h-24 bg-weakText flex-shrink-0" />

        {/* Venue */}
        <div className="flex items-center justify-center text-center text-heading-5-desktop font-bold text-weakTextBluish min-w-[160px] px-1">
          <span className="line-clamp-2">{venue}</span>
        </div>

        <div className="w-[3px] h-24 bg-weakText flex-shrink-0" />

        {/* Price */}
        <div className="flex items-center justify-center gap-4 min-w-[130px]">
          <span className="text-heading-4-desktop font-extraBold text-strongText leading-tight">₪{price}</span>
        </div>

        {/* Button */}
        <button
          onClick={onButtonClick}
          className="btn btn-primary rounded-md min-h-0 w-[100px] h-[40px] text-white text-text-large font-normal px-3 flex-shrink-0"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default MyTicketCard;
