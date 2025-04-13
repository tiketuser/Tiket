"use client";

import React, { useState } from "react";
import ClosedEyeIcon from "../../../public/images/Profile/ClosedEye.svg";
import OpenEyeIcon from "../../../public/images/Profile/OpenEyeIcon.svg";
import Image from "next/image";

interface UserDetailsProps {
  section: string;
}

const UserDetails: React.FC<UserDetailsProps> = ({ section }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const password = "aviv2004"; // הסיסמה בפועל
  return (
    <div className="sm:w-3/4 xs:w-3/4 p-6 border-r-[3px] border-highlight sm:mr-16">
      {section === "personal" && (
        <div>
          <div className="grid grid-cols-2 sm:gap-14 xs:gap-6 gap-1 xs:mb-6 mb-2">
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                שם פרטי
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8 ">
                אביב
              </p>
            </div>
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                שם משפחה
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8">
                ניר
              </p>
            </div>
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                מספר טלפון
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8">
                054-4437070
              </p>
            </div>
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                אימייל
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8 ">
                avivnir2004@gmail.com
              </p>
            </div>
            <div>
              {/* כותרת "סיסמה" */}
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10 mb-2">
                סיסמה
              </h4>

              {/* סיסמה + אייקון בשורה אחת */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <p className="sm:text-text-large xs:text-text-regular text-text-small ml-4">
                  {isPasswordVisible ? password : "********"}
                </p>
                <Image
                  src={isPasswordVisible ? OpenEyeIcon : ClosedEyeIcon}
                  alt="Toggle Password Visibility"
                  className="cursor-pointer transition-transform duration-300 hover:scale-110"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {section === "payment" && (
        <h2 className="text-2xl font-bold">פרטי תשלום</h2>
      )}
      {section === "activity" && (
        <h2 className="text-2xl font-bold">סיכום פעולות</h2>
      )}
      {section === "disconnect" && (
        <h2 className="text-2xl font-bold text-red-600">התנתקות</h2>
      )}
    </div>
  );
};

export default UserDetails;
