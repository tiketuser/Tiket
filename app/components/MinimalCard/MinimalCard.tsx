import React from "react";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import Image from "next/image";

interface MinimalCardProps {
  title: string;
  date: string;
  seatLocation: string;
  priceBefore?: number;
  price: number;
  width?: string;
}

const MinimalCard: React.FC<MinimalCardProps> = ({
  title,
  // date,
  seatLocation,
  priceBefore,
  price,
  width = "w-auto"
}) => {
  return (
    <div className={`bg-white ${width}`}>
      {/* Desktop Layout (hidden on mobile) */}
      <div className="hidden sm:flex items-center justify-between pt-4 pr-12 pb-4 pl-8 gap-14 h-[128px]">
        {/* Date Section */}
        <div className="flex flex-col items-center">
          <span className="text-text-large leading-[30px] font-normal text-strongText">
            חמישי
          </span>
          <span className="text-heading-3-desktop font-bold text-strongText leading-[40px]">
            15
          </span>
          <span className="text-text-large leading-[30px]  font-normal text-strongText">
            אוק׳
          </span>
        </div>
        <div className="w-[3px] h-24 bg-strongText"></div> {/* Divider */}
        {/* Event Title Section */}
        <div className="text-center whitespace-nowrap truncate w-[180px]">
          <span className="text-heading-3-desktop font-bold text-strongText">
            {title}
          </span>
        </div>
        <div className="w-[3px] h-24 bg-weakText"></div> {/* Divider */}
        {/* Location Section */}
        <div className="text-center text-heading-6-desktop font-bold text-weakTextBluish w-[200px]">
          <span>{seatLocation}</span>
        </div>
        <div className="w-[3px] h-24 bg-weakText"></div> {/* Divider */}
        {/* Price Section */}
        <div className="flex items-center text-center gap-4">
          <span className="text-strongText text-heading-4-desktop font-extraBold leading-10">
            ₪{price}
          </span>
          {priceBefore && (
            <span className="text-weakTextBluish font-bold text-text-large line-through leading-7">
              ₪{priceBefore}
            </span>
          )}
          <Image src={PriceIcon} alt="Price icon" className="h-[40px] w-[21px]" />
        </div>
      </div>
      
      {/* Mobile Layout (visible only on mobile) */}
      <div className="sm:hidden p-4 space-y-3">
        {/* Title and Date Row */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-strongText truncate flex-1 ml-2">
            {title}
          </h3>
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-normal text-strongText">חמישי</span>
            <span className="text-xl font-bold text-strongText">15</span>
            <span className="text-xs font-normal text-strongText">אוק׳</span>
          </div>
        </div>
        
        {/* Location Row */}
        <div className="text-sm font-bold text-weakTextBluish">
          {seatLocation}
        </div>
        
        {/* Price Row */}
        <div className="flex items-center gap-3">
          <span className="text-strongText text-xl font-extrabold">
            ₪{price}
          </span>
          {priceBefore && (
            <span className="text-weakTextBluish font-bold text-sm line-through">
              ₪{priceBefore}
            </span>
          )}
          <Image src={PriceIcon} alt="Price icon" className="h-[24px] w-[12px]" />
        </div>
      </div>
    </div>
  );
};

export default MinimalCard;
