// Test endpoint for Replicate API
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || "";

export async function GET() {
  try {
    console.log("Testing Replicate API...");
    
    if (!REPLICATE_API_KEY) {
      return NextResponse.json({ 
        error: "REPLICATE_API_KEY is missing",
        status: "error"
      }, { status: 500 });
    }

    // Test with a simple models call
    const response = await fetch("https://api.replicate.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Token ${REPLICATE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return NextResponse.json({
        error: "Replicate API test failed",
        status: response.status,
        statusText: response.statusText,
        detail: errorText,
        apiKeyLength: REPLICATE_API_KEY.length
      }, { status: 502 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: "success",
      message: "Replicate API is working",
      apiKeyLength: REPLICATE_API_KEY.length,
      modelsCount: data.results?.length || 0,
      firstModel: data.results?.[0]?.name || "none"
    });

  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json({
      error: "Test failed",
      message: error.message,
      apiKeyLength: REPLICATE_API_KEY.length
    }, { status: 500 });
  }
}
