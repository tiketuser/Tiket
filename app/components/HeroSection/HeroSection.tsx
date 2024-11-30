import React from "react";
import Image from "next/image";

import SecondaryHalfCircle from "../../../public/images/Home Page/Web/Secondary Half Circle.svg";
import Eclipse from "../../../public/images/Home Page/Web/Ellipse 13.svg";
import ButtonStar from "../../../public/images/Home Page/Web/Buttom Star.svg";
import GuitarThing from "../../../public/images/Home Page/Web/Guitar Thing.svg";

const HeroSection = () => {
  return (
    <div className="select-none relative bg-white mx-auto w-full shadow-xsmall-inner z-30 h-72 flex justify-center items-center overflow-x-hidden">
      <div className="flex flex-col items-center text-right" dir="rtl">
        <h1 className="text-heading-1-desktop font-extrabold">
          הופעה סולד-אאוט? / לא יכולים להגיע?
        </h1>
        <p className="text-text-large font-light mb-8">
          הזדמנות נוספת לכרטיסים - קנו ומכרו בקלות ובאופן מאובטח.
        </p>

        <div className="space-x-14 space-x-reverse">
          <button className="btn  btn-primary w-28 h-16 text-gray-50 font-regular text-heading-4-desktop">
            קנה
          </button>
          <button className="btn b border-[px] btn-secondary w-28 h-16 text-primary font-regular text-heading-4-desktop">
            מכור
          </button>
        </div>
      </div>

      <Image
        src={SecondaryHalfCircle}
        alt="SecondaryHalfCircle"
        className="absolute bottom-0 -left-6"
        style={{ width: "240px", height: "240px" }}
      />

      <Image
        src={GuitarThing}
        alt="GuitarThing"
        className="absolute bottom-4 left-16"
        style={{ width: "148px", height: "180px" }}
      />

      <Image
        src={Eclipse}
        alt="Eclipse"
        className="absolute top-0 right-0"
        style={{ width: "100px", height: "100px" }}
      />

      <Image
        src={ButtonStar}
        alt="Circle Drawing"
        className="absolute bottom-14 right-14"
      />

      <Image
        src={ButtonStar}
        alt="Circle Drawing"
        className="absolute top-14 right-44"
        style={{ width: "15px", height: "15px" }}
      />
    </div>
  );
};

export default HeroSection;
