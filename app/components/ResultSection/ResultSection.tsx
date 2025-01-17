"use client";

import React, { useState } from "react";
import CustomInput from "../CustomInput/CustomInput";
import SearchIcon from "../../../public/images/SearchBar/SearchIconBold.svg";
import CityIcon from "../../../public/images/SearchResult/City Icon.svg";
import LocationIcon from "../../../public/images/SearchResult/Venue Icon.svg";
import DateIcon from "../../../public/images/SearchResult/Date Icon.svg";
import PriceIcon from "../../../public/images/SearchResult/Price Icon.svg";
import DropdownIcon from "../../../public/images/SearchResult/Arrow.svg";
import Image from "next/image";
import CustomSelectInput from "../CustomSelectInput/CustomSelectInput";
import citiesData from "@/app/DemoData/citiesData";
import venueData from "@/app/DemoData/venueData";
import PriceFilter from "../PriceFilter/PriceFilter";

interface ResultSectionProps {
  title: string; // Prop for the dynamic title
  upperText: string;
  subText: string;
  image?: React.ReactElement<typeof Image>;
}

const ResultSection: React.FC<ResultSectionProps> = ({
  title,
  upperText,
  subText,
}) => {
  const [values, setValues] = useState<number[]>([125, 570]);
  return (
    <div className="w-full">
      {/* Title Section */}
      <div className="text-center mb-6">
        <h2 className="text-text-large font-light text-subtext mb-1 select-none">
          {upperText}
        </h2>
        <h1 className="text-heading-1-desktop font-bold text-subtext select-none">
          {title}עלמה גוב
        </h1>
        <p className="text-text-large text-subtext select-none">{subText}</p>
        <CustomInput
          // placeholder={title}
          placeholder="עלמה גוב"
          placeholderColor="text-strongText"
          image={
            <Image src={SearchIcon} alt="Search Icon" width={24} height={24} />
          }
        />
        <div className="flex justify-center gap-4 mt-6 mb-6">
          <div>
            <CustomSelectInput
              options={citiesData}
              placeholder="עיר"
              width="250px"
              icon={
                <Image src={CityIcon} alt="City Icon" width={24} height={14} />
              }
              dropdownIcon={
                <Image
                  src={DropdownIcon}
                  alt="Dropdown Icon"
                  width={22}
                  height={16}
                />
              }
            />
          </div>

          <div>
            <CustomSelectInput
              options={venueData}
              placeholder="אולם"
              width="250px"
              icon={
                <Image
                  src={LocationIcon}
                  alt="Location Icon"
                  width={18}
                  height={22}
                />
              }
              dropdownIcon={
                <Image
                  src={DropdownIcon}
                  alt="Dropdown Icon"
                  width={22}
                  height={16}
                />
              }
            />
          </div>

          <div>
            <CustomSelectInput
              options={citiesData}
              placeholder="תאריך"
              width="250px"
              icon={
                <Image src={DateIcon} alt="Date Icon" width={22} height={16} />
              }
              dropdownIcon={
                <Image
                  src={DropdownIcon}
                  alt="Dropdown Icon"
                  width={15}
                  height={15}
                />
              }
            />
          </div>

          <div className="w-1/2 mx-auto mt-10">
            <PriceFilter
              min={0}
              max={1000}
              step={1}
              defaultValue={values}
              onValueChange={(newValues) => setValues(newValues)}
            />
            <div className="mt-4 text-center">
              Selected Price Range: ₪{values[0]} - ₪{values[1]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultSection;
