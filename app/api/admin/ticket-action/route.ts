import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyAdminToken } from "../../../../lib/firebase-admin";
import { verifyTicket } from "../../../../lib/venueVerify";
import { resolveBuyerContact, transferTicketOwnership } from "../../../../lib/venueTransfer";

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { isValid, isAdmin } = await verifyAdminToken(token);
    if (!isValid || !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, ticketIds, adminComment, eventId } = body;

    if (!action || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    if (action === "reverify") {
      // Re-run provider verification for tickets stuck in review (e.g. they
      // were uploaded before the relevant provider was configured). A fresh
      // "verified" upgrades the ticket automatically — the provider vouched
      // for it. A fresh rejection only updates the verification fields; the
      // final rejection stays a human decision since the admin is looking at
      // the actual ticket right now.
      const results: Array<Record<string, unknown>> = [];
      for (const id of ticketIds) {
        const ref = db.collection("tickets").doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
          results.push({ id, error: "not_found" });
          continue;
        }
        const t = snap.data()!;
        if (!t.artist || !t.venue || !t.date) {
          results.push({ id, error: "unverifiable", reason: "לכרטיס חסרים פרטי אירוע — אין מול מה לאמת" });
          continue;
        }

        const verification = await verifyTicket({
          barcode: t.barcode || undefined,
          artist: String(t.artist),
          eventName: t.eventName ? String(t.eventName) : undefined,
          venue: String(t.venue),
          date: String(t.date),
          time: t.time ? String(t.time) : undefined,
          section: t.section ? String(t.section) : undefined,
          row: t.row ? String(t.row) : undefined,
          seat: t.seat ? String(t.seat) : undefined,
          isStanding: Boolean(t.isStanding),
        });

        const upgraded = verification.status === "verified" && !!t.eventId;
        await ref.update({
          verificationStatus: verification.status,
          verificationConfidence: verification.confidence,
          verificationDetails: {
            matchedFields: verification.matchedFields,
            unmatchedFields: verification.unmatchedFields,
            officialTicketId: verification.details?.officialTicketId || null,
            eventId: verification.details?.eventId || null,
            ticketingSystem: verification.details?.ticketingSystem || null,
            providerId: verification.details?.providerId || null,
            originalPrice: verification.details?.originalPrice ?? null,
            reason: verification.reason,
          },
          verificationTimestamp: new Date(),
          ...(upgraded ? { status: "available" } : {}),
        });

        results.push({
          id,
          verificationStatus: verification.status,
          confidence: verification.confidence,
          reason: verification.reason,
          matchedFields: verification.matchedFields,
          unmatchedFields: verification.unmatchedFields,
          originalPrice: verification.details?.originalPrice ?? null,
          ticketingSystem: verification.details?.ticketingSystem ?? null,
          statusChanged: upgraded,
          newStatus: upgraded ? "available" : t.status,
        });
      }
      return NextResponse.json({ success: true, results });
    }

    if (action === "transfer") {
      // Manual (re-)trigger of provider ownership transfer for sold tickets —
      // used when the automatic post-sale attempt failed or the provider was
      // connected after the sale.
      const results: Array<Record<string, unknown>> = [];
      for (const id of ticketIds) {
        const snap = await db.collection("tickets").doc(id).get();
        const t = snap.data();
        if (!t) {
          results.push({ id, error: "not_found" });
          continue;
        }
        if (t.status !== "sold") {
          results.push({ id, error: "not_sold", reason: "העברת בעלות אפשרית רק לכרטיס שנמכר" });
          continue;
        }
        if (t.ownershipTransfer?.status === "transferred") {
          results.push({ id, status: "transferred", alreadyTransferred: true });
          continue;
        }

        // Reconstruct the buyer: registered uid, or guest via the transaction
        // record (which holds the guest's email/phone and the PaymentIntent).
        const soldTo: string = t.soldTo || "";
        const isGuest = soldTo.startsWith("guest:");
        let guestPhone: string | null = null;
        let paymentIntentId: string | null = null;
        try {
          const txSnap = await db
            .collection("transactions")
            .where("ticketId", "==", id)
            .where("status", "==", "completed")
            .limit(1)
            .get();
          const tx = txSnap.docs[0]?.data();
          guestPhone = tx?.guestPhone || null;
          paymentIntentId = tx?.stripePaymentIntentId || null;
        } catch {
          // transaction lookup is best-effort
        }

        const buyer = await resolveBuyerContact({
          buyerId: isGuest ? null : soldTo || null,
          guestEmail: isGuest ? soldTo.slice("guest:".length) : null,
          guestPhone,
        });

        const transferRef: string =
          t.ownershipTransfer?.transferRef ||
          (paymentIntentId ? `TIKET-${paymentIntentId}-${id}` : `TIKET-MANUAL-${id}`);

        const outcome = await transferTicketOwnership(id, t, buyer, transferRef);
        results.push({ id, ...outcome });
      }
      return NextResponse.json({ success: true, results });
    }

    const batch = db.batch();

    if (action === "approve") {
      for (const id of ticketIds) {
        batch.update(db.collection("tickets").doc(id), { status: "available" });
      }
    } else if (action === "reject") {
      for (const id of ticketIds) {
        batch.update(db.collection("tickets").doc(id), {
          status: "rejected",
          verificationStatus: "rejected",
          adminComment: adminComment || "הכרטיס נדחה על ידי המנהל",
          rejectedAt: new Date().toISOString(),
        });
      }
    } else if (action === "link") {
      if (!eventId) {
        return NextResponse.json({ error: "Missing eventId for link action" }, { status: 400 });
      }
      for (const id of ticketIds) {
        batch.update(db.collection("tickets").doc(id), { eventId });
      }
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await batch.commit();
    return NextResponse.json({ success: true, updated: ticketIds.length });
  } catch (error) {
    console.error("ticket-action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
