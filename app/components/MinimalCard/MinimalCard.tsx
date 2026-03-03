import React from "react";

interface MinimalCardProps {
  title: string;
  date: string;
  seatLocation: string;
  venue?: string;
  price: number;
  width?: string;
}

const MinimalCard: React.FC<MinimalCardProps> = ({
  title,
  date,
  seatLocation,
  venue,
  price,
  width = "w-auto",
}) => {
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return { dayOfWeek: "חמישי", day: "15", month: "אוק׳" };

    try {
      let dateObj: Date;

      if (dateStr.includes("/") || dateStr.includes(".")) {
        const normalizedDate = dateStr.replace(/\./g, "/");
        const [day, month, year] = normalizedDate.split("/");
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateStr.match(/^\d+\s+\w+/)) {
        dateObj = new Date(dateStr);
      } else {
        dateObj = new Date(dateStr);
      }

      const daysHebrew = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
      const monthsHebrew = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];

      return {
        dayOfWeek: daysHebrew[dateObj.getDay()],
        day: dateObj.getDate().toString(),
        month: monthsHebrew[dateObj.getMonth()],
      };
    } catch (error) {
      console.error("Error parsing date:", error);
      return { dayOfWeek: "חמישי", day: "15", month: "אוק׳" };
    }
  };

  const { dayOfWeek, day, month } = parseDateString(date);

  return (
    <div className={`${width}`}>
      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-medium bg-white">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-primary" />

        <div className="flex items-stretch">
          {/* Date column */}
          <div className="flex flex-col items-center justify-center bg-secondary/30 px-4 sm:px-6 py-4 min-w-[68px] sm:min-w-[90px] flex-shrink-0">
            <span className="text-[10px] sm:text-xs font-medium text-strongText leading-none">{dayOfWeek}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-primary leading-tight my-0.5">{day}</span>
            <span className="text-[10px] sm:text-xs font-medium text-strongText leading-none">{month}</span>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center py-3 flex-shrink-0">
            <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center flex-1 px-4 sm:px-6 py-4 min-w-0 gap-1">
            <span className="text-base sm:text-lg font-bold text-strongText leading-tight truncate">{title}</span>
            {venue && <span className="text-xs sm:text-sm text-mutedText leading-tight truncate">{venue}</span>}
            <span className="text-xs sm:text-sm text-mutedText leading-tight truncate">{seatLocation}</span>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center py-3 flex-shrink-0">
            <div className="w-px h-full border-l-2 border-dashed border-gray-200" />
          </div>

          {/* Price */}
          <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-4 flex-shrink-0">
            <span className="text-lg sm:text-2xl font-extrabold text-strongText leading-none">₪{price}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalCard;
