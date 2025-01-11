import { ReactNode, useEffect } from "react";
import Image from "next/image";

import exitIcon from "../../../../public/images/Dialogs/exitIcon.svg"

interface AdjustableDialogProps {
  width?: string;
  height?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode; 
}

const AdjustableDialog: React.FC<AdjustableDialogProps> = ({
    width = "w-96",
    height = "h-96",
    isOpen,
    onClose,
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

            {/* Content */}
            <div className="flex items-center justify-center h-full">{children}</div>     

            <div className={`absolute bottom-0 left-0 border-t-8 border-highlight ${width} `}></div>      
          </div>
        </div>
      </>
    )
  );
}

export default AdjustableDialog;

