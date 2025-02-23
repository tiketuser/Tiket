import React from "react";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import Image from "next/image";

interface MinimalCardProps {
  title: string;
  date: string;
  seatLocation: string;
  priceBefore?: number;
  price: number;
}

const MinimalCard: React.FC<MinimalCardProps> = ({
  title,
  date,
  seatLocation,
  priceBefore,
  price,
}) => {
  return (
    <div className="flex items-center justify-between border-b-4 border-highlight pt-4 pr-12 pb-4 pl-8 gap-14 shadow-large w-auto h-[128px] bg-white">
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
  );
};

export default MinimalCard;
