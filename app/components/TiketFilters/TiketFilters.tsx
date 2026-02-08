import React, { useState } from "react";
import Image from "next/image";
import citiesData from "@/app/DemoData/citiesData";
import venueData from "@/app/DemoData/venueData";
import CustomSelectInput from "../CustomSelectInput/CustomSelectInput";
import CustomDateInput from "../CustomDateInput/CustomDateInput";
import PriceFilter from "../PriceFilter/PriceFilter";
import { DateRange } from "react-day-picker";

// ייבוא אייקונים
import CityIcon from "../../../public/images/SearchResult/City Icon.svg";
import LocationIcon from "../../../public/images/SearchResult/Venue Icon.svg";
import DateIcon from "../../../public/images/SearchResult/Date Icon.svg";
import PriceIcon from "../../../public/images/SearchResult/Price Icon.svg";
import DropdownIcon from "../../../public/images/SearchResult/Arrow.svg";

interface TiketFiltersProps {
  onFilterChange?: (filters: {
    cities: string[];
    venues: string[];
    dateRange: DateRange | undefined;
    priceRange: number[];
  }) => void;
}

const TiketFilters: React.FC<TiketFiltersProps> = ({ onFilterChange }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        cities,
        venues,
        dateRange,
        priceRange,
      });
    }
  };

  const handleResetFilters = () => {
    setCities([]);
    setVenues([]);
    setDateRange(undefined);
    setPriceRange([0, 1000]);

    if (onFilterChange) {
      onFilterChange({
        cities: [],
        venues: [],
        dateRange: undefined,
        priceRange: [0, 1000],
      });
    }
  };

  const handleCitiesChange = (selected: string[]) => {
    setCities(selected);
  };

  const handleVenuesChange = (selected: string[]) => {
    setVenues(selected);
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
  };

  return (
    <>
      {/* Filters Section */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 mb-4 sm:mb-6 px-2 sm:px-0">
        {/* בחירת עיר */}
        <div className="w-[calc(50%-4px)] sm:w-auto">
          <CustomSelectInput
            options={citiesData}
            placeholder="עיר"
            width="100%"
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
            onSelectionChange={handleCitiesChange}
            value={cities}
          />
        </div>

        {/* בחירת אולם */}
        <div className="w-[calc(50%-4px)] sm:w-auto">
          <CustomSelectInput
            options={venueData}
            placeholder="אולם"
            width="100%"
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
            onSelectionChange={handleVenuesChange}
            value={venues}
          />
        </div>

        {/* בחירת תאריך */}
        <div className="w-[calc(50%-4px)] sm:w-auto">
          <CustomDateInput
            placeholder="תאריך"
            width="100%"
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
            onDateChange={handleDateChange}
            value={dateRange}
          />
        </div>

        {/* סינון לפי מחיר */}
        <div className="w-[calc(50%-4px)] sm:w-auto">
          <PriceFilter
            placeholder="מחיר"
            width="100%"
            icon={
              <Image src={PriceIcon} alt="Price Icon" width={22} height={16} />
            }
            dropdownIcon={
              <Image
                src={DropdownIcon}
                alt="Dropdown Icon"
                width={15}
                height={15}
              />
            }
            min={0}
            max={1000}
            step={1}
            defaultValue={priceRange}
            onValueChange={handlePriceChange}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-2">
        <button
          onClick={handleApplyFilters}
          className="px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base bg-primary text-white rounded-lg  hover:bg-primary/90 transition-colors"
        >
          החל סינון
        </button>
        <button
          onClick={handleResetFilters}
          className="px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          אפס סינון
        </button>
      </div>
    </>
  );
};

export default TiketFilters;
