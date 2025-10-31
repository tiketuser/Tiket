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
    <div className="flex gap-3 flex-wrap justify-center px-4">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => handleCategoryClick(category.value)}
          className={`px-8 py-3 rounded-btn text-sm font-medium transition-all ${
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
