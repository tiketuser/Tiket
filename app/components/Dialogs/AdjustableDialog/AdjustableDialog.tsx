import { ReactNode, useEffect, useState } from "react";
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
  width = "w-[95%] sm:w-auto",
  height = "h-auto",
  heading = "כותרת",
  description = "תיאור",
  isOpen,
  onClose,
  topChildren,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      // Small delay so the element is in the DOM before animating in
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      document.body.classList.add("no-doc-scroll");
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 300);
      document.body.classList.remove("no-doc-scroll");
      return () => clearTimeout(t);
    }
    return () => {
      document.body.classList.remove("no-doc-scroll");
    };
  }, [isOpen]);

  if (!rendered) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center py-4 sm:py-8 transition-all duration-300 ${
          visible ? "bg-black/50 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"
        }`}
      >
        {/* Dialog Box */}
        <div
          className={`relative bg-white shadow-lg ${width} ${height} flex flex-col max-h-[95vh] transition-all duration-300 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
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
  );
};

export default AdjustableDialog;
