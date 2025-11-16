"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";
import EmptyImage from "../../../../../public/images/Dialogs/emptyimage.svg";

const StepOneUploadTicket: React.FC<UploadTicketInterface> = ({
  nextStep,
  ticketData,
  updateTicketData,
}) => {
  const [uploadStatus, setUploadStatus] = useState("לא זוהה קובץ");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const supportedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const fileExtension = file.name.toLowerCase().split(".").pop();
    const supportedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

    // Check both MIME type and file extension
    const isValidMimeType = supportedFormats.includes(file.type);
    const isValidExtension = fileExtension
      ? supportedExtensions.includes(fileExtension)
      : false;

    return isValidMimeType || isValidExtension;
  };

  const processFile = async (file: File) => {
    if (!updateTicketData) return;

    // Validate file type
    if (!validateFileType(file)) {
      setUploadStatus("פורמט קובץ לא נתמך. אנא בחר JPG, PNG או WEBP");
      updateTicketData({
        extractionError: "פורמט קובץ לא נתמך",
        isProcessing: false,
      });
      return;
    }

    // Clear any previous errors
    updateTicketData({ extractionError: undefined });

    // Create preview URL for the uploaded image
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    try {
      setUploadStatus("מעבד את התמונה...");
      updateTicketData({ isProcessing: true });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ocr-extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `OCR failed: ${response.status}`;

        // Show user-friendly error for Gemini API issues
        if (
          errorMessage.includes("temporarily unavailable") ||
          errorMessage.includes("503")
        ) {
          throw new Error(
            "שירות העיבוד זמנית לא זמין. אנא נסה שוב בעוד כמה שניות."
          );
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("StepOne - OCR response data:", data);

      // Update ticket data with the extracted information
      updateTicketData({
        uploadedFile: file,
        ticketDetails: {
          artist: data.artist || "",
          venue: data.venue || "",
          date: data.date || "",
          time: data.time || "",
          seat: data.seatInfo?.seat || "",
          row: data.seatInfo?.row || "",
          section: data.seatInfo?.section || "",
          price: data.price || null,
          barcode: data.barcode || null, // Add barcode to ticket details
        },
        isProcessing: false,
      });

      console.log("StepOne - Updated ticket data with extracted info");

      setUploadStatus("עיבוד הושלם בהצלחה ✓");
      setTimeout(() => nextStep?.(), 700);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "שגיאה בעיבוד";
      setUploadStatus(`${errorMessage} - נסה שוב או מלא ידנית`);
      updateTicketData({ isProcessing: false });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) {
      setUploadStatus("לא נמצא קובץ");
      return;
    }

    // Check if it's an image file
    if (!file.type.startsWith("image/")) {
      setUploadStatus("נא לבחור קובץ תמונה בלבד (JPG, PNG, WEBP)");
      if (updateTicketData) {
        updateTicketData({ extractionError: "קובץ אינו תמונה" });
      }
      return;
    }

    await processFile(file);
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);
    updateTicketData?.({
      ticketDetails: { ...ticketData?.ticketDetails, barcode: value },
    });
  };

  const canProceed = ticketData?.uploadedFile || barcode.length > 0;

  return (
    <div className="w-full max-w-[780px] mt-2 sm:mt-4 px-3 sm:px-4 md:px-0 mx-auto">
      <p className="text-sm sm:text-base md:text-lg font-bold">תמונת כרטיס</p>
      <p className="text-xs sm:text-sm font-bold">
        גרור או בחר תמונה של הכרטיס מהמכשיר
      </p>
      <p className="text-xs sm:text-sm font-light">
        ודא שהתמונה ברורה ושכל פרטי הכרטיס נראים היטב.
      </p>

      {/* Mobile Layout: Button with side preview */}
      <div className="sm:hidden mt-4">
        <div className="flex items-center gap-3">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 w-[90px] h-[27px] max-w-[90px] min-h-0 btn btn-outline border-2 border-primary text-primary bg-white hover:bg-primary hover:text-white text-text-small font-normal"
          >
            בחר קובץ
          </button>

          <input
            ref={fileInputRef}
            type="file"
            id="fileUpload"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          {/* Status Message */}
          <div className="relative -right-[90px] top-10 min-h-[40px]">
            {ticketData?.extractionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs font-semibold text-red-700">⚠️ שגיאה</p>
                <p className="text-[10px] text-red-600 mt-0.5">
                  {uploadStatus}
                </p>
              </div>
            )}

            {!ticketData?.extractionError && (
              <p
                className={`text-xs font-bold ${
                  ticketData?.isProcessing
                    ? "text-blue-600"
                    : ticketData?.uploadedFile
                    ? "text-primary"
                    : "text-gray-500"
                }`}
              >
                {uploadStatus}
              </p>
            )}

            {ticketData?.isProcessing && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="loading loading-spinner loading-sm"></div>
                <span className="text-xs text-blue-600">מעבד את התמונה...</span>
              </div>
            )}
          </div>
          {/* Small Preview */}
          <div className="w-[80px] h-[106px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={EmptyImage}
                alt="Placeholder"
                width={32}
                height={32}
                className="opacity-40"
              />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout: Drag and drop with separate preview */}
      <div className="hidden sm:flex w-full gap-3 sm:gap-4 mt-3 sm:mt-4">
        {/* Upload Controls on the Left */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 md:p-6 transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-gray-100"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-700">
                  {isDragging ? "שחרר כאן" : "גרור ושחרר תמונה"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  או
                </p>
                <button
                  type="button"
                  className="mt-1 sm:mt-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  בחר קובץ
                </button>
              </div>

              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
                קבצים נתמכים: JPG, JPEG, PNG, WEBP
              </p>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center min-h-[40px] sm:min-h-[50px]">
            {ticketData?.extractionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-2.5 mb-2">
                <p className="text-xs sm:text-sm font-semibold text-red-700">
                  ⚠️ שגיאה
                </p>
                <p className="text-[10px] sm:text-xs text-red-600 mt-0.5">
                  {uploadStatus}
                </p>
              </div>
            )}

            {!ticketData?.extractionError && (
              <p
                className={`text-xs sm:text-sm font-bold ${
                  ticketData?.isProcessing
                    ? "text-blue-600"
                    : ticketData?.uploadedFile
                    ? "text-primary"
                    : "text-gray-500"
                }`}
              >
                {uploadStatus}
              </p>
            )}

            {ticketData?.isProcessing && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="loading loading-spinner loading-sm"></div>
                <span className="text-xs sm:text-sm text-blue-600">
                  מעבד את התמונה...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Preview on the Right (Smaller) */}
        <div className="flex-shrink-0 w-full sm:w-[200px] md:w-[240px]">
          <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            תצוגה מקדימה
          </p>
          <div className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Ticket Preview"
                className="object-contain w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Image
                  src={EmptyImage}
                  alt="Placeholder"
                  width={56}
                  height={56}
                  className="sm:w-[64px] sm:h-[64px]"
                />
                <p className="text-[10px] sm:text-xs">טרם הועלתה תמונה</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t-4 mt-6 border-highlight w-full"></div>

      <button
        id="nextStep"
        className={`btn w-full max-w-[456px] h-[42px] sm:h-[44px] min-h-0 btn-secondary text-text-small sm:text-sm md:text-base font-normal mt-3 sm:mt-4 mx-auto block ${
          canProceed && !ticketData?.isProcessing
            ? "bg-primary text-white hover:bg-primary/90"
            : "bg-secondary text-white cursor-not-allowed"
        }`}
        onClick={() => {
          if (canProceed && !ticketData?.isProcessing) nextStep && nextStep();
        }}
        disabled={!canProceed || ticketData?.isProcessing}
      >
        {ticketData?.isProcessing ? "מעבד..." : "לשלב הבא"}
      </button>
    </div>
  );
};

export default StepOneUploadTicket;
