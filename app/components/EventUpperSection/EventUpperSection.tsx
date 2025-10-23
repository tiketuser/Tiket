"use client";

import React from "react";
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
  const formatDateHebrew = (dateString: string): string => {
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

  return (
    <div className="flex w-full sm:h-[346px] xs:h-[280px] h-[240px] lg:pl-72 lg:pr-72 md:pt-4 md:pb-4 md:pr-24 md:pl-24 sm:pr-4 sm:pl-4 xs:pt-4 pb-4 pr-4 pl-4 shadow-small-inner">
      {/* Right: Event Details */}
      <div className="flex flex-col xs:gap-2 gap-1 xs:pt-8 lg:w-[600px] sm:w-[382px] sm:h-[264px] w-[200px]">
        {/* Event Title */}
        <span className="whitespace-nowrap truncate lg:max-w-[600px] sm:max-w-[382px] xs:max-w-[183px] max-w-[160px] sm:text-heading-1-desktop xs:text-heading-2-mobile text-heading-4-mobile font-bold text-subtext leading-[67px]">
          {title}
        </span>
        <div className="sm:w-[382px] xs:w-[183px] w-[160px] h-[3px] relative top-[-15px] xs:top-0 bg-mutedText"></div>
        {/* Date and Location */}
        <div className="flex flex-col sm:text-heading-5-desktop xs:text-heading-5-mobile text-heading-6-mobile font-bold leading-[27px] xs:leading-[33px] text-strongText">
          <span>{formatDateHebrew(date)}</span>
          <span>{location}</span>
        </div>

        {/* Time and Tickets */}
        <div className="flex mt-2 flex-wrap sm:gap-[20px] gap-2 items-center text-strongText font-normal sm:text-text-large xs:text-text-medium text-text-small  sm:w-[700px] w-[182px]">
          <span className="">תחילת המופע:</span>
          <span className="flex items-center gap-2">
            <Image src={ClockIcon} alt="Price icon" />
            {time}
          </span>
          <span>כרטיסים זמינים:</span>
          <span className="flex items-center gap-2">
            <Image src={TicketIcon} alt="Ticket icon" />
            {availableTickets}
          </span>
        </div>
      </div>
      {/* Left: Image */}
      <div className="w-full flex justify-end">
        <Image
          src={imageSrc}
          alt="Event image"
          width={310}
          height={264}
          className="md:w-[270px] md:h-[224px] sm:w-[210px] sm:h-[164px] xs:w-[164px] xs:h-[132px] w-[124px] h-[92px] xs:mt-16 mt-8"
        />
      </div>
    </div>
  );
};

export default EventUpperSection;
