import React from "react";
import Image from "next/image";

interface ContactItemProps {
  icon: React.ReactElement<typeof Image>;
  title: string;
  description: string[];
  contactInfo: string;
}

const ContactItem: React.FC<ContactItemProps> = ({
  icon,
  title,
  description,
  contactInfo,
}) => {
  return (
    <div className="text-center flex flex-col items-center w-full max-w-[286px] px-4">
      <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-heading-5-desktop md:text-heading-4-desktop font-extraBold leading-8 md:leading-10 text-subtext mt-4 md:mt-6">
        {title}
      </h3>
      <p className="text-text-regular md:text-text-large text-subtext leading-6 md:leading-8">
        {description[0]}
      </p>
      <p className="text-text-regular md:text-text-large text-subtext leading-6 md:leading-8">
        {description[1]}
      </p>
      <p className="text-text-regular md:text-text-large font-light text-subtext leading-6 md:leading-8 mt-4 md:mt-6">
        {contactInfo}
      </p>
    </div>
  );
};

export default ContactItem;
