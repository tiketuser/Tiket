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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm py-4 sm:py-8">
          {/* Dialog Box */}
          <div
            className="relative bg-white shadow-lg w-[95%] sm:w-auto flex flex-col max-h-[95vh]"
            style={inlineMaxWidth ? { maxWidth: inlineMaxWidth } : undefined}
          >
            {/* Exit Button */}
            <button
              className="absolute top-2 left-2 text-gray-600 hover:text-gray-900 p-2 z-10"
              onClick={onClose}
            >
              <Image src={exitIcon} alt="exitIcon" height={20} width={20} />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 sm:p-10 py-10 px-3 sm:px-10">
              <div className="flex justify-center items-center w-full mt-3">
                {topChildren && topChildren}
              </div>

              <div className="sm:pt-4 pt-2 select-none" dir="rtl">
                <h2 className="text-center sm:text-heading-2-desktop text-heading-2-mobile font-extrabold text-gray-950">
                  {heading}
                </h2>
                <p className="text-center text-text-medium font-bold text-strongText">
                  {description}
                </p>
              </div>

              {/* Content */}
              <div className="flex flex-col items-center select-none" dir="rtl">
                {children}
              </div>
            </div>

            <div className="border-t-8 border-highlight w-full shrink-0"></div>
          </div>
        </div>
      </>
    )
  );
};

export default AdjustableDialog;
