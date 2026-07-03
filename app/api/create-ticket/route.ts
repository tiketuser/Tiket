import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyTicket } from "@/lib/venueVerify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Statuses that mean a ticket still occupies its barcode (i.e. blocks a
// duplicate listing). Rejected/cancelled tickets free the barcode.
const LIVE_STATUSES = ["available", "reserved", "sold", "pending_approval", "pending"];

/**
 * Server-authoritative ticket creation.
 *
 * This is the ONLY path allowed to create a ticket — Firestore rules block
 * direct client writes. The server:
 *   1. authenticates the seller from their ID token (client-supplied sellerId
 *      is ignored),
 *   2. enforces barcode uniqueness inside a transaction (no double-listing),
 *   3. re-runs verification server-side (the client cannot declare its own
 *      verification result),
 *   4. sets status/verificationStatus from that authoritative result.
 */
export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: "Server services not available" }, { status: 503 });
    }

    // ── Auth ──
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let sellerUid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
      sellerUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }

    const body = await request.json();
    const t = body?.ticket;
    if (!t || typeof t !== "object") {
      return NextResponse.json({ error: "Missing ticket data" }, { status: 400 });
    }

    // ── Validate the seller-controlled fields we trust ──
    const askingPrice = Number(t.askingPrice);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      return NextResponse.json({ error: "מחיר לא תקין" }, { status: 400 });
    }

    const barcode: string | null = t.barcode ? String(t.barcode) : null;

    // ── Server-side verification (authoritative) ──
    // Full-detail listings (desktop OCR flow) are verified against the venue
    // providers. Minimal quick-sell listings (mobile flow) lack artist/venue/
    // date, so there is nothing to verify — they go straight to admin review.
    const hasVerifiableDetails = Boolean(t.artist && t.venue && t.date);
    const verification = hasVerifiableDetails
      ? await verifyTicket({
          barcode: barcode ?? undefined,
          artist: String(t.artist),
          eventName: t.eventName ? String(t.eventName) : undefined,
          venue: String(t.venue),
          date: String(t.date),
          time: t.time ? String(t.time) : undefined,
          section: t.section ? String(t.section) : undefined,
          row: t.row ? String(t.row) : undefined,
          seat: t.seat ? String(t.seat) : undefined,
          isStanding: Boolean(t.isStanding),
        })
      : {
          verified: false,
          confidence: 0,
          status: "needs_review" as const,
          matchedFields: [],
          unmatchedFields: [],
          reason: "נשלח לאימות ידני על ידי הצוות",
          timestamp: new Date().toISOString(),
        };

    const status =
      verification.status === "verified"
        ? "available"
        : verification.status === "needs_review"
        ? "pending_approval"
        : "rejected";

    const ticketDoc: Record<string, unknown> = {
      eventId: t.eventId || null,
      artist: t.artist || "",
      category: t.category || "מוזיקה",
      date: t.date,
      time: t.time || "",
      venue: t.venue || "",
      section: t.section || "",
      block: t.block || "",
      row: t.row || "",
      seat: t.seat || "",
      barcode,
      isStanding: Boolean(t.isStanding),
      askingPrice,
      originalPrice: t.originalPrice ?? null,
      allowPriceSuggestions: Boolean(t.allowPriceSuggestions),
      minPrice: t.minPrice ?? null,
      maxPrice: t.maxPrice ?? null,
      extractedText: t.extractedText ?? null,
      ticketImage: t.ticketImage ?? null,
      // Server-controlled fields — never taken from the client:
      status,
      verificationStatus: verification.status,
      verificationConfidence: verification.confidence,
      verificationDetails: {
        matchedFields: verification.matchedFields,
        unmatchedFields: verification.unmatchedFields,
        officialTicketId: verification.details?.officialTicketId || null,
        eventId: verification.details?.eventId || null,
        ticketingSystem: verification.details?.ticketingSystem || null,
        reason: verification.reason,
      },
      verificationTimestamp: new Date(),
      createdAt: new Date(),
      sellerId: sellerUid,
      bundleId: t.bundleId ?? null,
      canSplit: t.bundleId ? Boolean(t.canSplit) : null,
      bundleSize: t.bundleId ? (t.bundleSize ?? null) : null,
    };

    // ── Uniqueness + create in one transaction ──
    const ticketsCol = adminDb.collection("tickets");
    const newRef = ticketsCol.doc();

    try {
      await adminDb.runTransaction(async (tx) => {
        if (barcode) {
          // Query by barcode only (single-field index, always available) and
          // filter live statuses in code. Avoids a composite-index dependency,
          // so this works without deploying anything to the shared Firestore.
          const dupSnap = await tx.get(ticketsCol.where("barcode", "==", barcode));
          const clash = dupSnap.docs.some((d) =>
            LIVE_STATUSES.includes((d.data().status as string) ?? "")
          );
          if (clash) {
            throw Object.assign(new Error("DUPLICATE"), { code: 409 });
          }
        }
        tx.set(newRef, ticketDoc);
      });
    } catch (txErr) {
      if ((txErr as Error).message === "DUPLICATE") {
        return NextResponse.json(
          { error: "כרטיס עם ברקוד זה כבר קיים במערכת", code: "DUPLICATE" },
          { status: 409 }
        );
      }
      throw txErr;
    }

    // ── Seed mock_tickets for future duplicate detection (server-side; the
    // client cannot write this collection). Best-effort. ──
    if (barcode) {
      try {
        await adminDb.collection("mock_tickets").add({
          barcode,
          artistName: ticketDoc.artist,
          venueName: ticketDoc.venue,
          eventDate: ticketDoc.date,
          eventTime: ticketDoc.time,
          section: ticketDoc.section,
          row: ticketDoc.row,
          seat: ticketDoc.seat,
          seatType: ticketDoc.isStanding ? "standing" : "seated",
          originalPrice: ticketDoc.originalPrice || askingPrice,
          eventName: ticketDoc.artist,
          eventId: ticketDoc.eventId || "",
          createdAt: new Date(),
        });
      } catch (err) {
        console.warn("[create-ticket] mock_tickets seed failed:", err);
      }
    }

    if (status === "available" && t.artist) {
      revalidatePath(`/EventPage/${encodeURIComponent(String(t.artist))}`);
    }

    return NextResponse.json({
      id: newRef.id,
      status,
      verificationStatus: verification.status,
      confidence: verification.confidence,
      reason: verification.reason,
      matchedFields: verification.matchedFields,
      unmatchedFields: verification.unmatchedFields,
      details: verification.details,
    });
  } catch (error) {
    console.error("create-ticket error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create ticket" },
      { status: 500 }
    );
  }
}
