import { useState, useEffect } from "react";
import Image from "next/image";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";
import { Calendar } from "@/components/ui/calendar";
import DateIcon from "@/public/images/SearchResult/Date Icon.svg";
import VenueIcon from "@/public/images/SearchResult/Venue Icon.svg";
import { getCategoryConfig, formatSeatLocation as formatSeatUtil } from "@/app/utils/categoryConfig";

interface ExtendedTicketDetails {
  artist: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  seat: string;
  row: string;
  section: string;
  block: string;
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const CATEGORIES = ["מוזיקה", "תיאטרון", "סטנדאפ", "ילדים", "ספורט"];

  const [editableDetails, setEditableDetails] = useState<ExtendedTicketDetails>(
    () => {
      const details = ticketData?.ticketDetails;
      return {
        artist: details?.artist || details?.title || "",
        category: details?.category || "מוזיקה",
        date: details?.date || "",
        time: details?.time || "",
        venue: details?.venue || "",
        seat: details?.seat || "",
        row: details?.row || "",
        section: details?.section || "",
        block: details?.block || "",
        barcode: details?.barcode ? details.barcode.replace(/<NUL>/gi, "").trim() : "",
        isStanding: details?.isStanding || false,
      };
    }
  );

  const [isDateInPast, setIsDateInPast] = useState(false);
  const [dateError, setDateError] = useState<string>("");
  const [timeError, setTimeError] = useState<string>("");

  const [calendarOpen, setCalendarOpen] = useState(false);

  // Parse DD/MM/YYYY → Date object
  const parseDate = (ddmmyyyy: string): Date | undefined => {
    if (!ddmmyyyy) return undefined;
    const parts = ddmmyyyy.split(/[\/\.]/);
    if (parts.length !== 3) return undefined;
    const [d, m, y] = parts;
    const fullYear = y.length <= 2 ? 2000 + parseInt(y) : parseInt(y);
    const date = new Date(fullYear, parseInt(m) - 1, parseInt(d));
    return isNaN(date.getTime()) ? undefined : date;
  };

