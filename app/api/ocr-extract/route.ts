// app/api/ocr-extract/route.ts
import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import { readBarcodes } from "zxing-wasm/reader";
import sharp from "sharp";

// Use Application Default Credentials (ADC) — works automatically on Cloud Run
// via the attached service account, and locally via GOOGLE_APPLICATION_CREDENTIALS
const visionClient = new vision.ImageAnnotatorClient();

interface TicketData {
  artist: string | null;
  category: string | null;
  price: number | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  barcode: string | null; // Add barcode field
  seatInfo: {
    seat: string | null;
    row: string | null;
    section: string | null;
  };
}

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const is429 = error.message?.includes("429");
      const isRetryableError =
        is429 ||
        error.message?.includes("503") ||
        error.message?.includes("500") ||
        error.message?.includes("timeout");

      if (!isRetryableError || attempt === maxRetries - 1) {
        throw error;
      }

      // For 429, use a longer delay (API suggests ~36s); otherwise exponential backoff
      const delay = is429
        ? 40000 // 40 seconds for rate limiting
        : initialDelay * Math.pow(2, attempt);
      console.log(
        `Gemini API error (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

// Models to try in order (fallback if quota is exceeded on primary)
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];


// Convert ALL CAPS English names to Title Case; leave Hebrew untouched
function normalizeName(name: string | null): string | null {
  if (!name) return null;
  // Only apply if the string is all uppercase English letters (and spaces/punctuation)
  if (/^[A-Z][A-Z\s\-&'.]+$/.test(name.trim())) {
    return name
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
}

async function analyzeWithGemini(text: string): Promise<TicketData> {
  // Try each model; if one hits quota limits, try the next
  for (const model of GEMINI_MODELS) {
    try {
      return await analyzeWithModel(text, model);
    } catch (error: any) {
      const isQuotaError = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuotaError && model !== GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
        console.log(`⚠️ Quota exceeded for ${model}, falling back to next model...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("All Gemini models failed");
}

