import { UploadTicketInterface } from "./UploadTicketInterface.types";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

const StepFourUploadTicket: React.FC<UploadTicketInterface> = ({
  savedTickets = [],
  publishAllTickets,
  isPublishing,
  prevStep,
}) => {
  const handlePublish = async () => {
    if (publishAllTickets) {
      await publishAllTickets();
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="w-full max-w-[880px] mt-6 sm:mt-12">
        {/* Title and Subtitle */}
        <p className="text-lg sm:text-heading-5-desktop font-bold">
          סקירה סופית
        </p>
        <p className="text-sm sm:text-text-medium font-bold text-strongText">
          בדוק את כל הכרטיסים לפני הפרסום ({savedTickets.length} כרטיסים)
        </p>
      </div>

      {/* Display all saved tickets */}
      <div className="mt-6 sm:mt-8 w-full max-w-[880px] space-y-4 max-h-[500px] overflow-y-auto">
        {savedTickets.map((ticket, index) => (
          <MinimalCard
            key={index}
            price={ticket?.pricing?.askingPrice || 0}
            priceBefore={ticket?.ticketDetails?.originalPrice}
            title={
              ticket?.ticketDetails?.artist ||
              ticket?.ticketDetails?.title || // Fallback for backwards compatibility
              ""
            }
            date={ticket?.ticketDetails?.date || ""}
            venue={ticket?.ticketDetails?.venue}
            seatLocation={
              ticket?.ticketDetails?.isStanding
                ? "עמידה"
                : [
                    ticket?.ticketDetails?.venue,
                    ticket?.ticketDetails?.section,
                    ticket?.ticketDetails?.row,
                    ticket?.ticketDetails?.seat,
                  ]
                    .filter(Boolean)
                    .join(" • ")
            }
            width="w-full"
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3 mt-8 w-full max-w-[880px]">
        <button
          className={`btn w-full h-[48px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
            isPublishing
              ? "bg-gray-400 text-white cursor-wait"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <div className="flex items-center gap-2">
              <div className="loading loading-spinner loading-sm"></div>
              <span>מפרסם כרטיסים...</span>
            </div>
          ) : (
            `פרסם ${savedTickets.length} כרטיסים`
          )}
        </button>

        <button
          type="button"
          className="btn w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
          onClick={() => prevStep && prevStep()}
          disabled={isPublishing}
        >
          חזור
        </button>
      </div>
    </div>
  );
};

export default StepFourUploadTicket;
