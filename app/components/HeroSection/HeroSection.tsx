"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy-load dialogs - UploadTicketDialog is 702 lines, only needed on button click
const UploadTicketDialog = dynamic(
  () => import("../Dialogs/UploadTicketDialog/UploadTicketDialog"),
  { ssr: false },
);
import {
  ThemedGuitarThing,
  ThemedSecondaryHalfCircle,
  ThemedEclipse,
} from "./ThemedSVGs";

import ButtonStar from "../../../public/images/Home Page/Web/Buttom Star.svg";

const HeroSection = () => {
  const router = useRouter();
  const [isUploadTicketDialogOpen, setUploadTicketDialogOpen] = useState(false);

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
            <button
              className="btn btn-primary text-heading-5-desktop w-[100px] h-[50px] sm:w-28 sm:h-16 text-gray-50 font-regular sm:text-heading-4-desktop scale-[0.87] sm:scale-90 md:scale-95 lg:scale-100 "
              onClick={() => {
                router.push("/ViewMore");
              }}
            >
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

        <ThemedSecondaryHalfCircle className="absolute bottom-0 z-[-1] -left-6 lg:w-[240px] lg:h-[240px] md:w-[180px] md:h-[180px] sm:w-[140px] sm:h-[140px] h-[80px] w-[80px]" />

        <ThemedGuitarThing className="absolute bottom-4 left-4 sm:left-8 md:left-12 lg:left-16 z-[-1] lg:w-[148px] lg:h-[180px] md:w-[118px] md:h-[150px] sm:w-[108px] sm:h-[140px] h-[59.23px] w-[50.35px]" />

        <ThemedEclipse className="absolute top-0 right-0 z-0 h-[70px] w-[70px] sm:h-[150px] sm:w-[150px]" />

        <Image
          src={ButtonStar}
          alt="bottom star"
          className="absolute right-2 xs:right-4 top-20 sm:top-[178px] sm:right-[70px] z-0 h-[10.62px] w-[9.91px] sm:h-[16.53px] sm:w-[14.42px]"
        />

        <Image
          src={ButtonStar}
          alt="top star"
          className="absolute top-7 right-[87px] sm:top-14 sm:right-[133px] z-0 h-[7.62px] w-[6.91px] sm:h-[13.53px] sm:w-[11.42px]"
        />
      </div>

      <UploadTicketDialog
        isOpen={isUploadTicketDialogOpen}
        onClose={() => setUploadTicketDialogOpen(false)}
      />
    </>
  );
};

export default HeroSection;
