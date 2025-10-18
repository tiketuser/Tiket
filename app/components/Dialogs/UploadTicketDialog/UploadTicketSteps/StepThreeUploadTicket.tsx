import { useState, useEffect } from "react";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

const StepThreeUploadTicket: React.FC<UploadTicketInterface> = ({
  nextStep,
  prevStep,
  ticketData,
  updateTicketData,
}) => {
  // Local state for editable fields
  const [editableDetails, setEditableDetails] = useState({
    title: "",
    artist: "",
    date: "",
    time: "",
    venue: "",
    seat: "",
    row: "",
    section: "",
    barcode: "",
  });

  // Load ticket details when component mounts
  useEffect(() => {
    if (ticketData?.ticketDetails) {
      setEditableDetails({
        title: ticketData.ticketDetails.title || "",
        artist: ticketData.ticketDetails.artist || "",
        date: ticketData.ticketDetails.date || "",
        time: ticketData.ticketDetails.time || "",
        venue: ticketData.ticketDetails.venue || "",
        seat: ticketData.ticketDetails.seat || "",
        row: ticketData.ticketDetails.row || "",
        section: ticketData.ticketDetails.section || "",
        barcode: ticketData.ticketDetails.barcode || "",
      });
    }
  }, [ticketData]);

  const handleDetailChange = (field: string, value: string) => {
    setEditableDetails((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Update ticket data
    if (updateTicketData) {
      updateTicketData({
        ticketDetails: {
          ...ticketData?.ticketDetails,
          [field]: value,
        },
      });
    }
  };

  const formatSeatLocation = () => {
    const parts = [];
    if (editableDetails.section) parts.push(`יציע ${editableDetails.section}`);
    if (editableDetails.row) parts.push(`שורה ${editableDetails.row}`);
    if (editableDetails.seat) parts.push(`מקום ${editableDetails.seat}`);
    return parts.join(" ") || "מיקום לא צוין";
  };

  const canProceed =
    editableDetails.title &&
    editableDetails.date &&
    ticketData?.pricing?.askingPrice;

  // Show extraction status if there was an error
  const hasExtractionError = ticketData?.extractionError;

  return (
    <div>
      <div className="max-w-[500px] mx-auto px-4 mt-8">
        {/* Title and Subtitle */}
        

        {/* Show extraction status */}
        {hasExtractionError && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">⚠️ {hasExtractionError}</p>
            <p className="text-xs text-orange-600 mt-1">
              {hasExtractionError.includes("quota exceeded")
                ? "OpenAI quota exceeded - please fill in ticket details manually"
                : "אנא בדוק ועדכן את הפרטים הבאים ידנית"}
            </p>
          </div>
        )}
      </div>

      {/* Preview Card */}
      <div className="mt-6 flex justify-center">
        <MinimalCard
          price={ticketData?.pricing?.askingPrice || 0}
          title={editableDetails.artist || editableDetails.title || "ללא כותרת"}
          date={editableDetails.date || "ללא תאריך"}
          seatLocation={formatSeatLocation()}
          width="w-[800px]"
        />
      </div>

      {/* Simple Form */}
      <div className="mt-6 max-w-[500px] mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כותרת האירוע *
            </label>
            <CustomInput
              id="title"
              name="title"
              width="w-full"
              placeholder="שם האמן/אירוע"
              value={editableDetails.title}
              onChange={(e) => handleDetailChange("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תאריך *
            </label>
            <CustomInput
              id="date"
              name="date"
              width="w-full"
              placeholder="15 אוק׳"
              value={editableDetails.date}
              onChange={(e) => handleDetailChange("date", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              יציע
            </label>
            <CustomInput
              id="section"
              name="section"
              width="w-full"
              placeholder="4"
              value={editableDetails.section}
              onChange={(e) => handleDetailChange("section", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שורה
            </label>
            <CustomInput
              id="row"
              name="row"
              width="w-full"
              placeholder="24"
              value={editableDetails.row}
              onChange={(e) => handleDetailChange("row", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מקום
            </label>
            <CustomInput
              id="seat"
              name="seat"
              width="w-full"
              placeholder="15"
              value={editableDetails.seat}
              onChange={(e) => handleDetailChange("seat", e.target.value)}
            />
          </div>
        </div>

        {/* Pricing Summary */}
        {ticketData?.pricing && (
          <div className="text-center mb-6">
            <p className="text-primary font-semibold">
              מחיר מבוקש: ₪{ticketData.pricing.askingPrice}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 sm:gap-10 mt-6">
        <button
          type="button"
          className="btn w-[120px] sm:w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
          onClick={() => prevStep && prevStep()}
        >
          לשלב הקודם
        </button>

        <button
          type="button"
          className={`btn w-[120px] sm:w-[140px] h-[46px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
            canProceed
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-secondary text-white cursor-not-allowed"
          }`}
          onClick={() => {
            if (canProceed && nextStep) {
              nextStep();
            }
          }}
          disabled={!canProceed}
        >
          פרסום כרטיס
        </button>
      </div>
    </div>
  );
};

export default StepThreeUploadTicket;
