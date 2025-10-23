import { useState, useEffect } from "react";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

interface ExtendedTicketDetails {
  artist: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  seat: string;
  row: string;
  section: string;
  barcode: string;
  isStanding: boolean;
}

const StepThreeUploadTicket: React.FC<UploadTicketInterface> = ({
  nextStep,
  prevStep,
  ticketData,
  updateTicketData,
  saveAndAddAnother,
  proceedToReview,
}) => {
  // Local state for editable fields
  const [editableDetails, setEditableDetails] = useState<ExtendedTicketDetails>(
    {
      artist: "",
      category: "מוזיקה",
      date: "",
      time: "",
      venue: "",
      seat: "",
      row: "",
      section: "",
      barcode: "",
      isStanding: false,
    }
  );

  const [isDateInPast, setIsDateInPast] = useState(false);
  const [dateError, setDateError] = useState<string>("");

  // Load ticket details when component mounts
  useEffect(() => {
    console.log("StepThree - ticketData received:", ticketData);

    if (ticketData?.ticketDetails) {
      const details = ticketData.ticketDetails;
      console.log("StepThree - ticketDetails:", details);

      // Map OCR extracted data to form fields
      const newDetails = {
        artist: details.artist || details.title || "", // Use title as fallback for backwards compatibility
        category: details.category || "מוזיקה",
        date: details.date || "",
        time: details.time || "",
        venue: details.venue || "",
        // Seat info is stored directly in ticketDetails (not nested)
        seat: details.seat || "",
        row: details.row || "",
        section: details.section || "",
        barcode: details.barcode || "",
        isStanding: details.isStanding || false,
      };

      console.log("StepThree - Setting editable details:", newDetails);
      setEditableDetails(newDetails);

      // Validate the extracted date
      if (newDetails.date) {
        const validation = validateDate(newDetails.date);
        setIsDateInPast(validation.isInPast);
        setDateError(validation.error);
      }
    }
  }, [ticketData]);

  // Comprehensive date validation
  const validateDate = (
    dateStr: string
  ): { isValid: boolean; error: string; isInPast: boolean } => {
    if (!dateStr) {
      return { isValid: false, error: "", isInPast: false };
    }

    try {
      let day: number, month: number, year: number;

      // Parse DD/MM/YYYY or DD.MM.YYYY format
      if (dateStr.includes("/") || dateStr.includes(".")) {
        const parts = dateStr.split(/[\/\.]/);
        if (parts.length !== 3) {
          return {
            isValid: false,
            error: "פורמט תאריך לא תקין. השתמש ב- DD/MM/YYYY או DD.MM.YYYY",
            isInPast: false,
          };
        }

        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else {
        // Try parsing other formats
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
          return { isValid: false, error: "תאריך לא תקין", isInPast: false };
        }
        day = dateObj.getDate();
        month = dateObj.getMonth() + 1;
        year = dateObj.getFullYear();
      }

      // Validate day (1-31)
      if (isNaN(day) || day < 1 || day > 31) {
        return { isValid: false, error: "יום לא תקין (1-31)", isInPast: false };
      }

      // Validate month (1-12)
      if (isNaN(month) || month < 1 || month > 12) {
        return {
          isValid: false,
          error: "חודש לא תקין (1-12)",
          isInPast: false,
        };
      }

      // Validate year (current year to 2 years in future)
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 2) {
        return {
          isValid: false,
          error: `שנה לא תקינה (${currentYear}-${currentYear + 2})`,
          isInPast: false,
        };
      }

      // Check if date is valid (e.g., not Feb 31)
      const dateObj = new Date(year, month - 1, day);
      if (
        dateObj.getDate() !== day ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getFullYear() !== year
      ) {
        return {
          isValid: false,
          error: "תאריך לא קיים (לדוגמה: 31/2)",
          isInPast: false,
        };
      }

      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);

      if (dateObj < today) {
        return {
          isValid: false,
          error: "התאריך עבר - הזן תאריך עתידי",
          isInPast: true,
        };
      }

      // Check if date is too far in the future (more than 2 years)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      if (dateObj > maxDate) {
        return {
          isValid: false,
          error: "התאריך רחוק מדי בעתיד (עד שנתיים)",
          isInPast: false,
        };
      }

      return { isValid: true, error: "", isInPast: false };
    } catch (error) {
      console.error("Error validating date:", error);
      return { isValid: false, error: "שגיאה בבדיקת תאריך", isInPast: false };
    }
  };

  const handleDetailChange = (field: string, value: string) => {
    setEditableDetails((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Check if date field was changed and validate it
    if (field === "date") {
      const validation = validateDate(value);
      setIsDateInPast(validation.isInPast);
      setDateError(validation.error);
    }

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

  const handleStandingChange = (checked: boolean) => {
    setEditableDetails((prev) => ({
      ...prev,
      isStanding: checked,
      // Clear seat info when standing is checked
      ...(checked && { seat: "", row: "", section: "" }),
    }));

    // Update ticket data
    if (updateTicketData) {
      updateTicketData({
        ticketDetails: {
          ...ticketData?.ticketDetails,
          isStanding: checked,
          // Clear seat info when standing is checked
          ...(checked && { seat: "", row: "", section: "" }),
        },
      });
    }
  };

  const formatSeatLocation = () => {
    const parts = [];

    // Only add venue if it has a value
    if (editableDetails.venue && editableDetails.venue.trim()) {
      parts.push(editableDetails.venue);
    }

    // If it's a standing ticket, show "עמידה" and skip seat details
    if (editableDetails.isStanding) {
      parts.push("עמידה");
      return parts.join(" • ");
    }

    // Only add section label if there's a value
    if (editableDetails.section && editableDetails.section.trim()) {
      parts.push(`יציע ${editableDetails.section}`);
    }

    // Only add row label if there's a value
    if (editableDetails.row && editableDetails.row.trim()) {
      parts.push(`שורה ${editableDetails.row}`);
    }

    // Only add seat label if there's a value
    if (editableDetails.seat && editableDetails.seat.trim()) {
      parts.push(`מקום ${editableDetails.seat}`);
    }

    // If no location info at all, show placeholder
    return parts.length > 0 ? parts.join(" • ") : "מיקום לא צוין";
  };

  const canProceed =
    editableDetails.artist &&
    editableDetails.date &&
    editableDetails.time &&
    editableDetails.venue &&
    !dateError &&
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

        {/* Show warning if date has errors */}
        {dateError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-semibold">⚠️ בעיה בתאריך</p>
            <p className="text-xs text-red-600 mt-1">
              {dateError}. אנא תקן את התאריך כדי לפרסם את הכרטיס.
            </p>
          </div>
        )}
      </div>

      {/* Preview Card */}
      <div className="mt-6 flex justify-center">
        <MinimalCard
          price={ticketData?.pricing?.askingPrice || 0}
          title={editableDetails.artist || "ללא שם אירוע"}
          date={editableDetails.date || "ללא תאריך"}
          venue={editableDetails.venue || ""}
          seatLocation={formatSeatLocation()}
          width="w-[800px]"
        />
      </div>

      {/* Simple Form */}
      <div className="mt-6 max-w-[500px] mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם האירוע *
            </label>
            <CustomInput
              id="artist"
              name="artist"
              width="w-full"
              placeholder="עומר אדם, מכבי תל אביב נגד הפועל"
              value={editableDetails.artist}
              onChange={(e) => handleDetailChange("artist", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              קטגוריה *
            </label>
            <select
              id="category"
              name="category"
              value={editableDetails.category}
              onChange={(e) => handleDetailChange("category", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="מוזיקה">מוזיקה</option>
              <option value="תיאטרון">תיאטרון</option>
              <option value="סטנדאפ">סטנדאפ</option>
              <option value="ילדים">ילדים</option>
              <option value="ספורט">ספורט</option>
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                dateError ? "text-red-600" : "text-gray-700"
              }`}
            >
              תאריך *
            </label>
            <div className="relative">
              <CustomInput
                id="date"
                name="date"
                width="w-full"
                placeholder="DD/MM/YYYY או DD.MM.YYYY"
                value={editableDetails.date}
                onChange={(e) => handleDetailChange("date", e.target.value)}
                error={!!dateError}
              />
              {dateError && (
                <div className="absolute -bottom-6 right-0 text-xs text-red-600 font-medium">
                  ⚠️ {dateError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שעת האירוע *
          </label>
          <CustomInput
            id="time"
            name="time"
            width="w-full"
            placeholder="20:00"
            value={editableDetails.time}
            onChange={(e) => handleDetailChange("time", e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            פורמט: HH:MM (לדוגמה: 20:00)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מקום האירוע *
          </label>
          <CustomInput
            id="venue"
            name="venue"
            width="w-full"
            placeholder="היכל מנורה מבטחים"
            value={editableDetails.venue}
            onChange={(e) => handleDetailChange("venue", e.target.value)}
          />
        </div>

        {/* Standing Ticket Checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={editableDetails.isStanding}
              onChange={(e) => handleStandingChange(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">
              כרטיס עמידה (ללא מקומות ישיבה)
            </span>
          </label>
        </div>

        {/* Seat Information - Hidden when standing ticket */}
        {!editableDetails.isStanding && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                יציע{" "}
                <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <CustomInput
                id="section"
                name="section"
                width="w-full"
                placeholder={editableDetails.section || "ריק"}
                value={editableDetails.section}
                onChange={(e) => handleDetailChange("section", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שורה{" "}
                <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <CustomInput
                id="row"
                name="row"
                width="w-full"
                placeholder={editableDetails.row || "ריק"}
                value={editableDetails.row}
                onChange={(e) => handleDetailChange("row", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מקום{" "}
                <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <CustomInput
                id="seat"
                name="seat"
                width="w-full"
                placeholder={editableDetails.seat || "ריק"}
                value={editableDetails.seat}
                onChange={(e) => handleDetailChange("seat", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {ticketData?.pricing && (
          <div className="text-center mb-6">
            <p className="text-primary font-semibold">
              מחיר מבוקש: ₪{ticketData.pricing.askingPrice}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 mt-6">
        <div className="flex flex-col items-center gap-3">
          {/* Primary actions */}
          <div className="flex justify-center gap-4 w-full max-w-[700px]">
            <button
              type="button"
              className={`btn flex-1 h-[46px] sm:max-w-[180px] w-[180px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
                canProceed
                  ? "bg-secondary text-primary hover:bg-secondary/90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canProceed && saveAndAddAnother) {
                  saveAndAddAnother();
                }
              }}
              disabled={!canProceed}
            >
              הוסף כרטיס נוסף
            </button>

            <button
              type="button"
              className={`btn flex-1 h-[46px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
                canProceed
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canProceed && proceedToReview) {
                  proceedToReview();
                }
              }}
              disabled={!canProceed}
            >
              המשך לפרסום
            </button>

            {/* Back button */}
            <button
              type="button"
              className="btn w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
              onClick={() => prevStep && prevStep()}
            >
              לשלב הקודם
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepThreeUploadTicket;
