import React from "react";
import Image from "next/image";

import SecondaryHalfCircle from "../../../public/images/Home Page/Web/Secondary Half Circle.svg";
import Eclipse from "../../../public/images/Home Page/Web/Ellipse 13.svg";
import ButtonStar from "../../../public/images/Home Page/Web/Buttom Star.svg";
import GuitarThing from "../../../public/images/Home Page/Web/Guitar Thing.svg";

const HeroSection = () => {
  return (
    <div className="h-[400px] sm:h-[400px] md:h-80 lg:h-72 relative bg-white mx-auto w-full shadow-xsmall-inner z-30 flex justify-center items-center overflow-x-hidden">
      <div className="flex flex-col justify-center text-center z-30 " dir="rtl">
        <h1 className="text-subtext text-heading-2-mobile sm:text-heading-1-desktop font-extrabold z-30">
          <span className="lg:inline block">הופעה סולד-אאוט? / </span>
          <span>לא יכולים להגיע?</span>
        </h1>
        <p className="text-subtext text-text-small font-light mb-5 sm:text-text-large sm:mb-8 ">
          הזדמנות נוספת לכרטיסים - קנו ומכרו בקלות ובאופן מאובטח.
        </p>

        <div className="flex justify-center gap-8 md:gap-9 lg:gap-10">
          <button className="btn btn-primary text-heading-5-desktop w-[100px] h-[50px] sm:w-28 sm:h-16 text-gray-50 font-regular sm:text-heading-4-desktop sm:scale-90 md:scale-95 lg:scale-100 ">
            קנה
          </button>
          <button className="btn btn-secondary border-primary border-[2px] bg-white text-primary  text-heading-5-desktop w-[107px] h-[50px] sm:w-28 sm:h-16 font-regular sm:text-heading-4-desktop sm:scale-90 md:scale-95 lg:scale-100 ">
            מכור
          </button>
        </div>
      </div>

      <Image
        src={SecondaryHalfCircle}
        alt="SecondaryHalfCircle"
        className="absolute bottom-0 z-[-1] -left-6 lg:w-[240px] lg:h-[240px] md:w-[180px] md:h-[180px] sm:w-[140px] sm:h-[140px] h-[110px] w-[110px]"
      />

      <Image
        src={GuitarThing}
        alt="GuitarThing"
        className="absolute bottom-4 left-4 sm:left-8 md:left-12 lg:left-16 z-[-1] lg:w-[148px] lg:h-[180px] md:w-[118px] md:h-[150px] sm:w-[108px] sm:h-[140px] h-[90px] w-[58px]"
      />

      <Image
        src={Eclipse}
        alt="Eclipse"
        className="absolute top-0 right-0 z-0"
        style={{ width: "100px", height: "100px" }}
      />

      <Image
        src={ButtonStar}
        alt="Circle Drawing"
        className="absolute bottom-14 right-14 z-0"
      />

      <Image
        src={ButtonStar}
        alt="Circle Drawing"
        className="absolute top-14 right-44 z-0"
        style={{ width: "15px", height: "15px" }}
      />
    </div>
  );
};

export default HeroSection;
