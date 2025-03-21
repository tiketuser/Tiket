"use client";

import { useState } from "react";
import Image from "next/image";

import UploadTicketDialog from "../Dialogs/UploadTicketDialog/UploadTicketDialog";
import CheckoutDialog from "../Dialogs/CheckoutDialog/CheckoutDialog";

import SecondaryHalfCircle from "../../../public/images/Home Page/Web/Secondary Half Circle.svg";
import Eclipse from "../../../public/images/Home Page/Web/Ellipse 13.svg";
import ButtonStar from "../../../public/images/Home Page/Web/Buttom Star.svg";
import GuitarThing from "../../../public/images/Home Page/Web/Guitar Thing.svg";

const HeroSection = () => {
  const [isUploadTicketDialogOpen, setUploadTicketDialogOpen] = useState(false);
  const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  return (
    <>
      <div className="select-none h-[300px] sm:h-[400px] md:h-80 lg:h-72 relative bg-white mx-auto w-full shadow-xsmall-inner z-30 flex justify-center items-center overflow-x-hidden">
        <div
          className="flex flex-col justify-center text-center z-30 "
          dir="rtl"
        >
          <h1 className="text-subtext text-heading-2-mobile sm:text-heading-1-desktop font-extrabold z-30">
            <span className="lg:inline block">הופעה סולד-אאוט? / </span>
            <span>לא יכולים להגיע?</span>
          </h1>
          <p className="text-subtext leading-[27px] text-text-small font-light mb-5 sm:text-text-large sm:mb-8 ">
            הזדמנות נוספת לכרטיסים - קנו ומכרו בקלות ובאופן מאובטח.
          </p>

          <div className="flex justify-center gap-4 sm:gap-8 md:gap-9 lg:gap-10">
            <button className="btn btn-primary text-heading-5-desktop w-[100px] h-[50px] sm:w-28 sm:h-16 text-gray-50 font-regular sm:text-heading-4-desktop scale-[0.87] sm:scale-90 md:scale-95 lg:scale-100 "
              onClick={() => setCheckoutDialogOpen(true)}>
              קנה
            </button>
            <button
              className="btn btn-secondary border-primary border-[2px] bg-white text-primary  text-heading-5-desktop w-[107px] h-[50px] sm:w-28 sm:h-16 font-regular sm:text-heading-4-desktop scale-[0.87] sm:scale-90 md:scale-95 lg:scale-100 "
              onClick={() => setUploadTicketDialogOpen(true)}
            >
              מכור
            </button>
          </div>
        </div>

        <Image
          src={SecondaryHalfCircle}
          alt="SecondaryHalfCircle"
          className="absolute bottom-0 z-[-1] -left-6 lg:w-[240px] lg:h-[240px] md:w-[180px] md:h-[180px] sm:w-[140px] sm:h-[140px] h-[80px] w-[80px]"
        />

        <Image
          src={GuitarThing}
          alt="GuitarThing"
          className="absolute bottom-4 left-4 sm:left-8 md:left-12 lg:left-16 z-[-1] lg:w-[148px] lg:h-[180px] md:w-[118px] md:h-[150px] sm:w-[108px] sm:h-[140px] h-[59.23px] w-[50.35px]"
        />

        <Image
          src={Eclipse}
          alt="Eclipse"
          className="absolute top-0 right-0 z-0 h-[70px] w-[70px] sm:h-[100px] sm:w-[100px]"
        />

        <Image
          src={ButtonStar}
          alt="bottom star"
          className="absolute right-4 top-20 sm:top-[178px] sm:right-[70px] z-0 h-[10.62px] w-[9.91px] sm:h-[16.53px] sm:w-[14.42px]"
        />

        <Image
          src={ButtonStar}
          alt="top star"
          className="absolute top-7 right-[87px] sm:top-14 sm:right-[133px] z-0 h-[7.62px] w-[6.91px] sm:h-[13.53px] sm:w-[11.42px]"
        />
      </div>

      <UploadTicketDialog isOpen={isUploadTicketDialogOpen} onClose={() => setUploadTicketDialogOpen(false)}/>
      <CheckoutDialog isUserConnected={false} isOpen={isCheckoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)}/>
    </>
  );
};

export default HeroSection;
