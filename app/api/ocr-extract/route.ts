// app/api/ocr-extract/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const MODEL = process.env.OPENROUTER_VISION_MODEL || "openrouter/openai/gpt-4o-mini";

export async function POST(req: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing");
      return NextResponse.json({ error: "OPENROUTER_API_KEY is missing" }, { status: 500 });
    }
    console.log("OPENROUTER key length:", OPENROUTER_API_KEY.length);

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });

    const file = form.get("file") as File | null;
    const providedBarcode = (form.get("barcode") as string) || "";
    if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;

    // --- קריאת בדיקה ל-/models כדי לאמת AUTH ---
    // Corrected fetch call
    const modelsPing = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`, // Use the key from env
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Tiket OCR Extract",
      },
      cache: "no-store",
    });

    if (!modelsPing.ok) {
      const detail = await modelsPing.text().catch(() => "");
      console.error("OpenRouter /models failed:", modelsPing.status, detail);
      return NextResponse.json(
        { error: "OpenRouter auth failed (/models)", status: modelsPing.status, detail },
        { status: 502 }
      );
    }

    const system = `You extract fields from ticket images. Return ONLY a JSON with:
{
  "title": string|null,
  "artist": string|null,
  "date": string|null,
  "time": string|null,
  "venue": string|null,
  "seat": string|null,
  "row": string|null,
  "section": string|null,
  "barcode": string|null,
  "originalPrice": number|null
}
No extra text. If unknown, null.`;

    const userText = `Extract fields. Prefer dd/mm/yyyy. User barcode: ${providedBarcode || "none"}.`;

    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    };

    // Corrected fetch call
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`, // Use the key from env
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Tiket OCR Extract",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("OpenRouter error:", resp.status, detail);
      return NextResponse.json(
        { error: "OpenRouter error", status: resp.status, detail },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch (e) {
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

    return NextResponse.json(clean, { status: 200 });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}