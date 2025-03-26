import { ReactNode, useEffect } from "react";
import Image from "next/image";

import exitIcon from "../../../../public/images/Dialogs/exitIcon.svg"

interface AdjustableDialogProps {
  width?: string;
  height?: string;
  isOpen: boolean;
  onClose: () => void;
  heading?: string
  description?: string
  topChildren?: ReactNode;
  children: ReactNode; 
}

const AdjustableDialog: React.FC<AdjustableDialogProps> = ({
    width = "w-96",
    height = "h-96",
    heading = 'כותרת',
    description = 'תיאור',
    isOpen,
    onClose,
    topChildren,
    children
}) => {

  // Disable scrolling when dialog open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-doc-scroll");
    } else {
      document.body.classList.remove("no-doc-scroll");
    }

    return () => {
      document.body.classList.remove("no-doc-scroll");
    };
  }, [isOpen]);

  return (
    isOpen && (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-black bg-opacity-50 backdrop-blur-sm">
          {/* Dialog Box */}
          <div className={`relative bg-white shadow-lg p-6 ${width} ${height}`}>
            {/* Exit Button */}
            
            <button
              className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 p-4"
              onClick={onClose}
            >
              <Image src={exitIcon} alt="exitIcon" height={22} width={22}/>
            </button>
            
            <div className="flex justify-center items-center w-full mt-5">
              {topChildren && topChildren}
            </div>

            <div className="xlg:pt-8 pt-4 select-none">
              <h2 className="text-center lg:text-heading-1-desktop text-heading-1-mobile font-extrabold text-gray-950">
                {heading}
              </h2>
              <p className="text-center text-heading-5-mobile font-bold text-strongText">
                {description}
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center select-none">
              {children}    
            </div>     

            <div className={`absolute bottom-0 left-0 border-t-8 border-highlight ${width} `}></div>      
          </div>
        </div>
      </>
    )
  );
}

export default AdjustableDialog;

