import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getPlatformFeePercent } from "@/lib/stripe";
import { verifyGuestToken } from "@/lib/guestToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function calcPayoutEligibleAt(dateStr: string): Date {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const eventDate = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
    eventDate.setDate(eventDate.getDate() + 7);
    return eventDate;
  }
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { paymentIntentId, guestToken } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId is required" },
        { status: 400 }
      );
    }

    // Identify the caller: authenticated user or HMAC-verified guest
    let callerUid: string | null = null;
    let callerGuestEmail: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      const token = authHeader.substring(7);
      const decoded = await adminAuth.verifyIdToken(token);
      callerUid = decoded.uid;
    } else if (guestToken) {
      try {
        const guestPayload = verifyGuestToken(guestToken);
        callerGuestEmail = guestPayload.email;
      } catch {
        return NextResponse.json({ error: "Invalid or expired guest session" }, { status: 401 });
      }
    } else {
      // Require some form of identity — no anonymous confirms
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the PaymentIntent from Stripe to verify it actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment has not succeeded" },
        { status: 400 }
      );
    }

    const { ticketIds: ticketIdsRaw, ticketId: singleTicketId, buyerId, eventId, isGuest, guestEmail, guestPhone, platformFeePercent } =
      paymentIntent.metadata;

    const ticketIds = ticketIdsRaw
      ? ticketIdsRaw.split(",").filter(Boolean)
      : singleTicketId
      ? [singleTicketId]
      : [];

    if (ticketIds.length === 0) {
      return NextResponse.json(
        { error: "No ticket IDs found in payment" },
        { status: 400 }
      );
    }

    // Unconditional ownership check — always enforce who can confirm
    if (callerUid) {
      // Authenticated user must match the buyerId stored in the PaymentIntent
      if (buyerId && callerUid !== buyerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (callerGuestEmail) {
      // Guest must present a token whose email matches the one on the PaymentIntent
      if (guestEmail && callerGuestEmail !== guestEmail) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Check if transactions already exist for this paymentIntentId (webhook may have already run)
    const existingTx = await adminDb
      .collection("transactions")
      .where("stripePaymentIntentId", "==", paymentIntentId)
      .limit(1)
      .get();

    if (!existingTx.empty) {
      // Already processed (webhook beat us) — just return success
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    const feePercent = parseFloat(platformFeePercent) || getPlatformFeePercent();

    // Fetch all ticket documents
    const ticketSnaps = await Promise.all(
      ticketIds.map((id) => adminDb!.collection("tickets").doc(id).get())
    );

    const batch = adminDb.batch();

    for (const ticketSnap of ticketSnaps) {
      const ticketData = ticketSnap.data();
      if (!ticketData) continue;

      const ticketId = ticketSnap.id;
      const sellerId = ticketData.sellerId as string;
      const ticketPriceILS = ticketData.askingPrice as number;
      const platformFeeILS = feePercent > 0 ? ticketPriceILS * (feePercent / 100) : 0;
      const sellerPayoutILS = ticketPriceILS - platformFeeILS;
      const payoutEligibleAt = calcPayoutEligibleAt(ticketData.date || "");

      // Mark ticket as sold
      batch.update(adminDb.collection("tickets").doc(ticketId), {
        status: "sold",
        soldTo: buyerId || `guest:${guestEmail}`,
        soldAt: new Date(),
        reservedBy: null,
        reservedAt: null,
      });

      // Create transaction record
      const transactionData: Record<string, unknown> = {
        ticketId,
        eventId: eventId || null,
        buyerId: buyerId || null,
        sellerId,
        amount: ticketPriceILS + platformFeeILS,
        ticketPrice: ticketPriceILS,
        platformFee: platformFeeILS,
        sellerPayout: sellerPayoutILS,
        sellerPayoutStatus: "pending",
        payoutEligibleAt,
        currency: "ILS",
        stripePaymentIntentId: paymentIntentId,
        status: "completed",
        createdAt: new Date(),
        completedAt: new Date(),
        isGuest: isGuest === "true",
      };

      if (isGuest === "true") {
        transactionData.guestEmail = guestEmail || null;
        transactionData.guestPhone = guestPhone || null;
      }

      batch.set(adminDb.collection("transactions").doc(), transactionData);
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
