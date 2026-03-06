import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlatformFeePercent } from "@/lib/stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("No request body");

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 }
      );
    }

    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    const rawBody = await getRawBody(request);
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Resolve ticket IDs from metadata — supports both old (ticketId) and new (ticketIds) formats
function resolveTicketIds(metadata: Stripe.PaymentIntent["metadata"]): string[] {
  if (metadata.ticketIds) return metadata.ticketIds.split(",").filter(Boolean);
  if (metadata.ticketId) return [metadata.ticketId];
  return [];
}

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

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  if (!adminDb) return;

  const ticketIds = resolveTicketIds(paymentIntent.metadata);
  if (ticketIds.length === 0) {
    console.error("Missing ticketIds in PaymentIntent:", paymentIntent.id);
    return;
  }

  // Idempotency: skip if the confirm-payment route already wrote these transactions
  const existingTx = await adminDb
    .collection("transactions")
    .where("stripePaymentIntentId", "==", paymentIntent.id)
    .limit(1)
    .get();

  if (!existingTx.empty) {
    console.log(`Transactions already exist for PaymentIntent ${paymentIntent.id}, skipping webhook write.`);
    return;
  }

  const { eventId, buyerId, isGuest, guestEmail, guestPhone, platformFeePercent } =
    paymentIntent.metadata;

  if (!buyerId && isGuest !== "true") {
    console.error("Missing buyerId for non-guest payment:", paymentIntent.id);
    return;
  }

  const feePercent = parseFloat(platformFeePercent) || getPlatformFeePercent();

  // Fetch all ticket documents to get per-ticket sellerId, askingPrice, date
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

    // Create one transaction record per ticket
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
      stripePaymentIntentId: paymentIntent.id,
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
  console.log(
    `Payment succeeded for ${ticketIds.length} ticket(s), PaymentIntent: ${paymentIntent.id}`
  );
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  if (!adminDb) return;

  const ticketIds = resolveTicketIds(paymentIntent.metadata);
  if (ticketIds.length === 0) return;

  const batch = adminDb.batch();
  for (const ticketId of ticketIds) {
    batch.update(adminDb.collection("tickets").doc(ticketId), {
      status: "available",
      reservedBy: null,
      reservedAt: null,
    });
  }
  await batch.commit();

  console.log(
    `Payment failed for ${ticketIds.length} ticket(s), reservations released`
  );
}
