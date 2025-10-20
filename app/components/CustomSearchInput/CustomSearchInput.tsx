"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface CustomSearchInputProps {
  type?: string;
  width?: string;
  id: string;
  placeholder?: string;
  image?: React.ReactElement<typeof Image>;
  className?: string;
  required?: boolean;
  pattern?: string;
  placeholderColor?: string; // New prop for placeholder color
  onEnter?: (value: string) => void;
  suggestions?: string[]; // נוסיף אפשרות לקבלת רשימת הצעות
  value?: string; // Add this
}

const CustomSearchInput: React.FC<CustomSearchInputProps> = ({
  type = "text",
  id,
  width = "sm:w-[500px]",
  placeholder = "",
  image,
  className = "",
  required = false,
  pattern = ".*",
  onEnter,
  suggestions = [],
  value,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync internal state with external value prop
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // עדכון טקסט וסינון הצעות
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim() === "") {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // סינון הצעות שמתאימות למה שהמשתמש מקליד
    const filtered = suggestions
      .filter((s): s is string => typeof s === "string" && !!s)
      .filter((s) => s.includes(value.trim()));

    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // בחירת הצעה
  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    if (onEnter) {
      onEnter(suggestion); // חיפוש מיידי
    }
  };

  // ביצוע חיפוש בלחיצה על Enter או על האייקון
  const triggerSearch = () => {
    if (inputValue.trim() !== "") {
      onEnter?.(inputValue);
    }
  };

  return (
    <div className={`${className} relative ${width}`}>
      {/* Search Icon (Clickable) */}
      {image && (
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={triggerSearch}
        >
          {image}
        </div>
      )}

      {/* Input Field */}
      <input
        type={type}
        id={id}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        value={value !== undefined ? value : inputValue}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoCapitalize="none"
        name="ignore"
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
        className="w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 sm:text-text-medium text-text-small rtl focus:outline-none focus:ring-0 focus:border-gray-300"
      />

      {/* Suggestions List */}
      {showSuggestions && (
        <ul className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2 text-right cursor-pointer hover:bg-gray-100"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSearchInput;
