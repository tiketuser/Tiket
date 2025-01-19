"use client";

import { Calendar } from "@/components/ui/calendar";
import React, { useState, useRef, useEffect } from "react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

interface CustomDateInputProps {
  placeholder: string;
  width: string;
  icon?: React.ReactElement;
  dropdownIcon?: React.ReactElement;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
  placeholder,
  width = "200px",
  icon,
  dropdownIcon,
}) => {
  const [date, setDate] = useState<DateRange | undefined>(undefined); // No initial date range
  const [isOpen, setIsOpen] = useState(false); // Tracks dropdown visibility
  const dropdownRef = useRef<HTMLDivElement>(null); // To detect clicks outside the dropdown

  const toggleDropdown = () => setIsOpen((prev) => !prev);

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
      style={{ width }}
      className="relative flex items-center border border-gray-300 rounded-lg px-4 py-2 h-12 z-10"
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
          onSelect={setDate}
          numberOfMonths={1}
          className="absolute top-full mt-1 right-0 rounded-md border w-full flex justify-center z-20"
        />
      )}
    </div>
  );
};

export default CustomDateInput;
