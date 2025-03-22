"use client";

import React, { useState } from "react";
import Image from "next/image";
import DropdownIcon from "../../../public/images/Event Page/Web/Arrow.svg";

interface SeatingMapProps {
  title: string;
  venueName: string;
  SeatingMapsvg: string;
}

const SeatingMap: React.FC<SeatingMapProps> = ({
  title,
  venueName,
  SeatingMapsvg,
}) => {
  const [showSeatingMap, setSeatingMap] = useState(true);

  // Function to toggle visibility of SeatingMap
  const toggleSeatingMapVisibility = () => {
    setSeatingMap((prevSeatingMap) => !prevSeatingMap);
  };

  return (
    <div className="w-full shadow-small-inner pt-8 pr-4 pl-4 pb-8 sm:pt-4 sm:pr-72 sm:pl-32 sm:pb-14 mb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="sm:text-heading-1-desktop xs:text-heading-1-mobile text-heading-2-mobile font-bold text-subtext leading-[67px]">
          {title}
        </span>
      </div>
      <p className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-medium font-bold leading-[33px] text-strongText flex items-center justify-between">
        {venueName}
        <Image
          src={DropdownIcon}
          alt="Dropdown icon"
          width={29}
          height={16}
          onClick={toggleSeatingMapVisibility}
          className={`h-[15px] w-[16pxpx] float-end cursor-pointer transition-transform duration-700 ${
            showSeatingMap ? "rotate-0" : "rotate-180"
          }`}
        />
      </p>

      <div className="w-full h-[3px] bg-mutedText flex mt-3 mb-3"></div>

      {/* Seating Map */}
      <div
        className={`mt-14 transition-all duration-700 ease-in-out ${
          showSeatingMap ? "opacity-100 h-auto" : "opacity-0 h-0"
        }`}
      >
        {showSeatingMap && (
          <div className="mt-20 flex justify-center items-center">
            <Image
              src={SeatingMapsvg}
              alt="Event seating map"
              width={1190}
              height={730}
              className="cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingMap;
