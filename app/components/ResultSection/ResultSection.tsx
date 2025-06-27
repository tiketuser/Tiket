"use client";

import React from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../../public/images/SearchBar/SearchIconBold.svg";
// import CityIcon from "../../../public/images/SearchResult/City Icon.svg";
// import LocationIcon from "../../../public/images/SearchResult/Venue Icon.svg";
// import DateIcon from "../../../public/images/SearchResult/Date Icon.svg";
// import PriceIcon from "../../../public/images/SearchResult/Price Icon.svg";
// import DropdownIcon from "../../../public/images/SearchResult/Arrow.svg";
import Image from "next/image";
// import CustomSelectInput from "../CustomSelectInput/CustomSelectInput";
// import citiesData from "@/app/DemoData/citiesData";
// import venueData from "@/app/DemoData/venueData";
// import PriceFilter from "../PriceFilter/PriceFilter";
// import CustomDateInput from "../CustomDateInput/CustomDateInput";
import { useRouter } from "next/navigation";
import cardsData from "@/app/DemoData/cardsData";
import TiketFilters from "../TiketFilters/TiketFilters";

interface ResultSectionProps {
  withUpperSection: boolean;
  title: string;
  upperText?: string;
  subText: string;
  image?: React.ReactElement<typeof Image>;
}

const ResultSection: React.FC<ResultSectionProps> = ({
  withUpperSection,
  title,
  upperText,
  subText,
  image,
}) => {
  const router = useRouter();

  // חילוץ רשימת שמות האמנים מתוך cardsData (ללא כפילויות)
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    router.push(`/SearchResults/${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full">
      {/* Title Section - Only displayed if withUpperSection is true */}
      {withUpperSection && (
        <div className="text-center mb-6">
          <div>
            {image ? (
              <div className="mb-4 flex justify-center">{image}</div>
            ) : (
              <h2 className="text-text-large font-light text-subtext mb-1 select-none">
                {upperText}
              </h2>
            )}
            <h1 className="text-heading-1-desktop font-bold text-subtext select-none">
              {title}
            </h1>
            <p className="text-text-large text-subtext select-none">
              {subText}
            </p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex justify-center mt-[27px]">
        <CustomSearchInput
          id="Search artists or shows input"
          placeholder={title}
          placeholderColor="text-strongText"
          onEnter={handleSearch}
          suggestions={artistNames}
          image={
            <Image src={SearchIcon} alt="Search Icon" width={24} height={24} />
          }
        />
      </div>

      {/* Filters Section */}
      <TiketFilters />
    </div>
  );
};

export default ResultSection;
