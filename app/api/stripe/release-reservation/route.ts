import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyGuestToken } from "@/lib/guestToken";

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = await request.json();
    const { ticketIds, guestToken } = body;
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: "ticketIds required" }, { status: 400 });
    }

    // Verify the caller owns the reservation
    let buyerIdentity: string | null = null;
    let guestIdentity: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
      buyerIdentity = decoded.uid;
    } else if (guestToken) {
      // Verify the HMAC-signed guest token — prevents anyone from releasing
      // another guest's reservation by guessing their email
      try {
        const guestPayload = verifyGuestToken(guestToken);
        guestIdentity = `guest:${guestPayload.email}`;
      } catch {
        return NextResponse.json({ error: "Invalid or expired guest session" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

      // Only release if the caller owns this reservation
      if (buyerIdentity && data.reservedBy !== buyerIdentity) continue;
      if (guestIdentity && data.reservedBy !== guestIdentity) continue;

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
