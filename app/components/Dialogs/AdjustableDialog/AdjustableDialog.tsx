import { ReactNode, useEffect, useMemo } from "react";
import Image from "next/image";

import exitIcon from "../../../../public/images/Dialogs/exitIcon.svg";

interface AdjustableDialogProps {
  width?: string;
  height?: string;
  isOpen: boolean;
  onClose: () => void;
  heading?: string;
  description?: string;
  topChildren?: ReactNode;
  children: ReactNode;
}

const AdjustableDialog: React.FC<AdjustableDialogProps> = ({
  width = "w-96",
  height = "h-96",
  heading = "כותרת",
  description = "תיאור",
  isOpen,
  onClose,
  topChildren,
  children,
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

  // Extract pixel value from Tailwind class for inline style fallback
  // This fixes the dynamic class issue where sm:${width} doesn't work at build time
  const inlineMaxWidth = useMemo(() => {
    const match = width.match(/w-\[(\d+)px\]/);
    return match ? `${match[1]}px` : undefined;
  }, [width]);

  return (
    isOpen && (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm py-4 sm:py-8 overflow-y-auto">
          {/* Dialog Box */}
          <div
            className="relative bg-white shadow-lg sm:p-10 my-auto w-[95%] sm:w-auto h-auto py-10 px-3 sm:px-10 max-h-[95vh] overflow-y-auto"
            style={inlineMaxWidth ? { maxWidth: inlineMaxWidth } : undefined}
          >
            {/* Exit Button */}
            <button
              className="absolute top-2 left-2 text-gray-600 hover:text-gray-900 p-2 z-10"
              onClick={onClose}
            >
              <Image src={exitIcon} alt="exitIcon" height={20} width={20} />
            </button>

            <div className="flex justify-center items-center w-full mt-3">
              {topChildren && topChildren}
            </div>

            <div className="sm:pt-4 pt-2 select-none">
              <h2 className="text-center sm:text-heading-2-desktop text-heading-2-mobile font-extrabold text-gray-950">
                {heading}
              </h2>
              <p className="text-center text-text-medium font-bold text-strongText">
                {description}
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center select-none">
              {children}
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t-8 border-highlight"></div>
          </div>
        </div>
      </>
    )
  );
};

export default AdjustableDialog;
