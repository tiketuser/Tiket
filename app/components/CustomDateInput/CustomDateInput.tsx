"use client";

import { Calendar } from "@/components/ui/calendar";
import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface CustomDateInputProps {
  placeholder: string;
  icon?: React.ReactElement;
  dropdownIcon?: React.ReactElement;
  onDateChange?: (dateRange: DateRange | undefined) => void;
  value?: DateRange | undefined; // Controlled value
  width?: string; // Width prop
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  placeholder,
  icon,
  dropdownIcon,
  onDateChange,
  value,
  width = "200px",
}) => {
  const [date, setDate] = useState<DateRange | undefined>(value); // No initial date range
  const [isOpen, setIsOpen] = useState(false); // Tracks dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // To detect clicks outside the dropdown

  // Update internal state when controlled value changes
  useEffect(() => {
    if (value !== undefined || value === undefined) {
      setDate(value);
    }
  }, [value]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }

    // Auto-close when both from and to dates are selected
    if (newDate?.from && newDate?.to) {
      setTimeout(() => {
        setIsOpen(false);
      }, 300); // Small delay so user can see the selection
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (dropdownRef.current && !dropdownRef.current.contains(target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div
        className="relative w-full max-w-[170px] min-w-[140px] flex items-center border border-gray-300 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-12 z-10"
        ref={dropdownRef}
        style={{ width }}
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
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span className="text-weakText relative w-full">{placeholder}</span>
          )}
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

        {/* Dropdown - stays inside the component */}
        {isOpen && (
          <div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={new Date()}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={1}
              className="absolute top-full mt-1 right-0 rounded-md border w-full flex justify-center z-[30]"
            />
          </div>
        )}
      </div>

    </>
  );
};

export default CustomDateInput;
