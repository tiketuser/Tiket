import Image from "next/image";
import React from "react";

import HeartIcon from "../../../public/images/heart-icon.svg";

const NavBar = () => {
  return (
    <div
      dir="ltr"
      className="relative navbar bg-white shadow-md flex justify-between items-center px-4 z-50"
    >
      {/* Left Side */}
      <div>
        <h1 className="text-xl font-extrabold">Tiket</h1>
      </div>

      {/* Right Side */}
      <div className="flex space-x-6">
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

        <button className="btn btn-secondary w-24 text-primary">הירשם</button>
        <button className="btn btn-primary w-24 text-gray-50">התחבר</button>

        <div className="dropdown dropdown-end dropdown-hover">
          <button
            tabIndex={0}
            role="btn"
            className="btn btn-ghost btn-circle avatar hover:bg-red-100"
          >
            <img
              alt="user"
              src="https://img.icons8.com/fluency-systems-regular/50/user--v1.png"
              style={{ width: "35px", height: "35px" }}
            />
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li>
              <a>התחבר</a>
            </li>
            <li>
              <a>הירשם</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
