"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";
import EmptyImage from "../../../../../public/images/Dialogs/emptyimage.svg";
import ClientSideOCR from "./ClientSideOCR";

const StepOneUploadTicket: React.FC<UploadTicketInterface> = ({
  nextStep,
  ticketData,
  updateTicketData,
}) => {
  const [uploadStatus, setUploadStatus] = useState("לא זוהה קובץ");
  const [showClientOCR, setShowClientOCR] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  /** ===== Vision-first: שימוש במודל AI ישירות על התמונה ===== */
  const tryVisionFirst = async (file: File) => {
    try {
      setUploadStatus("מנתח תמונה עם מודל Vision...");
      const form = new FormData();
      form.append("file", file);
      if (barcode) form.append("barcode", barcode);

      const res = await fetch("api/ocr-extract", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("Vision API error:", res.status, errorText);
        throw new Error(`Vision API failed: ${res.status}`);
      }

      const data = await res.json();

      // אם חזר משהו משמעותי – נעדכן ונדלג על OCR
      const hasAny =
        Object.keys(data || {}).length > 0 &&
        (data.title ||
          data.artist ||
          data.date ||
          data.venue ||
          data.originalPrice ||
          data.barcode);

      if (hasAny) {
        // Check if this is a fallback response (when OpenAI quota is exceeded)
        if (data._fallback) {
          updateTicketData?.({
            extractedText: undefined,
            ticketDetails: {
              title: "",
              artist: "",
              date: "",
              time: "",
              venue: "",
              seat: "",
              row: "",
              section: "",
              barcode: barcode || "",
              originalPrice: undefined,
            },
            isProcessing: false,
            extractionError:
              data._message ||
              "OpenAI quota exceeded - please fill in ticket details manually",
          });
          setUploadStatus("OpenAI quota exceeded - מלא פרטים ידנית");
          return true;
        }

        updateTicketData?.({
          extractedText: undefined, // אין צורך בטקסט גולמי
          ticketDetails: {
            title: data.title || "",
            artist: data.artist || "",
            date: data.date || "",
            time: data.time || "",
            venue: data.venue || "",
            seat: data.seat || "",
            row: data.row || "",
            section: data.section || "",
            barcode: data.barcode || barcode || "",
            originalPrice:
              typeof data.originalPrice === "number"
                ? data.originalPrice
                : undefined,
          },
          isProcessing: false,
          extractionError: undefined,
        });
        setUploadStatus("נותח בהצלחה ע״י מודל Vision ✓");
        setTimeout(() => nextStep && nextStep(), 700);
        return true;
      }

      // Vision didn't extract enough data, try OCR fallback
      setUploadStatus("מודל Vision לא זיהה מספיק נתונים - עובר ל-OCR...");
      return false;
    } catch (error) {
      console.error("Vision API error:", error);
      setUploadStatus("שגיאה במודל Vision - עובר ל-OCR...");
      return false;
    }
  };

  /** ===== OCR (Tesseract) – יופעל רק אם Vision נכשל ===== */
  const preprocessImage = async (file: File): Promise<File> => {
    try {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = url;
      });
      const MAX_W = 1600,
        scale = Math.min(1, MAX_W / img.width);
      const w = Math.round(img.width * scale),
        h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const id = ctx.getImageData(0, 0, w, h),
        d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        const k = Math.max(0, Math.min(255, (g - 128) * 1.1 + 128));
        d[i] = d[i + 1] = d[i + 2] = k;
      }
      ctx.putImageData(id, 0, 0);
      const blob: Blob = await new Promise((r) =>
        c.toBlob((b) => r(b!), "image/jpeg", 0.92)
      );
      URL.revokeObjectURL(url);
      return new File([blob], file.name.replace(/\.\w+$/, "") + "_pp.jpg", {
        type: "image/jpeg",
      });
    } catch {
      return file;
    }
  };

  const detectCurrency = (text: string) => {
    if (text.includes("₪") || text.includes("ILS")) return "שקל ישראלי";
    if (text.includes("$") || text.includes("USD")) return "דולר אמריקאי";
    if (text.includes("€") || text.includes("EUR")) return "יורו";
    if (text.includes("£") || text.includes("GBP")) return 'ליש"ט';
    if (
      text.includes("ישראל") ||
      text.includes("תל אביב") ||
      text.includes("ירושלים") ||
      text.includes("היכל")
    )
      return "שקל ישראלי";
    return "לא ידוע";
  };

  const parseTicketDetails = (text: string) => {
    const out: any = {};

    // Clean text - remove RTL/LTR marks and normalize spaces
    const cleanText = text
      .replace(/[\u200E\u200F\u202A-\u202E\u202C\u202D]/g, "") // Remove directional marks
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();

    const lines = cleanText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Enhanced date patterns for Hebrew tickets
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // DD.MM.YYYY
      /(\d{1,2})\.(\d{1,2})\.(\d{2})(?!\d)/, // DD.MM.YY
      /(\d{2})\/(\d{2})\/(\d{2})(?!\d)/, // DD/MM/YY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})\s*בחודש\s*(\d{1,2})\s*(\d{4})/, // Hebrew date format
    ];

    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let [, day, month, year] = match;
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        out.date = `${day}/${month}/${year}`;
        break;
      }
    }

    // Enhanced time patterns
    const timePatterns = [
      /(\d{1,2}):(\d{2})/, // HH:MM
      /בשעה\s*(\d{1,2}):?(\d{2})/, // Hebrew "at hour"
      /(\d{1,2})\s*:\s*(\d{2})/, // HH : MM (with spaces)
    ];

    for (const pattern of timePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const [, hour, minute] = match;
        out.time = `${hour}:${minute}`;
        break;
      }
    }

    // Enhanced price patterns for Hebrew tickets
    const pricePatterns = [
      /(\d+)\s*₪/g,
      /₪\s*(\d+)/g,
      /(\d+)\s*שח/gi,
      /(\d+)\s*ש"ח/gi,
      /(\d+)\s*שקל/gi,
      /שקל\s*(\d+)/gi,
      /מחיר[:\s]*(\d+)/gi, // Hebrew "price:"
      /(\d+)\s*ILS/gi,
    ];

    const foundPrices: number[] = [];
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const value = parseInt(match[1]);
        if (value >= 10 && value <= 10000) {
          // Extended range
          foundPrices.push(value);
        }
      }
    }

    if (foundPrices.length) {
      // Sort by proximity to typical ticket prices (100-500)
      foundPrices.sort((a, b) => Math.abs(300 - a) - Math.abs(300 - b));
      out.originalPrice = foundPrices[0];
    }

    // Enhanced barcode detection
    const barcodePatterns = [
      /(\d{12,})/, // 12+ digits
      /ברקוד[:\s]*(\d+)/gi, // Hebrew "barcode:"
      /קוד[:\s]*(\d{8,})/gi, // Hebrew "code:"
    ];

    for (const pattern of barcodePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        out.barcode = match[1];
        break;
      }
    }

    // Enhanced venue detection for Israeli venues
    const venuePatterns = [
      /(בלומפילד|היכל התרבות|זאפה|בארבי|לבונטין|היכל|תיאטרון|אצטדיון|מרכז|אולם|פארק|גן)/i,
      /(Bloomfield|Zappa|Barbie|Levontin|Heichal|Theater|Stadium|Center|Hall|Park|Garden)/i,
    ];

    for (const pattern of venuePatterns) {
      const venueLine = lines.find((line) => pattern.test(line));
      if (venueLine) {
        out.venue = venueLine;
        break;
      }
    }

    // Enhanced artist/title detection
    for (const line of lines.slice(0, 8)) {
      // Check more lines
      if (
        line.length >= 3 &&
        !/^\d+$/.test(line) &&
        !line.includes("₪") &&
        !line.includes("שקל")
      ) {
        if (!out.artist) out.artist = line;
        if (!out.title) out.title = line;
        break;
      }
    }

    // Enhanced seat information detection
    const seatPatterns = [
      /(?:מושב|seat|מקום)[\s:]*([A-Z0-9]+)/i,
      /מקום\s*(\d+)/i,
    ];

    for (const pattern of seatPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        out.seat = match[1];
        break;
      }
    }

    const rowPatterns = [/(?:שורה|row)[\s:]*([A-Z0-9]+)/i, /שורה\s*(\d+)/i];

    for (const pattern of rowPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        out.row = match[1];
        break;
      }
    }

    const sectionPatterns = [
      /(?:block|section|איזור|יציע|אזור)[\s:]*([A-Z0-9]+)/i,
      /יציע\s*(\d+)/i,
      /אזור\s*([A-Z0-9]+)/i,
    ];

    for (const pattern of sectionPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        out.section = match[1];
        break;
      }
    }

    return out;
  };

  const analyzeTicketAuthenticity = async (extractedData: any) => {
    try {
      const ocrText = extractedData.ocr_data?.extracted_text || "";
      const currency = extractedData.ocr_data?.currency_detected || "לא ידוע";
      const d = ocrText.match(
        /(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}\.\d{1,2}\.\d{4})|(\d{1,2}-\d{1,2}-\d{4})/
      );
      const eventDate = d ? d[0] : null;
      let authenticityScore = 75,
        status = "valid";
      const risk: string[] = [];
      if (eventDate) {
        const ev = new Date(eventDate.replace(/\./g, "/"));
        if (ev < new Date()) {
          status = "expired";
          authenticityScore = Math.min(authenticityScore, 35);
          risk.push("האירוע כבר התרחש");
        }
      }
      if (extractedData.ocr_data.confidence < 60) {
        authenticityScore -= 10;
        risk.push("איכות זיהוי טקסט נמוכה");
      }
      if (!ocrText.includes("כרטיס") && !ocrText.includes("ticket")) {
        authenticityScore -= 15;
        risk.push("חסרים רכיבי כרטיס בסיסיים");
      }
      return {
        authenticity_score: Math.max(0, authenticityScore),
        status,
        currency,
        risk_flags: risk,
      };
    } catch {
      return {
        authenticity_score: 50,
        status: "unknown",
        currency: "לא ידוע",
        risk_flags: ["שגיאה בניתוח"],
      };
    }
  };

  const processWithOCR = async (file: File) => {
    if (!updateTicketData) return;
    setUploadStatus("מכין מנוע OCR...");
    updateTicketData({ isProcessing: true, extractionError: undefined });

    try {
      isProcessingRef.current = true;
      const prepped = await preprocessImage(file);

      const worker = await Tesseract.createWorker(["heb", "eng"], 1, {
        logger: (m) => {
          if (!isProcessingRef.current) return;
          if (m.status === "recognizing text")
            setUploadStatus(`מזהה טקסט... ${Math.round(m.progress * 100)}%`);
        },
      });
      workerRef.current = worker;

      // Enhanced OCR parameters for better Hebrew text recognition
      await worker.setParameters({
        tessedit_page_seg_mode: "6", // Uniform block of text
        tessedit_ocr_engine_mode: "1", // Neural nets LSTM engine only
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789אבגדהוזחטיכךלמםנןסעפףצץקרשת .,:-₪/()[]{}",
        preserve_interword_spaces: "1",
        tessedit_create_hocr: "0",
        tessedit_create_tsv: "0",
        tessedit_create_boxfile: "0",
        // Hebrew-specific settings
        language_model_penalty_non_freq_dict_word: "0.1",
        language_model_penalty_non_dict_word: "0.15",
        // Improve text recognition
        textord_min_linesize: "2.5",
        textord_old_baselines: "0",
        textord_old_xheight: "0",
        // Better character recognition
        classify_bln_numeric_mode: "0",
        classify_enable_learning: "0",
        classify_enable_adaptive_matcher: "1",
      });
      const {
        data: { text, confidence },
      } = await worker.recognize(prepped);
      if (!isProcessingRef.current) {
        await worker.terminate();
        return;
      }
      const extractedText = (text || "").trim();
      const conf = Math.round(confidence || 0);

      if (extractedText && conf > 30) {
        const parsed = parseTicketDetails(extractedText);
        const auth = await analyzeTicketAuthenticity({
          barcode_data: parsed.barcode || barcode || "",
          ocr_data: {
            extracted_text: extractedText,
            currency_detected: detectCurrency(extractedText),
            confidence: conf,
          },
        });

        // Check if we extracted meaningful data
        const hasMeaningfulData =
          parsed.title ||
          parsed.artist ||
          parsed.date ||
          parsed.venue ||
          parsed.originalPrice ||
          parsed.barcode;

        if (hasMeaningfulData) {
          updateTicketData?.({
            extractedText,
            ticketDetails: {
              ...parsed,
              barcode: parsed.barcode || barcode || "",
            },
            isProcessing: false,
            extractionError: undefined,
          });
          setUploadStatus(`OCR הושלם בהצלחה ✓ (דיוק: ${conf}%)`);
          setTimeout(() => nextStep && nextStep(), 800);
        } else {
          updateTicketData?.({
            isProcessing: false,
            ticketDetails: {
              title: "",
              artist: "",
              date: "",
              time: "",
              venue: "",
              seat: "",
              row: "",
              section: "",
              barcode: barcode || "",
            },
            extractionError:
              "OCR זיהה טקסט אבל לא מצא פרטי כרטיס ברורים - מלא ידנית",
          });
          setUploadStatus("OCR הושלם - מלא פרטים ידנית");
        }
      } else {
        updateTicketData?.({
          isProcessing: false,
          ticketDetails: {
            title: "",
            artist: "",
            date: "",
            time: "",
            venue: "",
            seat: "",
            row: "",
            section: "",
            barcode: barcode || "",
          },
          extractionError:
            conf <= 30
              ? "איכות הטקסט נמוכה מדי (דיוק: " + conf + "%) - מלא פרטים ידנית"
              : "לא זוהה טקסט בתמונה - מלא פרטים ידנית",
        });
        setUploadStatus("תמונה הועלתה - מלא פרטים ידנית");
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      updateTicketData?.({
        isProcessing: false,
        ticketDetails: {
          title: "",
          artist: "",
          date: "",
          time: "",
          venue: "",
          seat: "",
          row: "",
          section: "",
          barcode: barcode || "",
        },
        extractionError:
          error instanceof Error
            ? `שגיאת OCR: ${error.message} - מלא פרטים ידנית`
            : "שגיאת OCR לא ידועה - מלא פרטים ידנית",
      });
      setUploadStatus("שגיאה בעיבוד - מלא פרטים ידנית");
    } finally {
      isProcessingRef.current = false;
      if (workerRef.current) {
        try {
          await workerRef.current.terminate();
        } catch {}
        workerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updateTicketData) return;
    if (!file.type.startsWith("image/")) {
      setUploadStatus("יש לבחור קובץ תמונה");
      return;
    }

    updateTicketData({ uploadedFile: file });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadStatus(`קובץ נבחר: ${file.name}`);

    // נסה קודם Vision
    setUploadStatus("מנתח תמונה עם מודל Vision...");
    updateTicketData({ isProcessing: true });
    const visionSuccess = await tryVisionFirst(file);
    if (!visionSuccess) {
      // פולבק ל-OCR
      await processWithOCR(file);
    }
  };

  // Retry mechanism for failed OCR
  const retryOCR = async () => {
    if (!ticketData?.uploadedFile || !updateTicketData) return;

    setUploadStatus("מנסה שוב לנתח את התמונה...");
    updateTicketData({ isProcessing: true, extractionError: undefined });

    // Try Vision first, then OCR
    const visionSuccess = await tryVisionFirst(ticketData.uploadedFile);
    if (!visionSuccess) {
      await processWithOCR(ticketData.uploadedFile);
      // Show client-side OCR option after server-side OCR fails
      setShowClientOCR(true);
    }
  };

  const handleClientOCRSuccess = (data: any) => {
    console.log("Client OCR extracted:", data);

    // Update ticket data with extracted information
    updateTicketData?.({
      extractedText: undefined,
      ticketDetails: {
        title: data.title || "",
        artist: data.artist || "",
        date: data.date || "",
        time: data.time || "",
        venue: data.venue || "",
        seat: data.seat || "",
        row: data.row || "",
        section: data.section || "",
        barcode: data.barcode || barcode || "",
        originalPrice:
          typeof data.originalPrice === "number"
            ? data.originalPrice
            : undefined,
      },
      isProcessing: false,
      extractionError: undefined,
    });

    setUploadStatus("נותח בהצלחה ע״י OCR ✓");
    setShowClientOCR(false);
    setTimeout(() => nextStep && nextStep(), 700);
  };

  const handleClientOCRError = (error: string) => {
    console.error("Client OCR error:", error);
    setUploadStatus(error);
    setShowClientOCR(false);
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
    <div className="w-full max-w-[668px] mt-6 sm:mt-12 px-4 sm:px-0 mx-auto">
      <p className="text-lg sm:text-heading-5-desktop font-bold">תמונת כרטיס</p>
      <p className="text-sm sm:text-text-medium font-bold">
        גרור או בחר תמונה של הכרטיס מהמכשיר
      </p>
      <p className="text-sm sm:text-text-medium font-light">
        ודא שהתמונה ברורה ושכל פרטי הכרטיס נראים היטב.
      </p>

      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:h-[140px] mt-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              id="fileUpload"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <button
              className="btn btn-secondary border-primary border-[2px] bg-white text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <label className="text-text-large font-normal cursor-pointer">
                בחר קובץ
              </label>
            </button>
            <p
              className={`text-text-medium font-normal ${
                ticketData?.isProcessing
                  ? "text-blue-600"
                  : ticketData?.extractionError
                  ? "text-red-600"
                  : ticketData?.uploadedFile
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {uploadStatus}
            </p>
          </div>

          {ticketData?.isProcessing && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="loading loading-spinner loading-sm"></div>
                <span className="text-sm text-blue-600">מעבד...</span>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  isProcessingRef.current = false;
                  if (workerRef.current) {
                    try {
                      await workerRef.current.terminate();
                    } catch {}
                    workerRef.current = null;
                  }
                  updateTicketData?.({ isProcessing: false });
                  setUploadStatus("מעבר למילוי ידני");
                }}
              >
                דלג על ניתוח
              </button>
            </div>
          )}

          {/* Retry button for failed OCR */}
          {ticketData?.extractionError && !ticketData?.isProcessing && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-orange-600">
                  ⚠️ {ticketData.extractionError}
                </span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={retryOCR}
                disabled={!ticketData?.uploadedFile}
              >
                נסה שוב
              </button>
            </div>
          )}

          {/* Client-side OCR option */}
          {showClientOCR && ticketData?.uploadedFile && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 mb-3">
                💡 נסה OCR מתקדם יותר בדפדפן
              </p>
              <ClientSideOCR
                imageFile={ticketData.uploadedFile}
                onExtract={handleClientOCRSuccess}
                onError={handleClientOCRError}
              />
              <button
                className="btn btn-sm btn-outline mt-2"
                onClick={() => setShowClientOCR(false)}
              >
                ביטול
              </button>
            </div>
          )}
        </div>

        <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Ticket Preview"
              width={120}
              height={120}
              className="object-cover w-full h-full"
            />
          ) : (
            <Image src={EmptyImage} alt="Placeholder" width={80} height={80} />
          )}
        </div>
      </div>

      <div className="border-t-4 mt-6 border-highlight w-full"></div>

      <p className="text-lg sm:text-heading-5-desktop font-bold mt-8 sm:mt-16">
        קוד ידני
      </p>
      <p className="text-sm sm:text-text-medium font-bold">
        הכנס את קוד הברקוד שעל הכרטיס
      </p>
      <p className="text-sm sm:text-text-medium font-light">
        ודא את המספר כמה פעמים לפני שליחה
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6">
        <CustomInput
          name="barcode"
          id="barcode"
          width="w-full sm:w-[392px]"
          placeholder="מספר ברקוד"
          value={barcode}
          onChange={handleBarcodeChange}
        />
        <button
          className="btn btn-secondary border-primary border-[2px] bg-white text-primary"
          onClick={() => {
            if (barcode)
              updateTicketData?.({
                ticketDetails: { ...ticketData?.ticketDetails, barcode },
              });
          }}
        >
          <label className="text-text-large font-normal">העלה כרטיס</label>
        </button>
      </div>

      <div className="border-t-4 mt-6 border-highlight w-full shadow-2xl" />

      <button
        id="nextStep"
        className={`btn w-full max-w-[456px] h-[48px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal mt-8 sm:mt-12 mx-auto block ${
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
