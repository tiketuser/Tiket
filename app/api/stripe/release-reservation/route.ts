import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { ticketIds } = await request.json();
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: "ticketIds required" }, { status: 400 });
    }

    // Verify the caller owns the reservation (or is a guest — we trust the client here
    // since releasing a reservation is a non-destructive, buyer-side operation)
    let buyerIdentity: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
      buyerIdentity = decoded.uid;
    }

    const batch = adminDb.batch();
    let artist: string | null = null;
    for (const id of ticketIds) {
      const ref = adminDb.collection("tickets").doc(id);
      const snap = await ref.get();
      if (!snap.exists) continue;

      const data = snap.data()!;
      // Only release if still reserved (don't undo a completed purchase)
      if (data.status !== "reserved") continue;

      // Only release if reserved by this buyer (or guest flow where no uid)
      if (buyerIdentity && data.reservedBy !== buyerIdentity) continue;

      if (!artist) artist = data.artist as string ?? null;
      batch.update(ref, { status: "available", reservedBy: null, reservedAt: null });
    }

    await batch.commit();

    // Revalidate the event page so the ticket reappears for other viewers
    if (artist) {
      revalidatePath(`/EventPage/${encodeURIComponent(artist)}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("release-reservation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
