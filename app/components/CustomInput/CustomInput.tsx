import Image from 'next/image';
import React from 'react';

interface CustomInputProps {
  type?: string;
  width?: string;
  id: string;
  placeholder?: string;
  image?: React.ReactElement<typeof Image>;
  className?: string;
  required?: boolean;
  pattern?: string
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = 'text',
  id,
  width = '500px',
  placeholder = '',
  image,
  className = '',
  required = false,
  pattern = '.*'
}
) => {
  return (
    <div 
      className={className}>
        <input
          type={type}
          id={id}
          required={required}
          placeholder={placeholder}
          style={{width}}
          pattern={pattern}
          className="py-3 pl-12 pr-4 rounded-lg border border-gray-300 sm:text-text-medium text-text-small rtl focus:outline-none focus:ring-0 focus:border-gray-300"
        />
        <div className="relative translate-x-10">
          {image && image}
        </div>
    </div>
  );
};

export default CustomInput;