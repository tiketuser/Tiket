import React from "react";

interface LoginRegisterButtonsProps {
  className?: string;
  redButton?: string;
  grayButton?: string;
  onRedClick?: () => void;
  onGrayClick?: () => void;
  activeButton?: "red" | "gray"; // Which button is currently active
}

const LoginRegisterButtons: React.FC<LoginRegisterButtonsProps> = ({
  className = "",
  redButton = "התחבר",
  grayButton = "הירשם",
  onRedClick,
  onGrayClick,
  activeButton = "red",
}) => {
  const isRedActive = activeButton === "red";
  const isGrayActive = activeButton === "gray";

  return (
    <div className={"flex justify-center items-center " + className}>
      <button
        type="button"
        onClick={onGrayClick}
        className={`transform -translate-x-4 sm:w-[180px] sm:h-[40px] w-[125px] h-[28px] rounded-2xl transition-all duration-500 ease-in-out hover:scale-105 ${
          isGrayActive
            ? "bg-primary text-white shadow-lg scale-105 z-20"
            : "bg-gray-200 text-black hover:bg-gray-300 z-10"
        }`}
      >
        <label
          className={`sm:text-text-regular text-text-extra-small rtl cursor-pointer transition-colors duration-500`}
        >
          {grayButton}
        </label>
      </button>
      <button
        type="button"
        onClick={onRedClick}
        className={`transform translate-x-4 sm:w-[180px] sm:h-[40px] w-[125px] h-[28px] rounded-2xl transition-all duration-500 ease-in-out hover:scale-105 ${
          isRedActive
            ? "bg-primary text-white shadow-lg scale-105 z-20"
            : "bg-gray-200 text-black hover:bg-gray-300 z-10"
        }`}
      >
        <label
          className={`sm:text-text-regular text-text-extra-small rtl cursor-pointer transition-colors duration-500`}
        >
          {redButton}
        </label>
      </button>
    </div>
  );
};

export default LoginRegisterButtons;
