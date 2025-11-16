"use client";

import React, { useState } from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../../public/images/SearchBar/SearchIconBold.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TiketFilters from "../TiketFilters/TiketFilters";
import { DateRange } from "react-day-picker";

interface FilterState {
  cities: string[];
  venues: string[];
  dateRange: DateRange | undefined;
  priceRange: number[];
}

interface ResultSectionProps {
  withUpperSection: boolean;
  title: string;
  upperText?: string;
  subText: string;
  image?: React.ReactElement<typeof Image>;
  artistNames: string[];
  onFilterChange?: (filters: FilterState) => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({
  withUpperSection,
  title,
  upperText,
  subText,
  image,
  artistNames,
  onFilterChange,
}) => {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    router.push(`/SearchResults/${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full">
      {/* Title Section - Only displayed if withUpperSection is true */}
      {withUpperSection && (
        <div className="text-center mb-4 sm:mb-6">
          <div>
            {image ? (
              <div className="mb-2 sm:mb-4 flex justify-center">{image}</div>
            ) : (
              <h2 className="text-base sm:text-text-large font-light text-subtext mb-1 select-none">
                {upperText}
              </h2>
            )}
            <h1 className="text-heading-1-mobile sm:text-heading-1-desktop font-bold text-subtext select-none">
              {title}
            </h1>
            <p className="text-sm sm:text-text-large text-subtext select-none">
              {subText}
            </p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex justify-center mt-4 sm:mt-[27px] relative">
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

        {/* Loading Overlay */}
        {isSearching && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <TiketFilters onFilterChange={onFilterChange} />
    </div>
  );
};

export default ResultSection;
