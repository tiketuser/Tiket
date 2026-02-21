import React, { ReactNode } from "react";
import Link from "next/link";

interface BoxThingProps {
  children: ReactNode;
  className?: string;
  width?: string;
  height?: string;
  href?: string;
  onClick?: () => void;
}

const BoxThing: React.FC<BoxThingProps> = ({
  children,
  className = "",
  width = "w-full max-w-[604px]",
  height = "h-auto min-h-[72px]",
  href,
  onClick,
}) => {
  const isButton = href || onClick;

  return isButton ? (
    <Link href={href || "#"} passHref legacyBehavior>
      <button
        onClick={onClick}
        className={`relative bg-white shadow-lg p-4 sm:p-6 ${width} ${height} ${className} border-none
        transition-all duration-300 transform hover:scale-105`}
      >
        {children}
        <div className="absolute bottom-0 left-0 right-0 border-t-8 border-highlight" />
      </button>
    </Link>
  ) : (
    <div
      className={`relative bg-white shadow-lg p-4 sm:p-6 ${width} ${height} ${className}`}
    >
      {children}
      <div className="absolute bottom-0 left-0 right-0 border-t-8 border-highlight" />
    </div>
  );
};

export default BoxThing;
