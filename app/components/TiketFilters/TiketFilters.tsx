

import React, { useState } from "react";
import Image from "next/image";
import citiesData from "@/app/DemoData/citiesData";
import venueData from "@/app/DemoData/venueData";
import CustomSelectInput from "../CustomSelectInput/CustomSelectInput";
import CustomDateInput from "../CustomDateInput/CustomDateInput";
import PriceFilter from "../PriceFilter/PriceFilter";

// ייבוא אייקונים
import CityIcon from "../../../public/images/SearchResult/City Icon.svg";
import LocationIcon from "../../../public/images/SearchResult/Venue Icon.svg";
import DateIcon from "../../../public/images/SearchResult/Date Icon.svg";
import PriceIcon from "../../../public/images/SearchResult/Price Icon.svg";
import DropdownIcon from "../../../public/images/SearchResult/Arrow.svg";

const TiketFilters = () => {
  const [values, setValues] = useState<number[]>([20, 80]);

  return (
    <>
      {/* Filters Section */}
      <div className="flex justify-center gap-4 mt-6 mb-6">
        {/* בחירת עיר */}
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

        {/* בחירת אולם */}
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

        {/* בחירת תאריך */}
        <div>
          <CustomDateInput
            placeholder="תאריך"
            width="300px"
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

        {/* סינון לפי מחיר */}
        <div>
          <PriceFilter
            placeholder="מחיר"
            width="250px"
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
            defaultValue={values}
            onValueChange={(newValues) => setValues(newValues)}
          />
        </div>
      </div>
    </>
  );
};

export default TiketFilters;
