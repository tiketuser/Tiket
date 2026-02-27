"use client";

import React from "react";
import { applyTheme } from "../../theme/categoryThemes";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const categories = [
    { label: "מוזיקה", value: "מוזיקה" },
    { label: "סטנדאפ", value: "סטנדאפ" },
    { label: "תיאטרון", value: "תיאטרון" },
    { label: "ספורט", value: "ספורט" },
    { label: "ילדים", value: "ילדים" },
  ];

  const handleCategoryClick = (categoryValue: string) => {
    const newCategory =
      selectedCategory === categoryValue ? null : categoryValue;
    onCategoryChange(newCategory);
    applyTheme(newCategory);
  };

  return (
    <div className="flex gap-2 xs:gap-2 sm:gap-3 flex-nowrap overflow-x-auto whitespace-nowrap min-w-0 justify-start sm:justify-center px-0.5 xs:px-1 sm:px-4 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => handleCategoryClick(category.value)}
          className={`px-2 xs:px-4 sm:px-8 py-1.5 xs:py-2 sm:py-3 rounded-btn text-sm xs:text-sm font-medium transition-all  ${
            selectedCategory === category.value
              ? "bg-primary text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-300 hover:border-primary hover:text-primary"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
