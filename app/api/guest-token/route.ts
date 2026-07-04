import { NextRequest, NextResponse } from "next/server";
import { issueGuestToken } from "@/lib/guestToken";

/**
 * POST /api/guest-token
 * Issues a short-lived HMAC-signed token for unauthenticated guest checkout.
 * The token replaces bare email strings as the guest identity carrier.
 *
 * Body: { email: string, phone: string }
 * Returns: { guestToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }

    if (!process.env.GUEST_TOKEN_SECRET) {
      console.error("GUEST_TOKEN_SECRET is not configured");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const guestToken = issueGuestToken(email.trim(), phone.trim());
    return NextResponse.json({ guestToken });
  } catch (error) {
    console.error("guest-token error:", error);
    return NextResponse.json({ error: "Failed to issue guest token" }, { status: 500 });
  }
}
