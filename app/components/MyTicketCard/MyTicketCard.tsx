"use client";

import React from "react";

interface MyTicketCardProps {
  artist: string;
  date: string;
  time?: string;
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
  time,
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
            {time && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-mutedText leading-tight">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {time}
              </span>
            )}
            <span className="text-xs text-mutedText leading-tight">{seatLabel}</span>
          </div>

          {/* Price + button column */}
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-3 border-r border-dashed border-gray-300 flex-shrink-0">
            <span className="text-base font-extrabold text-strongText leading-none">₪{price}</span>
            <button
              onClick={onButtonClick}
              className="btn btn-primary rounded-lg min-h-0 h-8 px-3 text-white text-xs font-medium whitespace-nowrap flex items-center justify-center leading-none transition-all duration-150 hover:scale-105 hover:shadow-md active:scale-95"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP (>= sm) — matches SingleCard/BundleCard style ===== */}
      <div className="hidden sm:flex items-center justify-center w-full">
        <div className="flex flex-row items-center justify-between border-b-4 border-highlight pt-4 pr-8 pb-4 pl-6 gap-4 sm:gap-6 md:gap-12 lg:gap-14 shadow-large flex-1 max-w-[700px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] min-h-[100px] md:min-h-[128px] bg-white select-none">
          {/* Date column */}
          <div className="flex flex-col items-center justify-center min-w-[60px] flex-shrink-0">
            <span className="text-heading-6-desktop md:text-heading-3-desktop font-bold text-strongText leading-tight">{dateInfo.day}</span>
            <span className="text-text-small font-normal text-strongText leading-tight">{dateInfo.month}</span>
          </div>

          {/* Strong divider */}
          <div className="w-[3px] h-20 md:h-24 bg-strongText flex-shrink-0" />

          {/* Event name + venue + seat chip */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 justify-center">
            <div className="flex items-center gap-2">
              {tag && (
                <span className="inline-flex items-center gap-1.5 bg-highlight text-white text-text-extra-small font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                  {tag}
                </span>
              )}
              <span className="text-heading-5-desktop font-bold text-strongText truncate">{artist}</span>
            </div>
            {time && (
              <span className="inline-flex items-center gap-1.5 text-text-medium font-bold text-mutedText leading-tight">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {time}
              </span>
            )}
            <span className="text-text-medium font-medium text-weakTextBluish truncate">{venue}</span>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-weakTextBluish text-text-extra-small md:text-text-large font-bold px-2.5 py-1 rounded-md self-start">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4" />
                <path d="M2 15v4a2 2 0 002 2h16a2 2 0 002-2v-4" />
                <path d="M6 9h12M6 15h12" />
              </svg>
              {seatLabel}
            </span>
          </div>

          {/* Divider */}
          <div className="w-[3px] h-20 md:h-24 bg-weakText flex-shrink-0" />

          {/* Price */}
          <div className="flex flex-row items-center justify-center text-center gap-2 md:gap-4 min-w-[70px] md:min-w-[130px] flex-shrink-0">
            <span className="text-strongText text-heading-6-mobile md:text-heading-4-desktop font-extraBold leading-tight">
              ₪{price}
            </span>
          </div>

          {/* Button */}
          <button
            onClick={onButtonClick}
            className="bg-primary rounded-md min-w-[80px] md:min-w-[100px] h-[36px] md:h-[40px] text-white text-[10px] md:text-text-large font-normal px-4 flex-shrink-0 flex items-center justify-center leading-tight whitespace-nowrap transition-all duration-150 hover:scale-105 hover:shadow-md hover:bg-primary/90 active:scale-95"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyTicketCard;
