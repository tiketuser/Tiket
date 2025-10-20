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
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  placeholder,
  icon,
  dropdownIcon,
  onDateChange,
  value,
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
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
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

  return (
    <div
      className="relative flex items-center border lg:w-[300px] sm:w-[250px] w-[120px] border-gray-300 rounded-lg px-4 py-2 h-12 z-10"
      ref={dropdownRef}
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
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={new Date()} // Default to current month if no selection
          selected={date}
          onSelect={handleDateChange}
          numberOfMonths={1}
          className="absolute top-full mt-1 right-0 rounded-md border w-full flex justify-center z-20"
        />
      )}
    </div>
  );
};

export default CustomDateInput;
