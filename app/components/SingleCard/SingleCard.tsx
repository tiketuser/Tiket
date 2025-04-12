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
  seatLocation?: string;
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
        <span className="sm:text-text-large xs:text-text-extra-small text-[10px] sm:leading-[30px] mt-2 font-normal text-strongText">
          חמישי
        </span>
        <span className="sm:text-heading-3-desktop xs:text-heading-6-desktop text-text-regular  font-bold text-strongText sm:leading-[40px]">
          15
        </span>
        <span className="sm:text-text-large xs:text-text-extra-small text-[10px] sm:leading-[30px]  font-normal text-strongText">
          אוק׳
        </span>
      </div>
      {/* Divider */}
      <div className="sm:w-[3px] sm:h-24 w-[2px] h-[56px] bg-strongText"></div>
      {/* Event Title Section */}
      <div className="text-center mt-1 whitespace-nowrap truncate sm:max-w-[250px] xs:max-w-[200px] max-w-[200px] sm:w-[300px] xs:w-[150px] w-[180px]">
        {tag && (
          <div className="flex items-center justify-center sm:w-[250px] xs:w-[60px] w-[50px]">
            <span className="flex justify-center items-center bg-highlight mt-2 sm:w-14 sm:h-6 xs:w-12 w-10 text-white sm:text-text-extra-small xs:text-[10px] text-[8px] leading-[18px] font-semibold text-center">
              {tag}
            </span>
          </div>
        )}
        <span className="sm:text-heading-3-desktop xs:text-text-small text-[10px] font-bold text-strongText ">
          {title}
        </span>

        {timeLeft && (
          <div className="flex sm:flex-nowrap items-center justify-center text-weakTextBluish sm:text-text-medium xs:text-[8px] text-[6px] sm:mt-2">
            <span className="sm:ml-2 ml-1">זמן לאירוע</span>
            <Image
              src={TimeLeftIcon}
              alt="Time Left"
              className="sm:h-[19px] sm:w-[17px] h-[6px] xs:w-[7px] xs:h-[7px] w-[17px] sm:ml-2"
            />
            <span>{timeLeft}</span>
          </div>
        )}
      </div>
      <div className="sm:w-[3px] sm:h-24 w-[1.5px] h-[56px] bg-weakText"></div>{" "}
      {/* Divider */}
      {/* Location Section */}
      <div className="text-center mt-2 sm:text-heading-5-desktop xs:text-text-extra-small text-[8px] font-bold text-weakTextBluish sm:w-[250px] xs:w-[150px] w-[150px] ">
        <span>{seatLocation || location}</span>
      </div>
      {/* Divider */}
      <div className="sm:w-[3px] sm:h-24 h-[56px] w-[1.5px] bg-weakText"></div>
      {/* Price Section */}
      <div className="flex sm:flex-row flex-col h-[50px] items-center text-center sm:mt-0 mt-3 sm:gap-4 gap-0 w-[130px] xs:w-[150px]">
        <span className="text-strongText xs:mt-2 mt-4 xs:mr-2 mr-1 sm:text-heading-4-desktop xs:text-heading-6-mobile text-text-extra-small font-extraBold sm:leading-10">
          ₪ {price}
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
        <button
          className="btn mt-4 mr-2 rounded-md btn-primary min-h-0 sm:w-auto sm:h-auto xs:h-auto xs:w-[90px] w-[75px] h-auto xs:py-2 py-2 text-white sm:text-text-large xs:text-[10px] text-[8px] font-normal"
          onClick={() => setCheckoutDialogOpen(true)}
        >
          {buttonAction}
        </button>

        <CheckoutDialog
          isOpen={isCheckoutDialogOpen}
          onClose={() => setCheckoutDialogOpen(false)}
          isUserConnected={false}
        />
      </Link>
    </div>
  );
};

export default SingleCard;
