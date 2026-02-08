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
  const [timeError, setTimeError] = useState<string>("");

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

      // Validate the extracted time
      if (newDetails.time) {
        const timeValidation = validateTime(newDetails.time);
        setTimeError(timeValidation.error);
      }
    }
  }, [ticketData]);

  // Comprehensive time validation
  const validateTime = (
    timeStr: string
  ): { isValid: boolean; error: string } => {
    if (!timeStr) {
      return { isValid: false, error: "" };
    }

    // Check HH:MM format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(timeStr)) {
      return {
        isValid: false,
        error: "פורמט שעה לא תקין. השתמש ב- HH:MM (לדוגמה: 20:00)",
      };
    }

    // Parse hours and minutes
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Validate hours (00-23)
    if (isNaN(hours) || hours < 0 || hours > 23) {
      return {
        isValid: false,
        error: "שעות לא תקינות (00-23)",
      };
    }

    // Validate minutes (00-59)
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      return {
        isValid: false,
        error: "דקות לא תקינות (00-59)",
      };
    }

    return { isValid: true, error: "" };
  };

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

    // Check if time field was changed and validate it
    if (field === "time") {
      const validation = validateTime(value);
      setTimeError(validation.error);
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
      parts.push(`אזור ${editableDetails.section}`);
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
    !timeError &&
    ticketData?.pricing?.askingPrice;

  // Sync all current editable details to ticketData before proceeding
  const syncAllDetailsAndProceed = () => {
    // Create the updated ticket data with all current details
    const updatedTicketData = {
      ...ticketData,
      ticketDetails: {
        ...ticketData?.ticketDetails,
        ...editableDetails,
      },
    };

    console.log(
      "syncAllDetailsAndProceed - updated ticket data:",
      updatedTicketData
    );

    // Update the parent state
    if (updateTicketData) {
      updateTicketData({
        ticketDetails: {
          ...ticketData?.ticketDetails,
          ...editableDetails,
        },
      });
    }

    // Pass the updated data directly to proceedToReview
    if (proceedToReview) {
      proceedToReview(updatedTicketData);
    }
  };

  const syncAllDetailsAndAddAnother = () => {
    // Create the updated ticket data with all current details
    const updatedTicketData = {
      ...ticketData,
      ticketDetails: {
        ...ticketData?.ticketDetails,
        ...editableDetails,
      },
    };

    console.log(
      "syncAllDetailsAndAddAnother - updated ticket data:",
      updatedTicketData
    );

    // Update the parent state
    if (updateTicketData) {
      updateTicketData({
        ticketDetails: {
          ...ticketData?.ticketDetails,
          ...editableDetails,
        },
      });
    }

    // Pass the updated data directly to saveAndAddAnother
    if (saveAndAddAnother) {
      saveAndAddAnother(updatedTicketData);
    }
  };

  // Show extraction status if there was an error
  const hasExtractionError = ticketData?.extractionError;

  return (
    <div className="w-full max-h-[calc(90vh-280px)] sm:max-h-[600px] overflow-y-auto px-2 sm:px-0">
      <div className="max-w-[500px] mx-auto px-2 sm:px-4 mt-1 sm:mt-2">
        {/* Title and Subtitle */}

        {/* Show extraction status */}
        {hasExtractionError && (
          <div className="mt-1 p-1.5 sm:p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-[10px] sm:text-xs text-orange-700">
              ⚠️ {hasExtractionError}
            </p>
          </div>
        )}

        {/* Show warning if date has errors
        {dateError && (
          <div className="mt-1 p-1.5 sm:p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-[10px] sm:text-xs text-red-700 font-semibold">⚠️ {dateError}</p>
          </div>
        )} */}
      </div>

      {/* Preview Card */}
      <div className="mt-1.5 sm:mt-2 flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-[320px] sm:max-w-[500px] md:max-w-[630px]">
          <MinimalCard
            price={ticketData?.pricing?.askingPrice || 0}
            title={editableDetails.artist || "ללא שם אירוע"}
            date={editableDetails.date || "ללא תאריך"}
            venue={editableDetails.venue || ""}
            seatLocation={formatSeatLocation()}
            width="w-full"
          />
        </div>
      </div>

      {/* Simple Form */}
      <div className="mt-1.5 sm:mt-2 max-w-[500px] mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
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
            <label className="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-gray-700">
              קטגוריה *
            </label>
            <select
              id="category"
              name="category"
              value={editableDetails.category}
              onChange={(e) => handleDetailChange("category", e.target.value)}
              className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className={`block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
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
                <div className="right-0 text-xs text-red-600 font-medium">
                  ⚠️ {dateError}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
              שעת האירוע *
            </label>
            <CustomInput
              id="time"
              name="time"
              width="w-full"
              placeholder="20:00"
              value={editableDetails.time}
              onChange={(e) => handleDetailChange("time", e.target.value)}
              error={!!timeError}
            />
            {timeError && (
              <div className="right-0 text-[10px] sm:text-xs text-red-600 font-medium">
                ⚠️ {timeError}
              </div>
            )}
          </div>
        </div>

        <div className="mb-1.5 sm:mb-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
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

        {/* Barcode Field */}
        <div className="mb-1.5 sm:mb-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
            ברקוד כרטיס{" "}
            <span className="text-gray-400 font-normal">(אופציונלי)</span>
          </label>
          <div className="relative">
            <CustomInput
              id="barcode"
              name="barcode"
              width="w-full"
              placeholder={
                editableDetails.barcode
                  ? "ברקוד זוהה אוטומטית ✅"
                  : "לא זוהה ברקוד"
              }
              value={editableDetails.barcode}
              onChange={(e) => handleDetailChange("barcode", e.target.value)}
            />
            {editableDetails.barcode && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                  ✅ זוהה
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Standing Ticket Checkbox */}
        <div className="mb-1.5 sm:mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm sm:checkbox-md"
              checked={editableDetails.isStanding}
              onChange={(e) => handleStandingChange(e.target.checked)}
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              כרטיס עמידה (ללא מקומות ישיבה)
            </span>
          </label>
        </div>

        {/* Seat Information - Hidden when standing ticket */}
        {!editableDetails.isStanding && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                אזור{" "}
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
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

      <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4 pb-2">
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          {/* Primary actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 w-full max-w-[700px] px-2">
            <button
              type="button"
              className={`btn h-[40px] sm:h-[46px] sm:max-w-[180px] w-full sm:w-[180px] min-h-0 btn-secondary text-xs sm:text-sm md:text-text-large font-normal ${
                canProceed
                  ? "bg-secondary text-primary hover:bg-secondary/90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canProceed) {
                  syncAllDetailsAndAddAnother();
                }
              }}
              disabled={!canProceed}
            >
              הוסף כרטיס נוסף
            </button>

            <button
              type="button"
              className={`btn h-[40px] sm:h-[46px] min-h-0 btn-secondary text-xs sm:text-sm md:text-text-large font-normal ${
                canProceed
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canProceed) {
                  syncAllDetailsAndProceed();
                }
              }}
              disabled={!canProceed}
            >
              המשך לפרסום
            </button>

            {/* Back button */}
            <button
              type="button"
              className="btn w-full sm:w-[140px] h-[40px] sm:h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-xs sm:text-sm md:text-text-large font-normal"
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
