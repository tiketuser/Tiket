import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebaseAdmin";
import { isAdminFromToken } from "../../../lib/firebase-admin";
import { verifyTicket, VerificationRequest, VerificationResponse } from "../../../lib/venueVerify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Venue Ticket Verification API — thin HTTP wrapper around lib/venueVerify.
 *
 * The verification logic lives in lib/venueVerify so it can also be invoked
 * directly (without an HTTP hop) by the server-side ticket-creation route,
 * which is the only path allowed to set a ticket's verification status.
 *
 * This endpoint requires a signed-in user and is rate limited: an anonymous,
 * unlimited endpoint would be a barcode oracle (replay barcodes until one
 * comes back "verified", then list a forged copy of that ticket).
 */

// Instance-local sliding window: uid → request timestamps. Best-effort only
// (each Cloud Run instance counts separately), but it stops casual scripting.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestLog = new Map<string, number[]>();

function isRateLimited(uid: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(uid) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(uid, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(uid, recent);
  // Opportunistic cleanup so the map can't grow unbounded.
  if (requestLog.size > 5000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) requestLog.delete(key);
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth) {
      return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
    }
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let uid: string;
    let isAdmin = false;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
      uid = decoded.uid;
      isAdmin = isAdminFromToken(decoded);
    } catch {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }

    if (!isAdmin && isRateLimited(uid)) {
      return NextResponse.json(
        { error: "יותר מדי בקשות אימות — נסה שוב בעוד מספר דקות" },
        { status: 429 }
      );
    }

    const body: VerificationRequest = await request.json();

    // Targeting a single provider is an admin diagnostic, not a user feature.
    if (!isAdmin) delete body._testProviderId;

    console.log("🔍 Venue Verification Request:", {
      artist: body.artist,
      venue: body.venue,
      date: body.date,
      hasBarcode: !!body.barcode,
      uid,
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
