import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  calculatePlatformFee,
  ilsToAgorot,
  getPlatformFeePercent,
} from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  const reservedIds: string[] = [];

  try {
    if (!adminDb) {
      console.error('[create-payment-intent] adminDb is null — Firebase Admin failed to initialize');
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "שירות התשלומים אינו זמין כרגע. נסה שוב מאוחר יותר." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { ticketIds, guestEmail, guestPhone } = body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: "ticketIds is required" },
        { status: 400 }
      );
    }

    // Determine buyer identity: authenticated user or guest
    let buyerUid: string | null = null;
    let isGuest = false;
    let buyerEmail: string | null = null;
    let buyerName: string | null = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      const token = authHeader.substring(7);
      const decoded = await adminAuth.verifyIdToken(token);
      buyerUid = decoded.uid;
      buyerEmail = decoded.email || null;
      buyerName = decoded.name || null;
    } else if (guestEmail && guestPhone) {
      isGuest = true;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all ticket documents
    const ticketDocs = await Promise.all(
      ticketIds.map((id: string) =>
        adminDb!.collection("tickets").doc(id).get()
      )
    );

    // Validate all tickets
    for (const ticketDoc of ticketDocs) {
      if (!ticketDoc.exists) {
        return NextResponse.json(
          { error: "אחד הכרטיסים לא נמצא" },
          { status: 404 }
        );
      }
      const data = ticketDoc.data()!;
      if (data.status !== "available") {
        return NextResponse.json(
          { error: "אחד הכרטיסים אינו זמין יותר" },
          { status: 409 }
        );
      }
      if (buyerUid && data.sellerId === buyerUid) {
        return NextResponse.json(
          { error: "לא ניתן לרכוש כרטיס שהעלית בעצמך" },
          { status: 400 }
        );
      }
    }

    // Verify all unique sellers have payment details configured
    const sellerIds = [
      ...new Set(ticketDocs.map((d) => d.data()!.sellerId as string)),
    ];
    for (const sellerId of sellerIds) {
      const sellerDoc = await adminDb.collection("users").doc(sellerId).get();
      const sellerData = sellerDoc.data();
      if (!sellerData?.paymentDetailsConfigured && !sellerData?.paymentDetails) {
        return NextResponse.json(
          {
            error:
              "המוכר טרם הגדיר אמצעי תשלום. לא ניתן לרכוש כרטיס זה כרגע.",
          },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const totalTicketPriceILS = ticketDocs.reduce(
      (sum, d) => sum + (d.data()!.askingPrice as number),
      0
    );
    const platformFeeAgorot = calculatePlatformFee(totalTicketPriceILS);
    const totalAgorot = ilsToAgorot(totalTicketPriceILS) + platformFeeAgorot;

    // Batch-reserve all tickets
    const reserveBatch = adminDb.batch();
    for (const ticketDoc of ticketDocs) {
      reserveBatch.update(ticketDoc.ref, {
        status: "reserved",
        reservedBy: buyerUid || `guest:${guestEmail}`,
        reservedAt: new Date(),
      });
      reservedIds.push(ticketDoc.id);
    }
    await reserveBatch.commit();

    // Resolve or create a Stripe Customer for registered buyers (enables saved cards)
    let stripeCustomerId: string | undefined;
    if (buyerUid) {
      const buyerDoc = await adminDb.collection("users").doc(buyerUid).get();
      const buyerData = buyerDoc.data();
      if (buyerData?.stripeCustomerId) {
        stripeCustomerId = buyerData.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: buyerEmail || undefined,
          name: buyerName || undefined,
          metadata: { firebaseUid: buyerUid },
        });
        stripeCustomerId = customer.id;
        adminDb
          .collection("users")
          .doc(buyerUid)
          .update({ stripeCustomerId: customer.id })
          .catch((err) => console.error("Failed to save stripeCustomerId:", err));
      }
    }

    const concertId = (ticketDocs[0].data()!.concertId as string) || "";
    const metadata: Record<string, string> = {
      ticketIds: ticketIds.join(","),
      concertId,
      buyerId: buyerUid || "",
      platformFeePercent: getPlatformFeePercent().toString(),
      isGuest: isGuest.toString(),
    };

    if (isGuest) {
      metadata.guestEmail = guestEmail;
      metadata.guestPhone = guestPhone;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAgorot,
      currency: "ils",
      metadata,
      ...(stripeCustomerId && {
        customer: stripeCustomerId,
        setup_future_usage: "off_session",
      }),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAgorot,
      ticketPrice: totalTicketPriceILS,
      platformFee: platformFeeAgorot / 100,
      total: totalAgorot / 100,
      currency: "ILS",
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);

    // Release any tickets that were reserved before the error
    if (reservedIds.length > 0 && adminDb) {
      try {
        const releaseBatch = adminDb.batch();
        for (const id of reservedIds) {
          releaseBatch.update(adminDb.collection("tickets").doc(id), {
            status: "available",
            reservedBy: null,
            reservedAt: null,
          });
        }
        await releaseBatch.commit();
      } catch {
        // best-effort release
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create payment",
      },
      { status: 500 }
    );
  }
}
