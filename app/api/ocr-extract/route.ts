// app/api/ocr-extract/route.ts
import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import path from "path";
import fs from "fs";

// Initialize Vision API client with credentials
function createVisionClient() {
  // Try multiple possible paths for creds.json
  const possiblePaths = [
    path.join(process.cwd(), "creds.json"),
    path.join(process.cwd(), "app", "creds.json"),
  ];

  for (const credPath of possiblePaths) {
    if (fs.existsSync(credPath)) {
      console.log(`Using credentials from: ${credPath}`);
      const credentials = JSON.parse(fs.readFileSync(credPath, "utf-8"));
      return new vision.ImageAnnotatorClient({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        projectId: credentials.project_id,
      });
    }
  }

  // Fallback: let it use GOOGLE_APPLICATION_CREDENTIALS env var or ADC
  console.warn("No creds.json found, falling back to application default credentials");
  return new vision.ImageAnnotatorClient();
}

const visionClient = createVisionClient();

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
              Extract ticket information from this text.
              Return a JSON object (no markdown, no backticks) with these fields:
              - artist: name of performer or event (string or null)
              - category: classify the event type. Must be one of: "מוזיקה" (music concerts), "תיאטרון" (theater/plays), "סטנדאפ" (stand-up comedy), "ילדים" (kids shows), "ספורט" (sports events). Default to "מוזיקה" if unsure.
              - price: numeric value only (number or null)
            - venue: location name (string or null)
            - date: event date in format "DD MMM" or "DD/MM/YYYY" (string or null)
            - time: event time in format "HH:MM" (string or null)
            - barcode: ticket barcode/serial number if visible (string or null)
            - seatInfo: object with seat, row, section (all string or null)

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
        artist: parsed.artist || null,
        category: parsed.category || "מוזיקה",
        price: typeof parsed.price === "number" ? parsed.price : null,
        venue: parsed.venue || null,
        date: parsed.date || null,
        time: parsed.time || null,
        barcode: parsed.barcode || null,
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

    // Step 2: Detect barcodes using Vision API
    let detectedBarcode: string | null = null;
    try {
      const [barcodeResult] = await visionClient.textDetection(buffer);
      
      // Try to find barcode in the detected text
      // Barcodes are typically long numeric strings (12-13 digits for EAN/UPC, or alphanumeric)
      const barcodePatterns = [
        /\b\d{12,13}\b/g,           // EAN-13, UPC-A (12-13 digits)
        /\b[A-Z0-9]{8,20}\b/g,      // Alphanumeric codes (8-20 chars)
        /\b\d{8,}\b/g,              // Any long numeric string (8+ digits)
      ];

      for (const pattern of barcodePatterns) {
        const matches = fullText.match(pattern);
        if (matches && matches.length > 0) {
          // Take the longest match as it's likely the barcode
          detectedBarcode = matches.reduce((a, b) => a.length > b.length ? a : b);
          console.log(`✅ Detected barcode: ${detectedBarcode}`);
          break;
        }
      }
    } catch (error) {
      console.warn("Barcode detection failed, continuing without barcode:", error);
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