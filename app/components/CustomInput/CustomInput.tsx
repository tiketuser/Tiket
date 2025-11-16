import Image from "next/image";
import React from "react";

interface CustomInputProps {
  type?: string;
  width?: string;
  id: string;
  name: string; // <-- Add name prop for form data
  placeholder?: string;
  image?: React.ReactElement<typeof Image>;
  className?: string;
  required?: boolean;
  pattern?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean; // Add error prop for validation styling
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = "text",
  id,
  name, // <-- Destructure name
  width = "w-[500px]",
  placeholder = "",
  image,
  className = "",
  required = false,
  pattern = ".*",
  value,
  onChange,
  error = false,
}) => {
  return (
    <div className={`${className} relative ${width}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {image && image}
      </div>
      <input
        type={type}
        id={id}
        name={name} // <-- Add name attribute for form submission
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        value={value}
        onChange={onChange}
        className={`w-full py-3 pl-12 pr-4 rounded-lg border ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-300 focus:border-gray-300"
        } text-xs sm:text-text-medium rtl focus:outline-none focus:ring-0 placeholder:text-xs placeholder:sm:text-text-medium`}
      />
    </div>
  );
};

export default CustomInput;
