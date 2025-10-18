// app/api/ocr-extract/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_API_KEY = process.env.REPLICATE_API_KEY || ""; // Using the same env var but it's actually OpenAI
const MODEL = "gpt-4o-mini"; // OpenAI's vision model

// Image preprocessing function for better OCR
async function preprocessImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // For now, return the original buffer
    // In production, you might want to use sharp or canvas for image preprocessing
    return imageBuffer;
  } catch (error) {
    console.error("Image preprocessing error:", error);
    return imageBuffer; // Return original if preprocessing fails
  }
}

// Enhanced Tesseract OCR fallback function
async function processWithEnhancedTesseract(imageBuffer: Buffer, providedBarcode: string) {
  try {
    console.log("Processing with enhanced Tesseract OCR...");
    
    // For server-side, we'll use a simpler approach that doesn't require worker threads
    // This is a fallback that returns basic structure for manual input
    console.log("Server-side OCR fallback - returning structure for manual input");
    
    // Try to extract basic information from the image using a simple approach
    // This is a placeholder for better OCR implementation
    const extractedData = await extractBasicTicketInfo(imageBuffer);
    
    // Return a basic structure that allows manual input
    const fallbackData = {
      title: extractedData.title || null,
      artist: extractedData.artist || null,
      date: extractedData.date || null,
      time: extractedData.time || null,
      venue: extractedData.venue || null,
      seat: extractedData.seat || null,
      row: extractedData.row || null,
      section: extractedData.section || null,
      barcode: providedBarcode || extractedData.barcode || null,
      originalPrice: extractedData.originalPrice || null,
      _fallback: true,
      _message: "OCR processing requires client-side implementation. Please fill in ticket details manually."
    };

    console.log("Returning fallback structure for manual input");
    return NextResponse.json(fallbackData, { status: 200 });
    
  } catch (error) {
    console.error("OCR fallback error:", error);
    return NextResponse.json({ 
      error: "OCR processing failed", 
      _fallback: true,
      _message: "Please fill in ticket details manually."
    }, { status: 200 }); // Return 200 to allow manual input
  }
}

// Basic ticket info extraction (placeholder for better OCR)
async function extractBasicTicketInfo(imageBuffer: Buffer) {
  try {
    // This is a placeholder function that would use a proper OCR library
    // For now, we'll return empty data to encourage manual input
    console.log("Extracting basic ticket info from image...");
    
    // In a real implementation, you would:
    // 1. Use a proper OCR library like Tesseract.js (client-side)
    // 2. Or use a cloud OCR service like Google Vision API
    // 3. Or use a specialized ticket OCR service
    
    // For now, return empty structure
    return {
      title: null,
      artist: null,
      date: null,
      time: null,
      venue: null,
      seat: null,
      row: null,
      section: null,
      barcode: null,
      originalPrice: null
    };
  } catch (error) {
    console.error("Basic extraction error:", error);
    return {
      title: null,
      artist: null,
      date: null,
      time: null,
      venue: null,
      seat: null,
      row: null,
      section: null,
      barcode: null,
      originalPrice: null
    };
  }
}

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
    if (line.length >= 3 && !/^\d+$/.test(line) && !line.includes("₪") && !line.includes("שקל")) {
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
}

export async function POST(req: Request) {
  console.log("OCR API called");
  
  try {
    // Parse form data
    const form = await req.formData().catch((error) => {
      console.error("Form data parsing error:", error);
      return null;
    });
    
    if (!form) {
      console.error("Failed to parse form data");
      return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
    }

    const file = form.get("file") as File | null;
    const providedBarcode = (form.get("barcode") as string) || "";
    
    if (!file) {
      console.error("No file provided");
      return NextResponse.json({ error: "missing file" }, { status: 400 });
    }

    console.log("File received:", file.name, file.size, "bytes");

    // Process image
    const buf = Buffer.from(await file.arrayBuffer());
    const processedImage = await preprocessImageForOCR(buf);
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${processedImage.toString("base64")}`;
    
    console.log("Image processed, data URL length:", dataUrl.length);

    // Check if we should use OpenAI or fallback to enhanced Tesseract
    const useOpenAI = OPENAI_API_KEY && OPENAI_API_KEY.length > 0;
    
    if (useOpenAI) {
      console.log("Making API call to OpenAI...");
      console.log("Model:", MODEL);
      console.log("API Key (first 10 chars):", OPENAI_API_KEY.substring(0, 10) + "...");

      // Prepare OpenAI API call
      const openaiBody = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
              {
                type: "text",
                text: `Extract ticket information from this image. Focus on Hebrew text and Israeli venues. Return ONLY a JSON object with these fields: title, artist, date, time, venue, seat, row, section, barcode, originalPrice. Use null for missing values. User provided barcode: ${providedBarcode || "none"}.`
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.2
      };

      console.log("OpenAI body size:", JSON.stringify(openaiBody).length);

      // Make the API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
          body: JSON.stringify(openaiBody),
      cache: "no-store",
          signal: controller.signal,
    });

        clearTimeout(timeoutId);

    if (!resp.ok) {
          const detail = await resp.text().catch(() => "No error details");
          console.error("OpenAI API error:", resp.status, resp.statusText, detail);
          
          // If quota exceeded, fall back to Tesseract
          if (resp.status === 429) {
            console.log("OpenAI quota exceeded, falling back to enhanced Tesseract OCR...");
            return await processWithEnhancedTesseract(buf, providedBarcode);
          }
          
          // Return more specific error information
      return NextResponse.json(
            { 
              error: "OpenAI API error", 
              status: resp.status, 
              statusText: resp.statusText,
              detail: detail.substring(0, 500) // Limit detail length
            },
        { status: 502 }
      );
    }

        console.log("API call successful, parsing response...");
    const data = await resp.json();
        console.log("Response received, processing...");

    const content = data?.choices?.[0]?.message?.content || "{}";
        console.log("Content received:", content.substring(0, 200) + "...");

    let parsed: any = {};
        try { 
          parsed = JSON.parse(content); 
          console.log("JSON parsed successfully:", Object.keys(parsed));
        } catch (e) {
      console.error("JSON parse error:", e, content);
      parsed = {};
    }

    if (providedBarcode && (!parsed.barcode || parsed.barcode === "null")) {
      parsed.barcode = providedBarcode;
    }

    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== null && v !== undefined && v !== "") {
        clean[k] = k === "originalPrice" ? Number(v) : v;
      }
    }

        console.log("Returning clean data:", Object.keys(clean));
    return NextResponse.json(clean, { status: 200 });

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error("OpenAI fetch error:", fetchError);
        
        if (fetchError.name === 'AbortError') {
          console.log("OpenAI timeout, falling back to enhanced Tesseract OCR...");
          return await processWithEnhancedTesseract(buf, providedBarcode);
        }
        
        console.log("OpenAI error, falling back to enhanced Tesseract OCR...");
        return await processWithEnhancedTesseract(buf, providedBarcode);
      }
    } else {
      console.log("No OpenAI API key, using enhanced Tesseract OCR...");
      return await processWithEnhancedTesseract(buf, providedBarcode);
    }

  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}