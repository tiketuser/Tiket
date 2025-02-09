import Image from "next/image";
import React from "react";

interface CustomInputProps {
  type?: string;
  width?: string;
  id: string;
  placeholder?: string;
  image?: React.ReactElement<typeof Image>;
  className?: string;
  required?: boolean;
  pattern?: string
  placeholderColor?: string; // New prop for placeholder color
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = "text",
  id,
  width = 'w-[500px]',
  placeholder = '',
  image,
  className = '',
  required = false,
  pattern = '.*',
  placeholderColor = "text-gray-500", // Default placeholder color
}) => {
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
