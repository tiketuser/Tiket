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
    <div className="text-center flex flex-col items-center w-full sm:max-w-[286px] px-1 sm:px-4">
      <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center [&>img]:w-10 [&>img]:h-10 sm:[&>img]:w-16 sm:[&>img]:h-16 md:[&>img]:w-20 md:[&>img]:h-20">
        {icon}
      </div>
      <h3 className="text-xs sm:text-heading-5-desktop md:text-heading-4-desktop font-extraBold leading-5 sm:leading-8 md:leading-10 text-subtext mt-2 sm:mt-4 md:mt-6">
        {title}
      </h3>
      <p className="hidden sm:block text-text-regular md:text-text-large text-subtext leading-6 md:leading-8">
        {description[0]}
      </p>
      <p className="hidden sm:block text-text-regular md:text-text-large text-subtext leading-6 md:leading-8">
        {description[1]}
      </p>
      <p className="text-xs sm:text-text-regular md:text-text-large font-light text-subtext leading-5 sm:leading-6 md:leading-8 mt-1 sm:mt-4 md:mt-6">
        {contactInfo}
      </p>
    </div>
  );
};

export default ContactItem;
