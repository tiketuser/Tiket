"use client";

import { useState } from "react";

interface ClientSideOCRProps {
  imageFile: File;
  onExtract: (data: any) => void;
  onError: (error: string) => void;
}

export default function ClientSideOCR({
  imageFile,
  onExtract,
  onError,
}: ClientSideOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processWithTesseract = async () => {
    try {
      setIsProcessing(true);
      setProgress(0);

      // Dynamically import Tesseract.js
      const Tesseract = await import("tesseract.js");

      setProgress(10);

      // Create worker with Hebrew and English
      const worker = await Tesseract.createWorker(["heb", "eng"], 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setProgress(20);

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

      setProgress(40);

      // Convert file to blob for Tesseract
      const blob = new Blob([imageFile], { type: imageFile.type });

      const {
        data: { text, confidence },
      } = await worker.recognize(blob);
      await worker.terminate();

      setProgress(90);

      console.log(`OCR completed with confidence: ${confidence}%`);
      console.log("Extracted text:", text);

      if (text && confidence > 30) {
        // Parse the extracted text using enhanced patterns
        const parsed = parseTicketDetailsFromText(text);

        setProgress(100);
        onExtract(parsed);
      } else {
        onError(
          `OCR confidence too low (${confidence}%). Please fill in details manually.`
        );
      }
    } catch (error) {
      console.error("Tesseract OCR error:", error);
      onError("OCR processing failed. Please fill in details manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced parsing function for Hebrew tickets
  function parseTicketDetailsFromText(text: string) {
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

    console.log("Cleaned text:", cleanText);
    console.log("Lines:", lines);

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
      /(בלומפילד|היכל התרבות|זאפה|בארבי|לבונטין|היכל|תיאטרון|אצטדיון|מרכז|אולם|פארק|גן|רמת-גן|ארנה)/i,
      /(Bloomfield|Zappa|Barbie|Levontin|Heichal|Theater|Stadium|Center|Hall|Park|Garden|Arena)/i,
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

    console.log("Parsed data:", out);
    return out;
  }

  return (
    <div className="text-center">
      <button
        onClick={processWithTesseract}
        disabled={isProcessing}
        className="btn btn-primary"
      >
        {isProcessing ? `Processing... ${progress}%` : "Extract Text with OCR"}
      </button>
    </div>
  );
}
