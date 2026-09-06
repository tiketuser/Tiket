import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlatformFeePercent } from "@/lib/stripe";
import { adminDb } from "@/lib/firebaseAdmin";
import { transferTicketsAfterSale } from "@/lib/venueTransfer";
import Stripe from "stripe";
import { sendPushToUser } from "@/lib/push-send";
import { payoutEligibleAt as calcPayoutEligibleAt } from "@/utils/eventDate";

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

  const parsedFee = parseFloat(platformFeePercent);
  const feePercent = Number.isNaN(parsedFee) ? getPlatformFeePercent() : parsedFee;
  const expectedReservedBy = buyerId || `guest:${guestEmail}`;

  // Fetch all ticket documents to get per-ticket sellerId, askingPrice, date
  const ticketSnaps = await Promise.all(
    ticketIds.map((id) => adminDb!.collection("tickets").doc(id).get())
  );

  const batch = adminDb.batch();
  const soldTicketIds: string[] = [];
  const soldSellerIds = new Set<string>();

  for (const ticketSnap of ticketSnaps) {
    const ticketData = ticketSnap.data();
    if (!ticketData) continue;

    const ticketId = ticketSnap.id;

    // Only complete the sale if the ticket is still reserved by THIS payer.
    // A stale/abandoned PaymentIntent that succeeds later must not overwrite a
    // ticket that was released, resold, or bought by someone else.
    if (
      ticketData.status !== "reserved" ||
      ticketData.reservedBy !== expectedReservedBy
    ) {
      console.error(
        `PaymentIntent ${paymentIntent.id}: ticket ${ticketId} not reserved by payer ` +
          `(status=${ticketData.status}, reservedBy=${ticketData.reservedBy}). ` +
          `Skipping sale — needs manual review/refund.`
      );
      continue;
    }

    const sellerId = ticketData.sellerId as string;
    if (sellerId) soldSellerIds.add(sellerId);
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
    soldTicketIds.push(ticketId);

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

    // Deterministic doc ID keyed on (paymentIntent, ticket) makes this write
    // idempotent — if the confirm-payment route races us, both target the same
    // doc instead of creating duplicate payout records.
    batch.set(
      adminDb.collection("transactions").doc(`${paymentIntent.id}_${ticketId}`),
      transactionData
    );
  }

  await batch.commit();

  // Best-effort push. Never awaited into the critical path in a way that can
  // fail the webhook — Stripe retries on a non-2xx and we do not want a
  // notification outage to replay a sale.
  void (async () => {
    for (const sellerId of soldSellerIds) {
      await sendPushToUser(sellerId, {
        title: "הכרטיס שלך נמכר",
        body: "קיבלנו תשלום. הכסף ישוחרר אליך אחרי האירוע.",
        path: "/MyListings",
      });
    }
    if (buyerId) {
      await sendPushToUser(buyerId, {
        title: "הרכישה הושלמה",
        body: "הכרטיסים שלך מוכנים באפליקציה.",
        path: "/MyTickets",
      });
    }
  })();
  console.log(
    `Payment succeeded for ${ticketIds.length} ticket(s), PaymentIntent: ${paymentIntent.id}`
  );

  // Ask the issuing provider to move ownership to the buyer (Tiket Connect
  // /tiket/transfer). Best-effort — outcomes land on each ticket's
  // ownershipTransfer field and failures are retryable from the admin panel.
  // The deterministic transfer_ref makes the race with confirm-payment safe.
  try {
    await transferTicketsAfterSale(
      soldTicketIds,
      { buyerId, guestEmail, guestPhone },
      paymentIntent.id
    );
  } catch (err) {
    console.error("[webhook] ownership transfer step failed:", err);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  if (!adminDb) return;

  const ticketIds = resolveTicketIds(paymentIntent.metadata);
  if (ticketIds.length === 0) return;

  const { buyerId, guestEmail } = paymentIntent.metadata;
  const expectedReservedBy = buyerId || `guest:${guestEmail}`;

  // Release only tickets still reserved by THIS payer. A late failure event for
  // an abandoned PaymentIntent must never flip a ticket that has since been
  // sold to — or reserved by — a different buyer.
  const ticketSnaps = await Promise.all(
    ticketIds.map((id) => adminDb!.collection("tickets").doc(id).get())
  );

  const batch = adminDb.batch();
  let released = 0;
  for (const snap of ticketSnaps) {
    const data = snap.data();
    if (!data) continue;
    if (data.status === "reserved" && data.reservedBy === expectedReservedBy) {
      batch.update(snap.ref, {
        status: "available",
        reservedBy: null,
        reservedAt: null,
      });
      released++;
    }
  }
  await batch.commit();

  console.log(
    `Payment failed for PaymentIntent ${paymentIntent.id}, released ${released}/${ticketIds.length} reservation(s)`
  );
}
