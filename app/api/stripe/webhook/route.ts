import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  if (!adminDb) return;

  const {
    ticketId, concertId, buyerId, sellerId, ticketPrice, platformFeePercent,
    isGuest, guestEmail, guestPhone,
  } = paymentIntent.metadata;

  if (!ticketId || !sellerId) {
    console.error("Missing metadata in PaymentIntent:", paymentIntent.id);
    return;
  }

  // For guest checkout, buyerId may be empty
  if (!buyerId && isGuest !== "true") {
    console.error("Missing buyerId for non-guest payment:", paymentIntent.id);
    return;
  }

  const feePercent = parseFloat(platformFeePercent) || 0;
  const totalILS = paymentIntent.amount / 100;
  const ticketPriceILS = parseFloat(ticketPrice) || totalILS;
  const platformFeeILS = feePercent > 0 ? ticketPriceILS * (feePercent / 100) : 0;
  const sellerPayoutILS = ticketPriceILS - platformFeeILS;

  const batch = adminDb.batch();

  // Update ticket status to sold
  const ticketRef = adminDb.collection("tickets").doc(ticketId);
  batch.update(ticketRef, {
    status: "sold",
    soldTo: buyerId || `guest:${guestEmail}`,
    soldAt: new Date(),
    reservedBy: null,
    reservedAt: null,
  });

  // Create transaction record (admin uses this to pay sellers)
  const transactionData: Record<string, unknown> = {
    ticketId,
    concertId: concertId || null,
    buyerId: buyerId || null,
    sellerId,
    amount: totalILS,
    ticketPrice: ticketPriceILS,
    platformFee: platformFeeILS,
    sellerPayout: sellerPayoutILS,
    sellerPayoutStatus: "pending",
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

  const transactionRef = adminDb.collection("transactions").doc();
  batch.set(transactionRef, transactionData);

  await batch.commit();
  console.log(
    `Payment succeeded for ticket ${ticketId}, transaction ${transactionRef.id}, seller payout: ${sellerPayoutILS} ILS`
  );
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  if (!adminDb) return;

  const { ticketId } = paymentIntent.metadata;
  if (!ticketId) return;

  await adminDb.collection("tickets").doc(ticketId).update({
    status: "available",
    reservedBy: null,
    reservedAt: null,
  });

  console.log(
    `Payment failed for ticket ${ticketId}, reservation released`
  );
}