  // Format Date → DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear());
    return `${d}/${m}/${y}`;
  };

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
        block: details.block || "",
        barcode: details.barcode ? details.barcode.replace(/<NUL>/gi, "").trim() : "",
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
    setEditableDetails((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "category") {
        const newConfig = getCategoryConfig(value);
        if (!newConfig.allowStanding) updated.isStanding = false;
        if (!newConfig.showSection) updated.section = "";
        if (!newConfig.showBlock) updated.block = "";
      }
      return updated;
    });

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
      const extraClears: Record<string, unknown> = {};
      if (field === "category") {
        const newConfig = getCategoryConfig(value);
        if (!newConfig.allowStanding) extraClears.isStanding = false;
        if (!newConfig.showSection) extraClears.section = "";
        if (!newConfig.showBlock) extraClears.block = "";
      }
      updateTicketData({
        ticketDetails: {
          ...ticketData?.ticketDetails,
          [field]: value,
          ...extraClears,
        },
      });
    }
  };

  const handleStandingChange = (checked: boolean) => {
    setEditableDetails((prev) => ({
      ...prev,
      isStanding: checked,
      // Clear seat info when standing is checked
      ...(checked && { seat: "", row: "", section: "", block: "" }),
    }));

    // Update ticket data
    if (updateTicketData) {
      updateTicketData({
        ticketDetails: {
          ...ticketData?.ticketDetails,
          isStanding: checked,
          // Clear seat info when standing is checked
          ...(checked && { seat: "", row: "", section: "", block: "" }),
        },
      });
    }
  };

  const formatSeatLocation = () =>
    formatSeatUtil({
      category: editableDetails.category,
      section: editableDetails.section,
      block: editableDetails.block,
      row: editableDetails.row,
      seat: editableDetails.seat,
      isStanding: editableDetails.isStanding,
    });

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
    <div className="w-full sm:max-h-[600px] sm:overflow-y-auto px-2 sm:px-0">
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
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
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
              image={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              }
            />
          </div>

          <div className="relative">
            <label className="block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 text-gray-700">
              קטגוריה *
            </label>
            <button
              type="button"
              onClick={() => setCategoryOpen((o) => !o)}
              className="w-full py-3 pr-4 pl-4 text-sm sm:text-base border border-gray-300 rounded-lg bg-white flex items-center justify-between"
              dir="rtl"
            >
              <span>{editableDetails.category}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {categoryOpen && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-medium overflow-hidden" dir="rtl">
                {CATEGORIES.map((cat) => (
                  <li
                    key={cat}
                    onClick={() => { handleDetailChange("category", cat); setCategoryOpen(false); }}
                    className={`px-4 py-2.5 text-sm sm:text-base cursor-pointer transition-colors ${
                      editableDetails.category === cat
                        ? "bg-primary text-white font-medium"
                        : "text-strongText hover:bg-secondary/40"
                    }`}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <label
              className={`block text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                dateError ? "text-red-600" : "text-gray-700"
              }`}
            >
              תאריך *
            </label>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              className={`w-full px-4 py-3 text-sm sm:text-base border rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between gap-2 ${
                dateError ? "border-red-400" : "border-gray-300"
              }`}
            >
              <span className={editableDetails.date ? "text-gray-900" : "text-gray-400"}>
                {editableDetails.date || "בחר תאריך"}
              </span>
              <Image src={DateIcon} alt="date" width={16} height={16} className="flex-shrink-0" />
            </button>
            {calendarOpen && (
              <div className="absolute top-full mt-1 right-0 z-30 bg-white border border-gray-200 rounded-lg shadow-lg">
                <Calendar
                  mode="single"
                  selected={parseDate(editableDetails.date)}
                  onSelect={(date) => {
                    if (date) {
                      handleDetailChange("date", formatDate(date));
                    }
                    setCalendarOpen(false);
                  }}
                  defaultMonth={parseDate(editableDetails.date) || new Date()}
                  initialFocus
                />
              </div>
            )}
            {dateError && (
              <div className="text-[10px] text-red-600 font-medium mt-0.5">
                ⚠️ {dateError}
              </div>
            )}
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
              image={
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            {timeError && (
              <div className="right-0 text-[10px] sm:text-xs text-red-600 font-medium">
                ⚠️ {timeError}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <div>
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
              image={<Image src={VenueIcon} alt="venue" width={16} height={16} />}
            />
          </div>

          {/* Barcode Field */}
          <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
            ברקוד כרטיס{" "}
            <span className="text-gray-400 font-normal">(אופציונלי)</span>
          </label>
          <div className="relative">
            <CustomInput
              id="barcode"
              name="barcode"
              width="w-full"
              placeholder="לא זוהה ברקוד"
              value={editableDetails.barcode}
              onChange={(e) => handleDetailChange("barcode", e.target.value)}
            />
          </div>
          </div>
        </div>

        {/* Standing Ticket Checkbox — only for מוזיקה and ספורט */}
        {getCategoryConfig(editableDetails.category).allowStanding && (
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
        )}

        {/* Seat Information - Dynamic based on category */}
        {!editableDetails.isStanding && (() => {
          const config = getCategoryConfig(editableDetails.category);
          const colCount = [config.showSection, config.showBlock, config.showRow, true].filter(Boolean).length;
          const gridClass = colCount === 4 ? "grid-cols-4" : colCount === 3 ? "grid-cols-3" : "grid-cols-2";
          return (
            <div className={`grid ${gridClass} gap-1.5 sm:gap-2 mb-1.5 sm:mb-2`}>
              {config.showSection && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                    {config.sectionLabel}{" "}
                    <span className="text-gray-400 font-normal">(אופציונלי)</span>
                  </label>
                  <CustomInput
                    id="section"
                    name="section"
                    width="w-full"
                    placeholder={editableDetails.section || config.sectionPlaceholder || "ריק"}
                    value={editableDetails.section}
                    onChange={(e) => handleDetailChange("section", e.target.value)}
                  />
                </div>
              )}

              {config.showBlock && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                    גוש{" "}
                    <span className="text-gray-400 font-normal">(אופציונלי)</span>
                  </label>
                  <CustomInput
                    id="block"
                    name="block"
                    width="w-full"
                    placeholder={editableDetails.block || "21"}
                    value={editableDetails.block}
                    onChange={(e) => handleDetailChange("block", e.target.value)}
                  />
                </div>
              )}

              {config.showRow && (
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
              )}

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
          );
        })()}

        {/* Pricing Summary */}
        {ticketData?.pricing && (
          <div className="text-center mb-6">
            <p className="text-primary font-semibold">
              מחיר מבוקש: ₪{ticketData.pricing.askingPrice}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4 pb-4 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 w-full max-w-[700px]">
          {/* On mobile: primary first; on desktop: secondary first to keep visual balance */}
          <button
            type="button"
            className={`btn h-[46px] min-h-0 btn-secondary text-sm font-normal order-1 sm:order-2 ${
              canProceed
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => { if (canProceed) syncAllDetailsAndProceed(); }}
            disabled={!canProceed}
          >
            המשך לפרסום
          </button>

          <button
            type="button"
            className={`btn h-[46px] sm:max-w-[180px] w-full sm:w-[180px] min-h-0 btn-secondary text-sm font-normal order-2 sm:order-1 ${
              canProceed
                ? "bg-secondary text-primary hover:bg-secondary/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => { if (canProceed) syncAllDetailsAndAddAnother(); }}
            disabled={!canProceed}
          >
            הוסף כרטיס נוסף
          </button>

          <button
            type="button"
            className="btn w-full sm:w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm font-normal order-3"
            onClick={() => prevStep && prevStep()}
          >
            לשלב הקודם
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepThreeUploadTicket;
