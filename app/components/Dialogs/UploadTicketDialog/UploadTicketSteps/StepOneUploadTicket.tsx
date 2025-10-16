"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  /** ===== Vision-first: שימוש במודל AI ישירות על התמונה ===== */
  const tryVisionFirst = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);
      if (barcode) form.append("barcode", barcode);

      const res = await fetch("api/ocr-extract", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("vision failed");
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
        });
        setUploadStatus("נותח בהצלחה ע״י מודל Vision ✓");
        setTimeout(() => nextStep && nextStep(), 700);
        return true;
      }
      return false;
    } catch {
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
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const full = text
      .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
      .replace(/\s+/g, " ");
    const ds = [
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      /(\d{1,2})\.(\d{1,2})\.(\d{2})(?!\d)/,
      /(\d{2})\/(\d{2})\/(\d{2})(?!\d)/,
      /(\d{4})-(\d{2})-(\d{2})/,
    ];
    for (const p of ds) {
      const m = full.match(p);
      if (m) {
        let [_, a, b, c] = m as any;
        if (c?.length === 2) c = parseInt(c) > 50 ? `19${c}` : `20${c}`;
        out.date = `${a}/${b}/${c}`;
        break;
      }
    }
    const t =
      full.match(/(\d{1,2}):(\d{2})/) || full.match(/בשעה\s*(\d{2})(\d{2})/);
    if (t) out.time = t.length === 3 ? `${t[1]}:${t[2]}` : `${t[1]}:${t[2]}`;
    const pricePats = [
      /(\d+)\s*₪/g,
      /₪\s*(\d+)/g,
      /(\d+)\s*שח/gi,
      /(\d+)\s*ש"ח/gi,
      /(\d+)\s*שקל/gi,
      /שקל\s*(\d+)/gi,
    ];
    const found: number[] = [];
    for (const p of pricePats) {
      let m;
      while ((m = p.exec(full)) !== null) {
        const v = parseInt(m[1]);
        if (v >= 10 && v <= 5000) found.push(v);
      }
    }
    if (found.length) {
      found.sort((a, b) => Math.abs(200 - a) - Math.abs(200 - b));
      out.originalPrice = found[0];
    }
    const bc = full.match(/(\d{12,})/);
    if (bc) out.barcode = bc[1];
    const venue =
      /(בלומפילד|היכל התרבות|זאפה|בארבי|לבונטין|היכל|תיאטרון|אצטדיון)/i;
    const vl = lines.find((l) => venue.test(l));
    if (vl) out.venue = vl;
    for (const l of lines.slice(0, 5)) {
      if (l.length >= 3 && !/^\d+$/.test(l)) {
        out.artist = out.artist || l;
        out.title = out.title || l;
        break;
      }
    }
    const seat = full.match(/(?:מושב|seat)[\s:]*([A-Z0-9]+)/i);
    if (seat) out.seat = seat[1];
    const row = full.match(/(?:שורה|row)[\s:]*([A-Z0-9]+)/i);
    if (row) out.row = row[1];
    const sec = full.match(/(?:block|section|איזור|יציע)[\s:]*([A-Z0-9]+)/i);
    if (sec) out.section = sec[1];
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
      await worker.setParameters({
        tessedit_page_seg_mode: "6",
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789אבגדהוזחטיכךלמםנןסעפףצץקרשת .,:-₪/()",
        preserve_interword_spaces: "1",
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
        updateTicketData?.({
          extractedText,
          ticketDetails: {
            ...parsed,
            barcode: parsed.barcode || barcode || "",
          },
          isProcessing: false,
        });
        setUploadStatus(`בוצע ✓ (OCR: ${conf}%)`);
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
            barcode: "",
          },
          extractionError: "איכות הטקסט נמוכה - מעבר למילוי ידני",
        });
        setUploadStatus("תמונה הועלתה - מלא פרטים ידנית");
      }
    } catch {
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
          barcode: "",
        },
        extractionError: "שגיאת OCR - מלא ידנית",
      });
      setUploadStatus("תמונה הועלתה - מלא פרטים ידנית");
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
    const ok = await tryVisionFirst(file);
    if (!ok) {
      // פולבק ל-OCR
      await processWithOCR(file);
    }
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
