import Image from 'next/image';
import React from 'react';

interface CustomInputProps {
  type?: string;
  placeholder: string;
  image?: React.ReactElement<typeof Image>;
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = 'text',
  placeholder,
  image
}
) => {
  return (
    <div className="flex justify-center items-center pt-9 sm:mx-0 mx-16">
      <div className="relative w-full max-w-md">
        <input
          type={type}
          placeholder={placeholder}
          className="w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 sm:text-text-medium text-text-small rtl focus:outline-none focus:ring-0 focus:border-gray-300"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {image && image}
        </div>
      </div>
    </div>
  );
};

export default CustomInput;