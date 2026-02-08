"use client";

import { Calendar } from "@/components/ui/calendar";
import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { createPortal } from "react-dom";

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
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted
  const dropdownRef = useRef<HTMLDivElement>(null); // To detect clicks outside the dropdown
  const modalRef = useRef<HTMLDivElement>(null); // To detect clicks outside the modal

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    // Check if click is outside both the dropdown and the modal
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

        {/* Desktop: Dropdown - stays inside the component */}
        {isOpen && (
          <div className="hidden sm:block">
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

      {/* Mobile: Full-screen overlay - rendered as portal */}
      {isMounted &&
        isOpen &&
        createPortal(
          <div className="sm:hidden fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
            <div
              ref={modalRef}
              className="bg-white rounded-xl p-6 m-4 max-h-[90vh] overflow-auto w-[95vw] max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  בחר תאריך
                </h3>
                <button
                  onClick={toggleDropdown}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={new Date()}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={1}
                className="rounded-md border w-full flex justify-center"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CustomDateInput;
