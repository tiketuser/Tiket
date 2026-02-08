// Test endpoint for OpenAI API
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_API_KEY = process.env.REPLICATE_API_KEY || ""; // Same env var but it's actually OpenAI

export async function GET() {
  try {
    console.log("Testing OpenAI API...");
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OPENAI_API_KEY is missing",
        status: "error"
      }, { status: 500 });
    }

    // Test with a simple models call
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return NextResponse.json({
        error: "OpenAI API test failed",
        status: response.status,
        statusText: response.statusText,
        detail: errorText,
        apiKeyLength: OPENAI_API_KEY.length
      }, { status: 502 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: "success",
      message: "OpenAI API is working",
      apiKeyLength: OPENAI_API_KEY.length,
      modelsCount: data.data?.length || 0,
      firstModel: data.data?.[0]?.id || "none"
    });

  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json({
      error: "Test failed",
      message: error.message,
      apiKeyLength: OPENAI_API_KEY.length
    }, { status: 500 });
  }
}
