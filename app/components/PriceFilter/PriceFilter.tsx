import * as Slider from "@radix-ui/react-slider";
import React from "react";

interface PriceFilterProps {
  min?: number; // Minimum value of the slider
  max?: number; // Maximum value of the slider
  step?: number; // Step size
  defaultValue?: number[]; // Default values for the thumbs
  onValueChange?: (value: number[]) => void; // Callback for value changes
  className?: string; // Additional CSS classes
}

const PriceFilter: React.FC<PriceFilterProps> = ({
  min = 0,
  max = 1000,
  step = 1,
  defaultValue = [200, 800],
  onValueChange,
  className = "",
}) => {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <Slider.Root
        className="relative flex items-center w-full h-8"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        {/* Slider Track */}
        <Slider.Track className="relative w-full h-2 bg-gray-300 rounded-full">
          <Slider.Range className="absolute h-full bg-red-500 rounded-full" />
        </Slider.Track>

        {/* Thumbs */}
        {defaultValue.map((_, index) => (
          <Slider.Thumb
            key={index}
            className="block w-5 h-5 bg-white border-2 border-red-500 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        ))}
      </Slider.Root>

      {/* Labels */}
      <div className="flex justify-between w-full mt-2">
        {[...defaultValue].reverse().map((value, index) => (
          <div
            key={index}
            className="relative px-2 py-1 bg-white border rounded-md shadow-md text-sm text-gray-700"
          >
            ₪{value}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border border-gray-300 rotate-45"
              style={{ marginTop: "-5px" }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceFilter;
