import React from "react";
import FacebookIcon from "../../../public/images/ContactUs/Facebook.svg";
import InstegramIcon from "../../../public/images/ContactUs/Instagram.svg";
import TiktokIcon from "../../../public/images/ContactUs/Tiktok.svg";
import TwitetrkIcon from "../../../public/images/ContactUs/Twitter.svg";
import YoutubeIcon from "../../../public/images/ContactUs/youtube.svg";
import Image from "next/image";

const ContactInfoSection = () => {
  return (
    <div className="flex flex-col items-center text-right max-w-[500px] mx-auto space-y-6">
      {/* כותרת ראשית */}
      <h2 className="text-heading-2-desktop font-bold text-subtext leading-[57.6px] w-full">
        נשמח לשמוע ממך
      </h2>

      {/* יצירת קשר */}
      <div>
        <h6 className="text-heading-6-desktop font-bold text-subtext leading-[28px]">
          יצירת קשר
        </h6>
        <p className="text-text-large font-regular text-black leading-[30px]">
          מוזמנים ליצור קשר בכל שעה. אנחנו משתדלים להגיב בתוך 48 שעות.
        </p>
      </div>

      {/* שאלות נפוצות */}
      <div>
        <h6 className="text-heading-6-desktop font-bold text-subtext leading-[28px]">
          שאלות נפוצות
        </h6>
        <p className="text-text-large font-regular text-black leading-[30px]">
          לפני יצירת קשר, ייתכן שתרצה לבדוק את עמוד{" "}
          <a href="#" className="text-primary font-bold underline">
            השאלות הנפוצות
          </a>{" "}
          כדי לראות אם השאלה שלך כבר נענתה.
        </p>
      </div>

      {/* רשתות חברתיות */}
      <div className="text-right w-full">
        <h6 className="text-heading-6-desktop font-bold text-subtext leading-[28px]">
          מוזמנים לעקוב אחרינו ברשתות החברתיות
        </h6>
        <div className="flex justify-center gap-2 mt-2 text-text-large text-[#08050A]">
          <span className="text-text-large leading-8">Tiket@</span>
          <Image
            src={YoutubeIcon}
            alt="Youtube Icon"
            width={24}
            height={24}
            className="ml-2"
          />
          <span className="text-text-large leading-8">Tiket@</span>
          <Image
            src={FacebookIcon}
            alt="Facebook Icon"
            width={24}
            height={24}
            className="ml-2"
          />
          <span className="text-text-large leading-8">Tiket@</span>
          <Image
            src={TwitetrkIcon}
            alt="Twitetr Icon"
            width={24}
            height={24}
            className="ml-2"
          />
          <span className="text-text-large leading-8">Tiket@</span>
          <Image
            src={TiktokIcon}
            alt="Tiktok Icon"
            width={24}
            height={24}
            className="ml-2"
          />
          <span className="text-text-large leading-8">Tiket@</span>
          <Image
            src={InstegramIcon}
            alt="Instegram Icon"
            width={24}
            height={24}
            className="ml-2"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSection;
