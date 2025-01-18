import * as Slider from "@radix-ui/react-slider";
import React, { useState } from "react";
import PriceLabel from "../../../public/images/SearchResult/Tooltip.svg";
import Image from "next/image";

interface PriceFilterProps {
  placeholder: string;
  width: string;
  icon?: React.ReactElement;
  dropdownIcon?: React.ReactElement;
  min?: number; // Minimum value of the slider
  max?: number; // Maximum value of the slider
  step?: number; // Step size
  defaultValue?: number[]; // Default values for the thumbs
  onValueChange?: (value: number[]) => void; // Callback for value changes
  className?: string; // Additional CSS classes
}

const PriceFilter: React.FC<PriceFilterProps> = ({
  placeholder,
  width = "200px",
  icon,
  dropdownIcon,
  min = 0,
  max = 1000,
  step = 1,
  defaultValue = [125, 570],
  onValueChange,
  className = "",
}) => {
  const [values, setValues] = useState<number[]>(defaultValue);
  const [isOpen, setIsOpen] = useState(false); // Tracks dropdown visibility

  // Handle value change
  const handleValueChange = (value: number[]) => {
    setValues(value);
    if (onValueChange) onValueChange(value);
  };

  // Calculate thumb positions in percentage
  const calculatePosition = (value: number) =>
    ((value - min) / (max - min)) * 100;

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  return (
    <div
      style={{ width }}
      className="relative flex items-center border border-gray-300 rounded-lg px-4 py-2 h-12"
    >
      {/* Right Icon */}
      {icon && (
        <div className="flex-shrink-0 cursor-pointer" onClick={toggleDropdown}>
          {icon}
        </div>
      )}

      {/* Selected Values / Placeholder */}
      <div
        className="flex-grow cursor-pointer text-right mr-2 whitespace-nowrap truncate"
        onClick={toggleDropdown}
      >
        <span className="text-weakText relative w-full">{placeholder}</span>
      </div>

      {/* Dropdown Icon */}
      {dropdownIcon && (
        <div
          className="flex-shrink-0 text-gray-500 cursor-pointer"
          onClick={toggleDropdown}
        >
          {dropdownIcon}
        </div>
      )}

      {/* Slider Container */}
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-[390px] h-[140px] border rounded-xl p-4 bg-white shadow-xxlarge">
          <div
            className={`relative top-[74.4px] flex flex-col items-center ${className}`}
          >
            <Slider.Root
              className="relative flex items-center w-full h-8"
              min={min}
              max={max}
              step={step}
              defaultValue={defaultValue}
              onValueChange={handleValueChange}
            >
              {/* Slider Track */}
              <Slider.Track className="relative w-full h-[11.2px] bg-weakText rounded-md">
                <Slider.Range className="absolute h-full bg-primary rounded-full" />
              </Slider.Track>

              {/* Thumbs */}
              {values.map((_, index) => (
                <Slider.Thumb
                  key={index}
                  className="block w-[33.6px] h-[33.6px] bg-white border-2 border-primary rounded-full shadow-md focus:outline-none cursor-pointer"
                />
              ))}
            </Slider.Root>

            {/* Labels */}
            <div className="relative w-full -translate-y-10">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="absolute transform -translate-y-full"
                  style={{
                    left: `${
                      calculatePosition(value) + (index === 0 ? -7 : -13)
                    }%`,
                    width: "74px",
                    height: "50px",
                  }}
                >
                  {/* SVG Background */}
                  <Image
                    src={PriceLabel}
                    alt="Label Background"
                    width={84}
                    height={60}
                    className="relative w-[74px]"
                  />

                  {/* Dynamic Text */}
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-strongText text-text-sm font-normal">
                    {value}₪
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceFilter;
