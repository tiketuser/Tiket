"use client";

import Image from "next/image";
import { useState } from "react";

interface CustomInputProps {
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
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = "text",
  id,
  width = "w-[500px]",
  placeholder = "",
  image,
  className = "",
  required = false,
  pattern = ".*",
  placeholderColor = "text-gray-500", // Default placeholder color
  onEnter,
  suggestions = [],
}) => {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    const filtered = suggestions.filter((s) => s.includes(value.trim()));

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
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {image && image}
      </div>
      <input
        type={type}
        id={id}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        className={`w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 sm:text-text-medium text-text-small rtl focus:outline-none focus:ring-0 focus:border-gray-300`}
      />
    </div>
  );
};

export default CustomInput;
