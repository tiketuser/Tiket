import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Server services not available" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const title = searchParams.get("t") ?? searchParams.get("title");

    if (!title) {
      return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
    }

    const decoded = decodeURIComponent(title);

    const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db as any, "events"),
          where("artist", "==", decoded),
          where("status", "==", "active"),
          limit(1),
        ),
      ),
      getDocs(
        query(
          collection(db as any, "tickets"),
          where("artist", "==", decoded),
          where("status", "==", "available"),
        ),
      ),
    ]);

    const eventDoc = eventsSnapshot.docs[0];
    if (!eventDoc) {
      return NextResponse.json({ notFound: true }, { status: 404 });
    }

    const d = eventDoc.data();
    const event = {
      id: eventDoc.id,
      artist: d.artist ?? "",
      title: d.title ?? "",
      date: d.date ?? "",
      time: d.time ?? "",
      venue: d.venue ?? "",
      imageUrl: d.imageUrl && !d.imageUrl.startsWith("data:") ? d.imageUrl : null,
      status: d.status ?? "",
    };

    const tickets = ticketsSnapshot.docs
      .map((doc) => {
        const td = doc.data();
        return {
          id: doc.id,
          eventId: td.eventId ?? "",
          artist: td.artist ?? "",
          date: td.date ?? "",
          venue: td.venue ?? "",
          time: td.time ?? "",
          category: td.category ?? undefined,
          section: td.section ?? "",
          block: td.block ?? null,
          row: td.row ?? null,
          seat: td.seat ?? null,
          isStanding: td.isStanding ?? false,
          askingPrice: td.askingPrice ?? 0,
          originalPrice: td.originalPrice ?? 0,
          status: td.status ?? "",
          sellerId: td.sellerId ?? "",
          bundleId: td.bundleId ?? null,
          canSplit: td.canSplit ?? null,
          bundleSize: td.bundleSize ?? null,
        };
      })
      .filter((t) => t.eventId === event.id);

    return NextResponse.json(
      { event, tickets },
      { headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" } },
    );
  } catch (error) {
    console.error("[api/event] Error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
