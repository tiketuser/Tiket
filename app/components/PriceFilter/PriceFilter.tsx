import * as Slider from "@radix-ui/react-slider";
import React, { useState, useEffect, useRef } from "react";
import PriceLabel from "../../../public/images/SearchResult/Tooltip.svg";
import Image from "next/image";
import { createPortal } from "react-dom";

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
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle value change
  const handleValueChange = (value: number[]) => {
    setValues(value);
    if (onValueChange) onValueChange(value);
  };

  // Calculate thumb positions in percentage
  const calculatePosition = (value: number) =>
    ((value - min) / (max - min)) * 100;

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // Click outside handler
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(target) &&
      (!modalRef.current || !modalRef.current.contains(target))
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderSlider = () => (
    <div className={`flex flex-col items-center ${className}`}>
      <Slider.Root
        className="relative flex items-center w-full h-8 mb-8"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        value={values}
        onValueChange={handleValueChange}
      >
        {/* Slider Track */}
        <Slider.Track className="relative w-full h-[11.2px] bg-weakText rounded-md cursor-pointer">
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
      <div className="relative w-full -translate-y-16">
        {values.map((value, index) => (
          <div
            key={index}
            className="absolute transform -translate-y-full -translate-x-1/2"
            style={{
              left: `${calculatePosition(value)}%`,
              width: "90px",
              height: "75px",
            }}
          >
            {/* SVG Background */}
            <Image
              src={PriceLabel}
              alt="Label Background"
              width={90}
              height={75}
              className="relative w-[100px]"
            />

            {/* Dynamic Text */}
            <div className="absolute top-1/4 left-0 w-full flex items-center justify-center text-strongText text-text-medium font-normal">
              {value}₪
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={dropdownRef}
        style={{ width }}
        className="relative flex items-center border border-gray-300 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-12 z-10"
      >
        {/* Right Icon */}
        {icon && (
          <div
            className="flex-shrink-0 cursor-pointer w-3 sm:w-4 md:w-6"
            onClick={toggleDropdown}
          >
            {icon}
          </div>
        )}

        {/* Selected Values / Placeholder */}
        <div
          className="flex-grow cursor-pointer text-right mr-1 sm:mr-2 whitespace-nowrap truncate text-xs sm:text-text-small md:text-text-medium"
          onClick={toggleDropdown}
        >
          {values[0] !== min || values[1] !== max ? (
            <span className="text-gray-700">
              {values[0]}₪ - {values[1]}₪
            </span>
          ) : (
            <span className="text-weakText relative w-full">{placeholder}</span>
          )}
        </div>

        {/* Dropdown Icon */}
        {dropdownIcon && (
          <div
            className="flex-shrink-0 text-gray-500 cursor-pointer w-3 sm:w-4"
            onClick={toggleDropdown}
          >
            {dropdownIcon}
          </div>
        )}

        {/* Slider Container - Desktop only */}
        {isOpen && (
          <div className="hidden sm:block absolute top-full mt-1 right-0 w-[340px] h-[140px] border rounded-xl p-4 bg-zinc-50 shadow-xxlarge z-20">
            <div className="relative top-[74.4px]">{renderSlider()}</div>
          </div>
        )}
      </div>

      {/* Mobile: Full-screen overlay - rendered as portal */}
      {isMounted &&
        isOpen &&
        createPortal(
          <div className="sm:hidden fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
            <div
              ref={modalRef}
              className="bg-white rounded-xl p-6 m-4 w-[95vw] max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-primary">
                  בחר טווח מחירים
                </h3>
                <button
                  onClick={toggleDropdown}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="relative top-7 py-8 px-4">{renderSlider()}</div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <span className="text-sm text-gray-600">
                  טווח: {values[0]}₪ - {values[1]}₪
                </span>
                <button
                  onClick={toggleDropdown}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90"
                >
                  החל
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default PriceFilter;
