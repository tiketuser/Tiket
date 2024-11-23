import Image from "next/image";
import React from "react";

import HeartIcon from "../../../public/images/heart-icon.svg";
import Arrow from '../../../public/images/Home Page/Web/Arrow.svg'; 
import ProfileButton from '../../../public/images/Home Page/ProfileButton.svg';

const NavBar = () => {
  return (
    <div
      dir="ltr"
      className="relative navbar bg-white flex justify-between items-center px-4 z-50 h-20"
    >
      {/* Left Side */}
      <div>
        <h1 className="text-xl font-extrabold">Tiket</h1>
      </div>

      {/* Right Side */}
      <div className="flex space-x-6">
        <button className="flex items-center space-x-2 rtl:space-x-reverse hover:text-gray-600 focus:outline-none">
          <Image
              src={Arrow}
              alt="Arrow"
            />
          <span className="text-text-large font-normal">הכרטיסים שלי</span>
        </button>

        <button
          role="btn"
          className="btn btn-ghost btn-circle avatar hover:bg-red-200"
        >
          <Image
            src={HeartIcon}
            alt="heart icon"
            style={{ width: "30px", height: "30px" }}
          />
        </button>

        <button className="btn btn-secondary w-24 text-primary text-text-large font-normal">הירשם</button>
        <button className="btn btn-primary w-24 text-gray-50 text-text-large font-normal">התחבר</button>
        
        <button
            tabIndex={0}
            role="btn"
            className="btn btn-ghost btn-circle avatar hover:bg-red-100"
          >
            <Image
              src={ProfileButton}
              alt="Profile"
              style={{ width: "25px", height: "25px", overflow: "visible" }}
            />
        </button>
      </div>
    </div>
  );
};

export default NavBar;
