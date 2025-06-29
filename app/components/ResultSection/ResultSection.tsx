"use client";

import React from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../../public/images/SearchBar/SearchIconBold.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TiketFilters from "../TiketFilters/TiketFilters";

interface ResultSectionProps {
  withUpperSection: boolean;
  title: string;
  upperText?: string;
  subText: string;
  image?: React.ReactElement<typeof Image>;
  artistNames: string[]; 
}

const ResultSection: React.FC<ResultSectionProps> = ({
  withUpperSection,
  title,
  upperText,
  subText,
  image,
  artistNames,
}) => {
  const router = useRouter();

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
          value={title} // Pass the decoded value here!
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
