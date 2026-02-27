import React from "react";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import Image from "next/image";

interface MinimalCardProps {
  title: string;
  date: string;
  seatLocation: string;
  venue?: string;
  priceBefore?: number;
  price: number;
  width?: string;
}

const MinimalCard: React.FC<MinimalCardProps> = ({
  title,
  date,
  seatLocation,
  venue,
  priceBefore,
  price,
  width = "w-auto",
}) => {
  // Parse date string to extract day, day of week, and month
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return { dayOfWeek: "חמישי", day: "15", month: "אוק׳" };

    try {
      // Try to parse different date formats
      let dateObj: Date;

      // Check if format is DD/MM/YYYY or DD.MM.YYYY
      if (dateStr.includes("/") || dateStr.includes(".")) {
        const normalizedDate = dateStr.replace(/\./g, "/");
        const [day, month, year] = normalizedDate.split("/");
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // Check if format is like "15 Aug" or "15 אוג"
      else if (dateStr.match(/^\d+\s+\w+/)) {
        dateObj = new Date(dateStr);
      }
      // Try ISO format
      else {
        dateObj = new Date(dateStr);
      }

      // Hebrew days of week
      const daysHebrew = [
        "ראשון",
        "שני",
        "שלישי",
        "רביעי",
        "חמישי",
        "שישי",
        "שבת",
      ];
      // Hebrew months (abbreviated)
      const monthsHebrew = [
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

      const dayOfWeek = daysHebrew[dateObj.getDay()];
      const day = dateObj.getDate().toString();
      const month = monthsHebrew[dateObj.getMonth()];

      return { dayOfWeek, day, month };
    } catch (error) {
      console.error("Error parsing date:", error);
      return { dayOfWeek: "חמישי", day: "15", month: "אוק׳" };
    }
  };

  const { dayOfWeek, day, month } = parseDateString(date);
  return (
    <div className={`bg-white ${width}`}>
      {/* Desktop Layout (hidden on mobile) */}
      <div className="hidden sm:flex items-center justify-between pt-2 pr-8 pb-2 pl-6 gap-6 h-[100px]">
        {/* Date Section */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-text-large leading-[20px] font-normal text-strongText">
            {dayOfWeek}
          </span>
          <span className="text-heading-3-desktop font-bold text-strongText leading-[28px]">
            {day}
          </span>
          <span className="text-text-large leading-[20px] font-normal text-strongText">
            {month}
          </span>
        </div>
        <div className="w-[3px] h-24 bg-strongText"></div> {/* Divider */}
        {/* Event Title Section */}
        <div className="text-center whitespace-nowrap truncate w-[180px]">
          <span className="text-heading-6-desktop font-bold text-strongText">
            {title}
          </span>
        </div>
        <div className="w-[3px] h-24 bg-weakText"></div> {/* Divider */}
        {/* Location Section */}
        <div className="text-center text-heading-6-desktop font-bold text-weakTextBluish w-[200px]">
          <span>{seatLocation}</span>
        </div>
        <div className="w-[3px] h-24 bg-weakText"></div> {/* Divider */}
        {/* Price Section */}
        <div className="flex items-center text-center gap-4">
          <span className="text-strongText text-heading-4-desktop font-extraBold leading-10">
            ₪{price}
          </span>
          {priceBefore && (
            <span className="text-weakTextBluish font-bold text-text-large line-through leading-7">
              ₪{priceBefore}
            </span>
          )}
          <Image
            src={PriceIcon}
            alt="Price icon"
            className="h-[40px] w-[21px]"
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden rounded-xl overflow-hidden border border-gray-100 shadow-medium bg-white">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-primary" />

        <div className="flex items-stretch">
          {/* Date column */}
          <div className="flex flex-col items-center justify-center bg-secondary/30 px-3 py-3 min-w-[56px] flex-shrink-0">
            <span className="text-[9px] font-medium text-strongText leading-none">{dayOfWeek}</span>
            <span className="text-xl font-extrabold text-primary leading-tight">{day}</span>
            <span className="text-[9px] font-medium text-strongText leading-none">{month}</span>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center py-3 flex-shrink-0">
            <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center flex-1 px-3 py-3 min-w-0 gap-0.5">
            <span className="text-sm font-bold text-strongText leading-tight truncate">{title}</span>
            {venue && <span className="text-xs text-mutedText leading-tight truncate">{venue}</span>}
            <span className="text-xs text-mutedText leading-tight truncate">{seatLocation}</span>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center py-3 flex-shrink-0">
            <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
          </div>

          {/* Price */}
          <div className="flex flex-col items-center justify-center px-3 py-3 flex-shrink-0">
            <span className="text-base font-extrabold text-strongText leading-none">₪{price}</span>
            {priceBefore && (
              <span className="text-[11px] text-mutedText line-through leading-tight">₪{priceBefore}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalCard;
