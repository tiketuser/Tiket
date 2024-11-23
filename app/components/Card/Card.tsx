// components/Card.tsx
import React from "react";
import TicketIcon from "../../../public/images/Home Page/Web/Ticket Icon.svg";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import TimeLeftIcon from "../../../public/images/Home Page/Web/TimeLeft.svg";
import HeartIcon from "../../../public/images/Home Page/Web/Favorite Tag.svg";
import Image from "next/image";
interface CardProps {
  imageSrc: string;
  title: string;
  date: string;
  location: string;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

const Card: React.FC<CardProps> = ({
  imageSrc,
  title,
  date,
  location,
  ticketsLeft,
  priceBefore,
  price,
  soldOut,
  timeLeft,
}) => {
  return (
    <div className="relative mr-48 w-[392px] h-[568px] border-b-[3px] border-highlight p-[16px] pt-[16px] pr-[32px] pb-[32px] pl-[32px] gap-[24px] shadow-xlarge">
      {/* Last Chance */}
      {soldOut && (
        <div className="absolute top-0 left-0 bg-red-600 text-white text-xs p-1 rounded-tr-lg rounded-bl-lg">
          Sold Out Show
        </div>
      )}
      {/* Aartist Image */}
      <Image
        width={300}
        height={300}
        src={imageSrc}
        alt={title}
        className="w-full h-[264px] mb-4 object-cover"
      />
      {/* Heart Icon */}
      <div className="absolute top-4 right-8 btn btn-ghost btn-circle hover:transition-transform hover:duration-300 hover:scale-125">
        <Image src={HeartIcon} alt="Heart Icon" />
      </div>
      {/* Title and show details section */}
      <div className="grid pt-6 pb-2 gap-3">
        <div className="flex items-center gap-12">
          <span className="text-heading-3-mobile font-extrabold gap-[10px] whitespace-nowrap truncate max-w-[280px]">
            {title}
          </span>
          <span className="relative bg-strongText flex-grow h-[3px] rounded-lg"></span>
        </div>
        <div className="grid gap-1">
          <p className="text-heading-6-desktop font-bold text-mutedText">
            {date}
          </p>
          <p className="text-heading-6-desktop font-bold text-mutedText">
            {location}
          </p>

          <p className="flex items-center text-text-regular font-light text-strongText">
            <span className="ml-4">כרטיסים זמינים</span>
            <Image src={TicketIcon} alt="heart icon" className="h-4 w-4 ml-1" />
            <span>{ticketsLeft} </span>
          </p>
        </div>
        {/* Price and time section */}
        <div
          dir="ltr"
          className="flex items-center space-x-4 rtl:space-x-reverse "
        >
          <Image
            src={PriceIcon}
            alt="Price icon"
            className="h-[42px]] w-[21px]"
          />
          <span className="text-heading-5-mobile font-bold text-mutedText line-through">
            {priceBefore}
          </span>
          <span className="text-heading-4-desktop font-semibold text-strongText text-center">
            {price} ₪
          </span>
        </div>
        <div dir="ltr" className="flex items-center gap-2 mt-[-12px]">
          <Image
            src={TimeLeftIcon}
            alt="heart icon"
            className="h-[15px] w-[15px]"
          />
          <span className="text-text-regular font-light text-strongText text-center">
            {timeLeft}
          </span>
          <span className="text-text-regular font-light text-strongText text-center">
            זמן לאירוע
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;
