import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  calculatePlatformFee,
  ilsToAgorot,
  getPlatformFeePercent,
} from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const buyerUid = decoded.uid;

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    // Fetch the ticket
    const ticketDoc = await adminDb.collection("tickets").doc(ticketId).get();
    if (!ticketDoc.exists) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const ticket = ticketDoc.data()!;

    // Validate ticket is available
    if (ticket.status !== "available") {
      return NextResponse.json(
        { error: "הכרטיס אינו זמין יותר" },
        { status: 409 }
      );
    }

    // Prevent self-purchase
    if (ticket.sellerId === buyerUid) {
      return NextResponse.json(
        { error: "לא ניתן לרכוש כרטיס שהעלית בעצמך" },
        { status: 400 }
      );
    }

    // Verify seller has payment details configured (bank account)
    const sellerDoc = await adminDb
      .collection("users")
      .doc(ticket.sellerId)
      .get();
    const sellerData = sellerDoc.data();

    if (!sellerData?.paymentDetailsConfigured) {
      return NextResponse.json(
        {
          error:
            "המוכר טרם הגדיר אמצעי תשלום. לא ניתן לרכוש כרטיס זה כרגע.",
        },
        { status: 400 }
      );
    }

    // Calculate amounts
    const ticketPriceILS = ticket.askingPrice;
    const platformFeeAgorot = calculatePlatformFee(ticketPriceILS);
    const totalAgorot = ilsToAgorot(ticketPriceILS) + platformFeeAgorot;

    // Reserve the ticket (prevent double purchase)
    await adminDb.collection("tickets").doc(ticketId).update({
      status: "reserved",
      reservedBy: buyerUid,
      reservedAt: new Date(),
    });

    // All payments go to the admin's Stripe account directly.
    // Seller payouts are tracked in the transactions collection
    // and handled by the admin separately.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAgorot,
      currency: "ils",
      metadata: {
        ticketId,
        concertId: ticket.concertId || "",
        buyerId: buyerUid,
        sellerId: ticket.sellerId,
        ticketPrice: ticketPriceILS.toString(),
        platformFeePercent: getPlatformFeePercent().toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAgorot,
      ticketPrice: ticketPriceILS,
      platformFee: platformFeeAgorot / 100,
      total: totalAgorot / 100,
      currency: "ILS",
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);

    // If we reserved the ticket but payment intent creation failed, release it
    try {
      const body = await request.clone().json();
      if (body.ticketId && adminDb) {
        await adminDb.collection("tickets").doc(body.ticketId).update({
          status: "available",
          reservedBy: null,
          reservedAt: null,
        });
      }
    } catch {
      // best effort release
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment",
      },
      { status: 500 }
    );
  }
}
