"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import TicketIcon from "../../../public/images/Event Page/Web/Ticket.svg";
import ClockIcon from "../../../public/images/Event Page/Web/Clock.svg";

interface EventUpperSectionProps {
  imageSrc: string;
  title: string;
  date: string;
  location: string;
  time: string;
  availableTickets: number;
}

const EventUpperSection: React.FC<EventUpperSectionProps> = ({
  imageSrc,
  title,
  date,
  location,
  time,
  availableTickets,
}) => {
  // Parse date string (format: "dd/mm/yyyy" or "dd.mm.yyyy") to Hebrew format
  const formatDateHebrew = useMemo(() => {
    return (dateString: string): string => {
      if (!dateString) return "";

      try {
        // Normalize date separator to /
        const normalizedDate = dateString.replace(/\./g, "/");
        const [day, month, year] = normalizedDate.split("/").map(Number);
        const dateObj = new Date(year, month - 1, day);

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
          "ינואר",
          "פברואר",
          "מרץ",
          "אפריל",
          "מאי",
          "יוני",
          "יולי",
          "אוגוסט",
          "ספטמבר",
          "אוקטובר",
          "נובמבר",
          "דצמבר",
        ];

        const dayOfWeek = hebrewDays[dateObj.getDay()];
        const monthName = hebrewMonths[month - 1];

        return `${dayOfWeek}, ${day} ב${monthName} ${year}`;
      } catch (error) {
        return dateString;
      }
    };
  }, []);

  const formattedDate = useMemo(
    () => formatDateHebrew(date),
    [date, formatDateHebrew],
  );

  return (
    <div className="flex flex-col sm:flex-row w-full sm:h-[346px] lg:pl-72 lg:pr-72 md:pt-4 md:pb-4 md:pr-24 md:pl-24 sm:pr-4 sm:pl-4 pb-6 shadow-small-inner">
      {/* Mobile: Image on top, centered */}
      <div className="sm:hidden w-full flex justify-center pt-6 pb-4">
        <Image
          src={imageSrc}
          alt="Event image"
          width={310}
          height={264}
          className="w-[180px] h-[180px] object-cover rounded-lg"
          priority
          loading="eager"
        />
      </div>

      {/* Event Details */}
      <div className="flex flex-col gap-2 sm:pt-8 px-5 sm:px-0 lg:w-[600px] sm:w-[382px] sm:h-[264px] w-full">
        {/* Event Title */}
        <span className="whitespace-nowrap truncate lg:max-w-[600px] sm:max-w-[382px] max-w-full sm:text-heading-1-desktop text-heading-2-mobile font-bold text-subtext sm:leading-[67px] leading-[45px] text-center sm:text-right">
          {title}
        </span>
        <div className="sm:w-[382px] w-full h-[3px] bg-mutedText mx-auto sm:mx-0"></div>
        {/* Date and Location */}
        <div className="flex flex-col sm:text-heading-5-desktop text-heading-5-mobile font-bold leading-[33px] text-strongText text-center sm:text-right">
          <span>{formattedDate}</span>
          <span>{location}</span>
        </div>

        {/* Time and Tickets */}
        <div className="flex mt-2 flex-wrap sm:gap-[20px] gap-3 items-center justify-center sm:justify-start text-strongText font-normal sm:text-text-large text-text-medium sm:w-[700px] w-full">
          <span>תחילת המופע:</span>
          <span className="flex items-center gap-2">
            <Image src={ClockIcon} alt="Clock icon" />
            {time}
          </span>
          <span>כרטיסים זמינים:</span>
          <span className="flex items-center gap-2">
            <Image src={TicketIcon} alt="Ticket icon" />
            {availableTickets}
          </span>
        </div>
      </div>
      {/* Desktop: Image on right */}
      <div className="hidden sm:flex w-full justify-end">
        <Image
          src={imageSrc}
          alt="Event image"
          width={310}
          height={264}
          className="md:w-[270px] md:h-[224px] sm:w-[210px] sm:h-[164px] mt-16"
          priority
          loading="eager"
        />
      </div>
    </div>
  );
};

export default EventUpperSection;
