import { UploadTicketInterface } from "./UploadTicketInterface.types";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";
import { formatSeatLocation } from "@/app/utils/categoryConfig";

const StepFiveUploadTicket: React.FC<UploadTicketInterface> = ({
  savedTickets = [],
  publishAllTickets,
  isPublishing,
  publishError,
  publishSuccess,
  publishWarning,
  handleClose,
  prevStep,
  canSplit,
  setCanSplit,
}) => {
  return (
    <div className="px-4 sm:px-0">
      <div className="w-full max-w-[880px] mt-2 sm:mt-8">
        <p className="text-lg sm:text-heading-5-desktop font-bold">סקירה סופית</p>
        <p className="text-sm sm:text-text-medium font-bold text-strongText">
          בדוק את כל הכרטיסים לפני הפרסום ({savedTickets.length} כרטיסים)
        </p>
      </div>

      {/* Bundle split preference — only shown for multi-ticket uploads and before publishing */}
      {savedTickets.length > 1 && !publishSuccess && !publishWarning && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-secondary/20 border border-secondary rounded-xl" dir="rtl">
          <p className="font-semibold text-strongText text-sm mb-3">
            הגדרת מכירה קבוצתית ({savedTickets.length} כרטיסים)
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/30 transition-colors">
              <input
                type="radio"
                name="canSplit"
                className="radio radio-primary radio-sm"
                checked={canSplit === true}
                onChange={() => setCanSplit?.(true)}
              />
              <div>
                <p className="text-sm font-semibold text-strongText">מכירה חלקית מותרת</p>
                <p className="text-xs text-mutedText">קונים יוכלו לבחור ולרכוש כרטיסים בודדים מהחבילה</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/30 transition-colors">
              <input
                type="radio"
                name="canSplit"
                className="radio radio-primary radio-sm"
                checked={canSplit === false}
                onChange={() => setCanSplit?.(false)}
              />
              <div>
                <p className="text-sm font-semibold text-strongText">חובה לרכוש את כל הכרטיסים</p>
                <p className="text-xs text-mutedText">הקונה יצטרך לרכוש את כל {savedTickets.length} הכרטיסים יחד</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Success Message */}
      {publishSuccess && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div className="flex-1">
              <p className="font-bold text-green-800 text-lg mb-2">הכרטיסים פורסמו בהצלחה!</p>
              <p className="text-green-700 text-sm whitespace-pre-line">{publishSuccess}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="btn w-full h-[48px] min-h-0 btn-primary bg-green-600 text-white hover:bg-green-700"
              onClick={handleClose}
            >
              סגור וחזור לדף הבית
            </button>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {publishWarning && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-lg mb-2">הכרטיסים ממתינים לאישור</p>
              <p className="text-orange-700 text-sm whitespace-pre-line">{publishWarning}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="btn w-full h-[48px] min-h-0 btn-primary bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleClose}
            >
              סגור וחזור לדף הבית
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {publishError && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚫</div>
            <div className="flex-1">
              <p className="font-bold text-red-800 text-lg mb-2">שגיאה בפרסום הכרטיס</p>
              <p className="text-red-700 text-sm whitespace-pre-line">{publishError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ticket list + action buttons — only before publish completes */}
      {!publishSuccess && !publishWarning && (
        <>
          <div className="mt-4 sm:mt-8 w-full max-w-[880px] space-y-4 max-h-[40vh] sm:max-h-[500px] overflow-y-auto">
            {savedTickets.map((ticket, index) => (
              <MinimalCard
                key={index}
                price={ticket?.pricing?.askingPrice || 0}
                title={ticket?.ticketDetails?.artist || ticket?.ticketDetails?.title || ""}
                date={ticket?.ticketDetails?.date || ""}
                venue={ticket?.ticketDetails?.venue}
                seatLocation={formatSeatLocation({
                  category: ticket?.ticketDetails?.category,
                  section: ticket?.ticketDetails?.section,
                  block: ticket?.ticketDetails?.block,
                  row: ticket?.ticketDetails?.row,
                  seat: ticket?.ticketDetails?.seat,
                  isStanding: ticket?.ticketDetails?.isStanding,
                })}
                width="w-full"
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 mt-4 sm:mt-8 max-w-[400px] mx-auto w-full">
            <button
              className={`btn w-full h-[48px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
                isPublishing ? "bg-gray-400 text-white cursor-wait" : "bg-primary text-white hover:bg-primary/90"
              }`}
              onClick={() => publishAllTickets?.()}
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
              className="btn w-full h-[48px] min-h-0 bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
              onClick={() => prevStep?.()}
              disabled={isPublishing}
            >
              חזור
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepFiveUploadTicket;