async function analyzeWithModel(text: string, model: string): Promise<TicketData> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  return retryWithBackoff(async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
              Extract ticket information from this Israeli event ticket text (may be in Hebrew, English, or mixed).
              Return ONLY a raw JSON object (no markdown, no backticks, no explanation) with exactly these fields:

              - artist: the main event or performer name (string or null).
                Prefer the largest/most prominent text. For sports, use "Team A vs Team B" format.
                If the name is in ALL CAPS (e.g. "OMER ADAM"), convert it to title case (e.g. "Omer Adam").
                Do not include the venue or date in this field.

              - category: classify the event. Must be exactly one of:
                "מוזיקה" (concerts, music events),
                "תיאטרון" (theater, opera, dance, musicals),
                "סטנדאפ" (stand-up comedy, improv),
                "ילדים" (children's shows),
                "ספורט" (sports: football, basketball, tennis, etc.).
                Default to "מוזיקה" if unclear.

              - price: the face value / original ticket price as a number only (number or null).
                Look for labels like: מחיר, מחיר כרטיס, סכום, ₪, NIS.
                Ignore service fees or totals if multiple prices appear — take the base ticket price.

              - venue: the venue/arena/stadium name only (string or null).
                Look for labels like: מיקום, אולם, אצטדיון, היכל.
                Do not include the city name unless it is part of the official venue name.

              - date: the event date as "DD/MM/YYYY" (string or null).
                Israeli tickets always use DD/MM/YYYY or DD.MM.YY format (day first, then month).
                NEVER swap day and month — if the ticket shows "6.8.25" the date is 06/08/2025, NOT 08/06/2025.
                If the year is 2 digits (e.g. "25"), expand to full year (e.g. "2025").
                Look for labels like: תאריך, דצמ, ינו, פבר, מרץ, אפר, מאי, יונ, יול, אוג, ספט, אוקט, נוב, or month names in English.
                If only day and month are visible (no year), infer the most upcoming future year.

              - time: the event start time as "HH:MM" (string or null).
                Look for labels like: שעה, כניסה, התחלה. Use 24-hour format.

              - barcode: always return null.

              - seatInfo: object with these three fields (all string or null):
                - seat: seat/chair number. Hebrew labels: כיסא, מושב, מקום. Return the value only (e.g. "12").
                - row: row number or letter. Hebrew labels: שורה, טור. Return the value only (e.g. "5" or "C").
                - section: section, zone, or stand. Hebrew labels: אזור, יציע, טריבונה, גזרה, מרפסת, קומה. English: "Floor", "VIP", "A", "B". Return the value only (e.g. "יציע מזרח" or "VIP").
                If the ticket says עמידה or standing, set all three to null.

              Input text:
              ${text}
            `
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 16,
          topP: 0.1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up the response if it contains markdown or extra formatting
    jsonString = jsonString
      .replace(/```json\n?/, '')  // Remove markdown JSON indicator at start
      .replace(/```\n?$/, '')     // Remove closing backticks
      .trim();                    // Remove extra whitespace

    try {
      const parsed = JSON.parse(jsonString);
      return {
        artist: normalizeName(parsed.artist || null),
        category: parsed.category || "מוזיקה",
        price: typeof parsed.price === "number" ? parsed.price : null,
        venue: parsed.venue || null,
        date: parsed.date || null,
        time: parsed.time || null,
        barcode: null, // always null; barcode detected visually via zxing-wasm
        seatInfo: {
          seat: parsed.seatInfo?.seat || null,
          row: parsed.seatInfo?.row || null,
          section: parsed.seatInfo?.section || null,
        },
      };
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      console.error("Raw response:", jsonString);
      return {
        artist: null,
        category: null,
        price: null,
        venue: null,
        date: null,
        time: null,
        barcode: null,
        seatInfo: { seat: null, row: null, section: null },
      };
    }
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Step 1: Extract text using Vision API
    const [textResult] = await visionClient.textDetection(buffer);
    const fullText = textResult.textAnnotations?.[0]?.description || "";

    if (!fullText) {
      return NextResponse.json({ error: "No text detected" }, { status: 400 });
    }

    // Step 2: Detect and decode visual barcodes/QR codes using zxing-wasm
    // Supports QR Code, Code-128, EAN-13, PDF-417, and more — no native deps
    let detectedBarcode: string | null = null;
    try {
      // sharp decodes the image to raw RGBA pixels that zxing-wasm can process
      const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const imageData = {
        data: new Uint8ClampedArray(data.buffer),
        width: info.width,
        height: info.height,
      };

      const results = await readBarcodes(imageData as ImageData, {
        tryHarder: true,
        formats: [],  // empty = try all formats
      });

      if (results.length > 0 && results[0].isValid) {
        detectedBarcode = results[0].text
          .replace(/<NUL>/gi, "")
          .trim();
        console.log(`✅ Detected visual barcode: ${detectedBarcode} (format: ${results[0].format})`);
      } else {
        console.log("No visual barcode detected in image");
      }
    } catch (error) {
      console.warn("Visual barcode detection failed, continuing without barcode:", error);
    }

    // Step 3: Analyze with Gemini (with retry logic)
    const ticketData = await analyzeWithGemini(fullText);

    // Step 4: Override with detected barcode if found
    if (detectedBarcode && !ticketData.barcode) {
      ticketData.barcode = detectedBarcode;
    }

    // Add debug logging
    console.log('Vision API extracted text length:', fullText.length);
    console.log('Detected barcode:', detectedBarcode);
    console.log('Gemini Analysis Result:', JSON.stringify(ticketData, null, 2));

    return NextResponse.json(ticketData);
  } catch (error: any) {
    console.error("Processing Error:", error);
    
    // Return more specific error message
    const errorMessage = error.message?.includes("Gemini API failed")
      ? "Gemini API is temporarily unavailable. Please try again in a moment."
      : "Failed to process image";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    );
  }
}