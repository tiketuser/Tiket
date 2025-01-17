"use client";

import React, { useState, useRef, useEffect } from "react";

interface CustomSelectInputProps {
  placeholder: string;
  width: string;
  icon?: React.ReactElement;
  dropdownIcon?: React.ReactElement;
  options: string[]; // Array of items
}

const CustomSelectInput: React.FC<CustomSelectInputProps> = ({
  placeholder,
  width = "200px",
  icon,
  dropdownIcon,
  options,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Tracks dropdown visibility
  const [selectedValues, setSelectedValues] = useState<string[]>([]); // Tracks selected options
  const dropdownRef = useRef<HTMLDivElement>(null); // To detect clicks outside the dropdown

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleOptionClick = (option: string) => {
    setSelectedValues(
      (prev) =>
        prev.includes(option)
          ? prev.filter((value) => value !== option) // Remove option if already selected
          : [...prev, option] // Add option if not selected
    );
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
      style={{ width }}
      className="relative flex items-center border border-gray-300 rounded-lg px-4 py-2 h-12"
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
        {selectedValues.length > 0 ? (
          selectedValues.join(", ") // Show selected values as a comma-separated string
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
        <ul className="absolute top-full left-0 w-full mt-1 text-right bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <li
              key={index}
              className={`px-4 py-2 cursor-pointer relative mr-2 hover:bg-gray-100 border-b border-gray-200 last:border-none ${
                selectedValues.includes(option) ? "bg-blue-100 font-bold" : ""
              }`}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelectInput;
