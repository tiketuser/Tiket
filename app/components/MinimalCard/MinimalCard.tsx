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
  date,
  seatLocation,
  priceBefore,
  price,
  width = "w-auto"
}) => {
  return (
    <div className={'flex items-center justify-between md:pt-4 md:pr-12 pr-3 md:pl-8 pl-5 md:pb-4 md:gap-14 gap-2 md:h-[128px] h-[68px] bg-white ' + width}>
      {/* Date Section */}
      <div className="flex flex-col items-center">
        <span className="md:text-text-large text-text-small leading-[30px] font-normal text-strongText">
          חמישי
        </span>
        <span className="md:text-heading-3-desktop text-text-regular font-bold text-strongText md:leading-[40px] leading-[3px]">
          15
        </span>
        <span className="md:text-text-large text-text-small leading-[30px]  font-normal text-strongText">
          אוק׳
        </span>
      </div>
      <div className="md:w-[3px] w-[2px] h-5/6 bg-strongText"></div> {/* Divider */}
      {/* Event Title Section */}
      <div className="text-center whitespace-nowrap truncate md:w-[180px] w-[80px]">
        <span className="md:text-heading-3-desktop text-text-small font-bold text-strongText">
          {title}
        </span>
      </div>
      <div className="md:w-[3px] w-[2px] h-5/6 bg-weakText"></div> {/* Divider */}
      {/* Location Section */}
      <div className="text-center md:text-heading-6-desktop text-text-small font-bold text-weakTextBluish md:w-[200px]">
        <span>{seatLocation}</span>
      </div>
      <div className="md:w-[3px] w-[2px] h-5/6 bg-weakText"></div> {/* Divider */}
      {/* Price Section */}
      <div className="flex items-center text-center md:gap-4 gap-2">
        <span className="text-strongText md:text-heading-4-desktop text-text-regular font-extraBold leading-10">
          ₪{price}
        </span>
        {priceBefore && (
          <span className="text-weakTextBluish md:text-text-large text-text-extra-small line-through leading-7">
            ₪{priceBefore}
          </span>
        )}
        <Image src={PriceIcon} alt="Price icon" className="md:h-[40px] h-[27px] md:w-[21px] w-[15px]" />
      </div>
    </div>
  );
};

export default MinimalCard;
