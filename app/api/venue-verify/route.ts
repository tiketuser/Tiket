import { NextRequest, NextResponse } from "next/server";
import { verifyTicket, VerificationRequest, VerificationResponse } from "../../../lib/venueVerify";

/**
 * Venue Ticket Verification API — thin HTTP wrapper around lib/venueVerify.
 *
 * The verification logic lives in lib/venueVerify so it can also be invoked
 * directly (without an HTTP hop) by the server-side ticket-creation route,
 * which is the only path allowed to set a ticket's verification status.
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerificationRequest = await request.json();

    console.log("🔍 Venue Verification Request:", {
      artist: body.artist,
      venue: body.venue,
      date: body.date,
      hasBarcode: !!body.barcode,
    });

    const result = await verifyTicket(body);
    const httpStatus = result.status === "rejected" && !body.artist ? 400 : 200;
    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error("❌ Verification Error:", error);
    return NextResponse.json(
      {
        verified: false,
        confidence: 0,
        status: "needs_review",
        matchedFields: [],
        unmatchedFields: [],
        reason: "שירות האימות אינו זמין זמנית — נדרשת בדיקה ידנית",
        timestamp: new Date().toISOString(),
      } as VerificationResponse,
      { status: 200 }
    );
  }
}
