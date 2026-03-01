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
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm py-2 sm:py-3 -mx-4 sm:-mx-10 px-4 sm:px-10">
      <div className="flex gap-2 sm:gap-3 flex-nowrap overflow-x-auto whitespace-nowrap justify-start sm:justify-center scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => handleCategoryClick(category.value)}
            className={`px-4 sm:px-10 py-1.5 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-colors duration-150 shrink-0 ${
              selectedCategory === category.value
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
