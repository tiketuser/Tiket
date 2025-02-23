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
  return (
    <div className="flex justify-between w-full h-[296px] pt-4 pb-4 pr-72 pl-64 shadow-xsmall-inner">
      {/* Right: Event Details */}
      <div className="flex flex-col gap-2 pt-8 w-[382px] h-[264px]">
        {/* Event Title */}
        <span className="text-heading-1-desktop font-bold text-subtext leading-[67px] w-[900px]">
          {title}
        </span>
        <div className="w-[382px] h-[3px] bg-mutedText"></div>
        {/* Date and Location */}
        <div className="flex flex-col text-heading-5-desktop font-bold leading-[33px] text-strongText">
          <span>{date}</span>
          <span>{location}</span>
        </div>

        {/* Time and Tickets */}
        <div className="flex gap-[20px] items-center text-strongText font-normal text-text-large w-[700px]">
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
      <div className="">
        <Image
          src={imageSrc}
          alt="Event image"
          width={310}
          height={264}
          className=""
        />
      </div>
    </div>
  );
};

export default EventUpperSection;
