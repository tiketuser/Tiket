import React from "react";
import Image from "next/image";
import FacebookIcon from "../../../public/images/Home Page/Web/FacebookIcon.svg";
import InstagramIcon from "../../../public/images/Home Page/Web/InstagramIcon.svg";
import TwitterIcon from "../../../public/images/Home Page/Web/TwitterIcon.svg";
import YoutubeIcon from "../../../public/images/Home Page/Web/YoutubeIcon.svg";
import TiktokIcon from "../../../public/images/Home Page/Web/TiktokIcon.svg";

const Footer = () => {
  return (
    <footer className="relative bottom-0 w-full bg-white flex justify-center items-center px-4 h-20 shadow-xsmall-inner ">
      <div className="flex items-center gap-3">
        <button className="flex items-center">
          <Image src={YoutubeIcon} alt="YouTubeIcon" />
        </button>

        <button className="flex items-center">
          <Image src={FacebookIcon} alt="FacebookIcon" />
        </button>

        <button className="flex items-center">
          <Image src={TiktokIcon} alt="TiktokIcon" />
        </button>

        <button className="flex items-center">
          <Image src={TwitterIcon} alt="TwitterIcon" />
        </button>

        <button className="flex items-center ml-7">
          <Image src={InstagramIcon} alt="InstagramIcon" />
        </button>
      </div>
      <div className="flex items-center gap-7 ">
        <a href="#" className="link link-hover text-text-medium font-light">
          צור קשר
        </a>
        <a href="#" className="link link-hover text-text-medium font-light">
          תנאי שימוש
        </a>
        <a href="#" className="link link-hover text-text-medium font-light">
          מדיניות פרטיות
        </a>
        <a href="#" className="link link-hover text-text-medium font-light">
          שאלות נפוצות / עזרה
        </a>
      </div>

      <div className="relative border-t-2 border-gray-300 flex-grow mr-7"></div>
    </footer>
  );
};

export default Footer;
