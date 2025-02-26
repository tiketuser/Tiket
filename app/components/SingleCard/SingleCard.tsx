import React from "react";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import TimeLeftIcon from "../../../public/images/Home Page/Web/TimeLeft.svg";
import Image from "next/image";
import Link from "next/link";
import CheckoutDialog from "../Dialogs/CheckoutDialog/CheckoutDialog";
import { useState } from "react";

interface SingleCardProps {
  imageSrc?: string;
  title: string;
  date: string;
  location: string;
  priceBefore?: number;
  price: number;
  soldOut?: boolean;
  tag?: string;
  ticketsLeft?: number;
  timeLeft?: string;
  buttonAction: string;
}

const SingleCard: React.FC<SingleCardProps> = ({
  title,
  date,
  tag,
  location,
  ticketsLeft,
  priceBefore,
  price,
  soldOut,
  timeLeft,
  buttonAction,
}) => {
  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  return (
    <div className="flex items-center justify-between border-b-4 border-highlight pt-4 pr-12 pb-4 pl-8 gap-14 shadow-large w-auto h-[128px] bg-white select-none transition-transform duration-700  hover:scale-[1.01] cursor-pointer">
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
      <div className="text-center whitespace-nowrap truncate max-w-[200px]">
        <div className="flex items-center justify-center w-[200px]">
          {tag && (
            <span className="flex justify-center items-center bg-highlight bg-opacity-80 w-14 h-6 text-white text-text-extra-small leading-[18px] font-semibold text-center">
              {tag}
            </span>
          )}
        </div>
        <span className="text-heading-3-desktop font-bold text-strongText ">
          {title}
        </span>

        {timeLeft && (
          <div className="flex items-center justify-center text-weakTextBluish text-text-medium mt-2">
            <span className="ml-2">זמן לאירוע</span>
            <Image
              src={TimeLeftIcon}
              alt="Time Left"
              className="h-[19px] w-[17px] ml-1"
            />
            <span>{timeLeft}</span>
          </div>
        )}
      </div>
      <div className="w-[3px] h-24 bg-weakText"></div> {/* Divider */}
      {/* Location Section */}
      <div className="text-center text-heading-6-desktop font-bold text-weakTextBluish w-[200px]">
        <span>{location}</span>
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
      {/* Action Button */}

        <button className="btn btn-primary w-auto h-11 text-white text-text-large font-normal"
                onClick={() => setCheckoutDialogOpen(true)}>
          {buttonAction}
        </button>

      <CheckoutDialog isOpen={isCheckoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)} isUserConnected={false}/>
    </div>
  );
};

export default SingleCard;
