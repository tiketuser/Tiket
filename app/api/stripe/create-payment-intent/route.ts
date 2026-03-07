import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  stripe,
  calculatePlatformFee,
  ilsToAgorot,
  getPlatformFeePercent,
} from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyGuestToken } from "@/lib/guestToken";

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
    const { ticketIds, guestToken } = body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: "ticketIds is required" },
        { status: 400 }
      );
    }

    // Determine buyer identity: authenticated user or HMAC-verified guest
    let buyerUid: string | null = null;
    let isGuest = false;
    let guestEmail: string | null = null;
    let guestPhone: string | null = null;
    let buyerEmail: string | null = null;
    let buyerName: string | null = null;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      const token = authHeader.substring(7);
      const decoded = await adminAuth.verifyIdToken(token);
      buyerUid = decoded.uid;
      buyerEmail = decoded.email || null;
      buyerName = decoded.name || null;
    } else if (guestToken) {
      // Verify the HMAC-signed token issued by /api/guest-token
      try {
        const guestPayload = verifyGuestToken(guestToken);
        isGuest = true;
        guestEmail = guestPayload.email;
        guestPhone = guestPayload.phone;
      } catch {
        return NextResponse.json({ error: "Invalid or expired guest session" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pre-flight checks (outside transaction): bundle integrity + seller payment setup
    // These don't need to be atomic since they're read-only validations before we reserve.
    const ticketRefs = ticketIds.map((id: string) =>
      adminDb!.collection("tickets").doc(id)
    );

    // Verify bundle completeness before reserving
    const preFetchDocs = await Promise.all(ticketRefs.map((r) => r.get()));
    for (const ticketDoc of preFetchDocs) {
      if (!ticketDoc.exists) {
        return NextResponse.json({ error: "אחד הכרטיסים לא נמצא" }, { status: 404 });
      }
    }

    const nonSplitBundleIds = new Set<string>();
    for (const ticketDoc of preFetchDocs) {
      const data = ticketDoc.data()!;
      if (data.bundleId && data.canSplit === false) {
        nonSplitBundleIds.add(data.bundleId as string);
      }
    }
    if (nonSplitBundleIds.size > 0) {
      const ticketIdsInRequest = new Set<string>(ticketIds);
      for (const bundleId of nonSplitBundleIds) {
        const bundleSnap = await adminDb!
          .collection("tickets")
          .where("bundleId", "==", bundleId)
          .where("status", "in", ["available", "reserved"])
          .get();
        if (bundleSnap.docs.some((d) => !ticketIdsInRequest.has(d.id))) {
          return NextResponse.json(
            { error: "יש לרכוש את כל הכרטיסים בחבילה יחד" },
            { status: 400 }
          );
        }
      }
    }

    // Verify all unique sellers have payment details configured
    const sellerIds = [
      ...new Set(preFetchDocs.map((d) => d.data()!.sellerId as string)),
    ];
    for (const sellerId of sellerIds) {
      const sellerDoc = await adminDb.collection("users").doc(sellerId).get();
      const sellerData = sellerDoc.data();
      if (!sellerData?.paymentDetailsConfigured && !sellerData?.paymentDetails) {
        return NextResponse.json(
          { error: "המוכר טרם הגדיר אמצעי תשלום. לא ניתן לרכוש כרטיס זה כרגע." },
          { status: 400 }
        );
      }
    }

    // Atomic reservation via Firestore transaction — eliminates TOCTOU race condition.
    // The transaction re-reads each ticket inside a serialized context, so two concurrent
    // buyers cannot both reserve the same ticket.
    const reservedBy = buyerUid || `guest:${guestEmail}`;
    let totalTicketPriceILS = 0;

    try {
      await adminDb.runTransaction(async (tx) => {
        const snapshots = await Promise.all(ticketRefs.map((r) => tx.get(r)));

        for (const snap of snapshots) {
          if (!snap.exists) throw Object.assign(new Error("NOT_FOUND"), { code: 404 });
          const data = snap.data()!;
          if (data.status !== "available") {
            throw Object.assign(new Error("UNAVAILABLE"), { code: 409 });
          }
          if (buyerUid && data.sellerId === buyerUid) {
            throw Object.assign(new Error("OWN_TICKET"), { code: 400 });
          }
          totalTicketPriceILS += data.askingPrice as number;
          reservedIds.push(snap.id);
        }

        // All checks passed — reserve every ticket inside the same transaction
        const reservedAt = new Date();
        for (const snap of snapshots) {
          tx.update(snap.ref, { status: "reserved", reservedBy, reservedAt });
        }
      });
    } catch (txErr: unknown) {
      const err = txErr as Error & { code?: number };
      if (err.message === "NOT_FOUND") {
        return NextResponse.json({ error: "אחד הכרטיסים לא נמצא" }, { status: 404 });
      }
      if (err.message === "UNAVAILABLE") {
        return NextResponse.json({ error: "אחד הכרטיסים אינו זמין יותר" }, { status: 409 });
      }
      if (err.message === "OWN_TICKET") {
        return NextResponse.json({ error: "לא ניתן לרכוש כרטיס שהעלית בעצמך" }, { status: 400 });
      }
      throw txErr; // unexpected — let outer catch handle it
    }

    const platformFeeAgorot = calculatePlatformFee(totalTicketPriceILS);
    const totalAgorot = ilsToAgorot(totalTicketPriceILS) + platformFeeAgorot;

    // Use preFetchDocs for metadata (amounts already validated inside transaction)
    const ticketDocs = preFetchDocs;

    // Revalidate the event page so other viewers see the ticket is gone
    const artist = ticketDocs[0].data()!.artist as string | undefined;
    if (artist) {
      revalidatePath(`/EventPage/${encodeURIComponent(artist)}`);
    }

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

    const eventId = (ticketDocs[0].data()!.eventId as string) || "";
    const metadata: Record<string, string> = {
      ticketIds: ticketIds.join(","),
      eventId,
      buyerId: buyerUid || "",
      platformFeePercent: getPlatformFeePercent().toString(),
      isGuest: isGuest.toString(),
    };

    if (isGuest && guestEmail && guestPhone) {
      metadata.guestEmail = guestEmail;
      metadata.guestPhone = guestPhone;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAgorot,
      currency: "ils",
      metadata,
      automatic_payment_methods: { enabled: true },
      ...(stripeCustomerId && {
        customer: stripeCustomerId,
        setup_future_usage: "on_session",
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
