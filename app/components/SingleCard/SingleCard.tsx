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
  seatLocation: string;
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
  seatLocation,
  price,
  soldOut,
  timeLeft,
  buttonAction,
}) => {
  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  return (
    <div className="flex items-center justify-between sm:border-b-4 border-b-2 border-highlight sm:pt-4 sm:pr-12 sm:pb-4 sm:pl-8 sm:gap-14 xs:pt-2 xs:pr-4 xs:pb-2 xs:pl-4 pt-2 pr-1 pb-2 pl-1 gap-2 shadow-large w-[300px] xs:w-[400px] sm:w-auto sm:h-[128px] xs:h-[100px] h-[85px] bg-white select-none transition-transform duration-700  hover:scale-[1.01] cursor-pointer">
      {/* Date Section */}
      <div className="flex flex-col items-center">
        <span className="sm:text-text-large xs:text-text-small text-text-extra-small sm:leading-[30px] mt-2 font-normal text-strongText">
          חמישי
        </span>
        <span className="sm:text-heading-3-desktop xs:text-heading-5-desktop text-heading-6-mobile  font-bold text-strongText sm:leading-[40px]">
          15
        </span>
        <span className="sm:text-text-large xs:text-text-small text-text-extra-small sm:leading-[30px]  font-normal text-strongText">
          אוק׳
        </span>
      </div>
      {/* Divider */}
      <div className="sm:w-[3px] sm:h-24 w-[2px] h-[56px] bg-strongText"></div>
      {/* Event Title Section */}
      <div className="text-center mt-1 whitespace-nowrap truncate sm:max-w-[250px] xs:max-w-[90px] max-w-[60px]">
        <div className="flex items-center justify-center sm:w-[250px] w-[90px]">
          {tag && (
            <span className="flex justify-center items-center bg-highlight mt-2 w-14 h-6 text-white text-text-extra-small leading-[18px] font-semibold text-center">
              {tag}
            </span>
          )}
        </div>
        <span className="sm:text-heading-3-desktop xs:text-heading-6-desktop text-text-small font-bold text-strongText ">
          {title}
        </span>

        {timeLeft && (
          <div className="flex sm:flex-nowrap flex-wrap items-center justify-center text-weakTextBluish sm:text-text-medium xs:text-text-extra-small text-text-extra-small sm:mt-2">
            <span className="ml-2">זמן לאירוע</span>

            <span>{timeLeft}</span>
            <Image
              src={TimeLeftIcon}
              alt="Time Left"
              className="sm:h-[19px] sm:w-[17px] h-[19px] w-[17px] mr-1"
            />
          </div>
        )}
      </div>
      <div className="sm:w-[3px] sm:h-24 w-[1.5px] h-[56px] bg-weakText"></div>{" "}
      {/* Divider */}
      {/* Location Section */}
      <div className="text-center mt-2 sm:text-heading-5-desktop xs:text-text-regular text-text-small  font-bold text-weakTextBluish sm:w-[250px] w-[90px]">
        <span>{seatLocation}</span>
      </div>
      {/* Divider */}
      <div className="sm:w-[3px] sm:h-24 h-[56px] w-[1.5px] bg-weakText"></div>
      {/* Price Section */}
      <div className="flex sm:flex-row flex-col h-[50px] items-center text-center sm:mt-0 mt-3 sm:gap-4 gap-0">
        <span className="text-strongText sm:text-heading-4-desktop text-heading-6-mobile font-extraBold sm:leading-10">
          ₪{price}
        </span>
        {priceBefore && (
          <span className="text-weakTextBluish font-bold sm:text-text-large text-text-small line-through sm:leading-7">
            ₪{priceBefore}
          </span>
        )}
        <Image
          src={PriceIcon}
          alt="Price icon"
          className="sm:h-[40px] sm:w-[21px] h-[30px] w-[12px] hidden sm:block"
        />
      </div>
      {/* Action Button */}
      <Link href="/EventPage">
        <button className="btn sm:mt-0 mt-4 btn-primary min-h-0 sm:w-[78px] sm:h-[46px] xs:h-9 xs:w-[50px] h-7 w-[40px] text-white sm:text-text-large xs:text-text-small text-text-extra-small  font-normal">
          {buttonAction}
        </button>
      </Link>
    </div>
  );
};

export default SingleCard;
