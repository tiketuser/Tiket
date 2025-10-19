// app/api/ocr-extract/route.ts
import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";
import path from "path";

// Initialize Vision API client
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), "creds.json"),
});

interface TicketData {
  artist: string | null;
  price: number | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  seatInfo: {
    seat: string | null;
    row: string | null;
    section: string | null;
  };
}

async function analyzeWithGemini(text: string): Promise<TicketData> {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  
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
            - price: numeric value only (number or null)
            - venue: location name (string or null)
            - date: event date in format "DD MMM" or "DD/MM/YYYY" (string or null)
            - time: event time in format "HH:MM" (string or null)
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
    throw new Error(`Gemini API failed: ${response.status}`);
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
      price: typeof parsed.price === "number" ? parsed.price : null,
      venue: parsed.venue || null,
      date: parsed.date || null,
      time: parsed.time || null,
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
      price: null,
      venue: null,
      date: null,
      time: null,
      seatInfo: { seat: null, row: null, section: null },
    };
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Use visionClient instead of undefined client
    const [result] = await visionClient.textDetection(buffer);
    const fullText = result.textAnnotations?.[0]?.description || "";

    if (!fullText) {
      return NextResponse.json({ error: "No text detected" }, { status: 400 });
    }

    // Then analyze with Gemini
    const ticketData = await analyzeWithGemini(fullText);

    // Add debug logging
    // console.log('Vision API extracted text:', fullText);
    // console.log('Gemini Analysis Result:', JSON.stringify(ticketData, null, 2));

    return NextResponse.json(ticketData);
  } catch (error) {
    console.error("Processing Error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}