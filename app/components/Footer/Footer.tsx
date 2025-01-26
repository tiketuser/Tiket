"use client"

import React from "react";
import Image from "next/image";
import FacebookIcon from "../../../public/images/Home Page/Web/FacebookIcon.svg";
import InstagramIcon from "../../../public/images/Home Page/Web/InstagramIcon.svg";
import TwitterIcon from "../../../public/images/Home Page/Web/TwitterIcon.svg";
import YoutubeIcon from "../../../public/images/Home Page/Web/YoutubeIcon.svg";
import TiktokIcon from "../../../public/images/Home Page/Web/TiktokIcon.svg";
import ProfileIcon from "../../../public/images/Home Page/ProfileButton.svg";
import SignUpDialog from "../Dialogs/SignUpDialog/SignUpDialog";
import LoginDialog from "../Dialogs/LoginDialog/LoginDialog";

const Footer = () => {
  const [isLoginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [isSignUpDialogOpen, setSignUpDialogOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Footer */}
      <footer className="hidden sm:flex relative bottom-0 w-full bg-white justify-between items-center px-4 h-20 shadow-xsmall-inner select-none">
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

      {/* Mobile Footer */}
      <footer className="sm:hidden bottom-0 w-full bg-transparent h-16 fixed ">
        {/* Profile Button */}
        <button className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg w-12 h-12 flex justify-center items-center border-2 border-primary">
          <Image src={ProfileIcon} alt="ProfileIcon" className="scale-90"/>
        </button>

        {/* Buttons Container */}
        <div className="flex h-full">
          {/* Buy Button */}
          <button className="flex-1 bg-primary text-white text-text-large font-normal text-center rounded-t-xl"
            onClick={() => setLoginDialogOpen(true)}>
            התחבר
          </button>

          {/* Sell Button */}
          <button className="flex-1 bg-white border-2 border-primary text-primary text-text-large font-normal text-center rounded-t-xl"
            onClick={() => setSignUpDialogOpen(true)}>
            הירשם
          </button>
        </div>
      </footer>

      <SignUpDialog isOpen={isSignUpDialogOpen} onClose={() => setSignUpDialogOpen(false)} />
      <LoginDialog isOpen={isLoginDialogOpen} onClose={() => setLoginDialogOpen(false)}/>
    </>
  );
};

export default Footer;
