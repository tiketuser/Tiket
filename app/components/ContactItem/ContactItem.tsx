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
    <div className="text-center flex flex-col items-center max-w-[286px]">
      {icon}
      <h3 className="text-heading-4-desktop font-extraBold leading-10d text-subtext">
        {title}
      </h3>
      <p className="text-text-large text-subtext leading-8">{description[0]}</p>
      <p className="text-text-large text-subtext leading-8">{description[1]}</p>
      <p className="text-text-large font-light text-subtext leading-8 mt-6">
        {contactInfo}
      </p>
    </div>
  );
};

export default ContactItem;
