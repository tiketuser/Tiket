import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";

import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

import ShareIcon from "@/public/images/Dialogs/ShareIcon.svg";

const StepFourUploadTicket: React.FC<UploadTicketInterface> = ({
  resetAndPublishAnother,
  ticketData,
}) => {
  return (
    <div className="px-4 sm:px-0">
      <div className="w-full max-w-[668px] mt-6 sm:mt-12">
        {/* Title and Subtitle */}
        <p className="text-lg sm:text-heading-5-desktop font-bold">
          בהצלחה במכירה!
        </p>
        <p className="text-sm sm:text-text-medium font-bold text-strongText">
          תוכל לראות את הכרטיס ביחד עם שאר הכרטיסים במודעות שלך.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 w-full max-w-[668px]">
        <button
          id="publishAnother"
          className="btn w-full h-[48px] min-h-0 btn-secondary bg-primary text-white text-sm sm:text-text-large font-normal disabled:bg-secondary disabled:text-white mt-8 sm:mt-12 mx-auto block"
          onClick={resetAndPublishAnother}
        >
          פרסם כרטיס נוסף
        </button>

        <button
          id="myListings"
          className="btn w-full h-[48px] min-h-0 btn-secondary bg-secondary text-primary text-sm sm:text-text-large font-normal disabled:bg-secondary disabled:text-white mx-auto block"
        >
          המודעות שלי
        </button>

        <label className="link link-hover text-primary border-transparent text-sm sm:text-text-large font-normal cursor-pointer">
          לדף הבית
        </label>
      </div>

      <div className="flex flex-col items-center gap-2 mt-8 sm:mt-12">
        <p className="text-lg sm:text-heading-5-desktop font-bold text-center">
          שתף את הכרטיס ברשתות החברתיות
        </p>

        <button
          id="nextStep"
          className="btn w-full max-w-[340px] h-[48px] min-h-0 btn-secondary bg-secondary text-primary text-sm sm:text-text-large font-normal disabled:bg-secondary disabled:text-white mx-auto block"
        >
          <div className="flex items-center justify-center gap-2">
            <Image src={ShareIcon} alt="ShareIcon" />
            <label>שתף</label>
          </div>
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <MinimalCard
          price={ticketData?.pricing?.askingPrice || 0}
          priceBefore={ticketData?.ticketDetails?.originalPrice}
          title={
            ticketData?.ticketDetails?.artist ||
            ticketData?.ticketDetails?.title ||
            ""
          }
          date={ticketData?.ticketDetails?.date || ""}
          venue={ticketData?.ticketDetails?.venue}
          seatLocation={
            ticketData?.ticketDetails?.isStanding
              ? "עמידה"
              : [
                  ticketData?.ticketDetails?.venue,
                  ticketData?.ticketDetails?.section,
                  ticketData?.ticketDetails?.row,
                  ticketData?.ticketDetails?.seat,
                ]
                  .filter(Boolean)
                  .join(" • ")
          }
          width="w-full max-w-[880px]"
        />
      </div>
    </div>
  );
};

export default StepFourUploadTicket;
