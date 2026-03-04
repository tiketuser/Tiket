import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import { limit, startAfter } from "firebase/firestore";
import { db } from "@/firebase";
import { calculateTimeLeft } from "@/utils/timeCalculator";
import { resolveEventImage } from "@/utils/defaultImages";

const PAGE_SIZE = 12;

interface CardData {
  id: string;
  title: string;
  category?: string;
  imageSrc: string;
  date: string;
  location: string;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Server services not available" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const lastDocId = searchParams.get("lastDocId");
    const category = searchParams.get("category");
    const pageSize = parseInt(searchParams.get("pageSize") ?? String(PAGE_SIZE));

    // Fetch tickets and cursor doc in parallel
    const [ticketsSnapshot, cursorDoc] = await Promise.all([
      getDocs(
        query(
          collection(db as any, "tickets"),
          where("status", "==", "available"),
        ),
      ),
      lastDocId
        ? getDoc(doc(db as any, "events", lastDocId))
        : Promise.resolve(null),
    ]);

    if (lastDocId && (!cursorDoc || !cursorDoc.exists())) {
      return NextResponse.json(
        { error: "Invalid cursor document" },
        { status: 400 },
      );
    }

    const allTickets = ticketsSnapshot.docs.map((d) => ({
      id: d.id,
      eventId: d.data().eventId as string,
      askingPrice: d.data().askingPrice as number,
      originalPrice: d.data().originalPrice as number | undefined,
      status: d.data().status as string,
    }));

    // Build paginated events query (client SDK functional syntax)
    const constraints = [
      where("status", "==", "active"),
      ...(category ? [where("category", "==", category)] : []),
      limit(pageSize),
      ...(cursorDoc ? [startAfter(cursorDoc)] : []),
    ];

    const eventsSnapshot = await getDocs(
      query(collection(db as any, "events"), ...constraints),
    );

    const rawEvents = eventsSnapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          artist: data.artist as string,
          title: data.title as string,
          category: data.category as string | undefined,
          date: data.date as string,
          time: data.time as string,
          venue: data.venue as string,
          imageUrl: data.imageUrl as string,
          status: data.status as string,
        };
      })
      .filter((e) => e.status === "active" && e.artist);

    // Resolve default images for events missing one
    const events = await Promise.all(
      rawEvents.map(async (event) => ({
        ...event,
        imageUrl: await resolveEventImage(event.imageUrl, event.category),
      }))
    );

    const eventCards: CardData[] = events
      .map((event) => {
        const eventTickets = allTickets.filter(
          (t) => t.eventId === event.id && t.status === "available",
        );
        const prices = eventTickets
          .map((t) => t.askingPrice)
          .filter((p) => p && !isNaN(p));
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

        return {
          id: event.id,
          title: event.artist || "אמן לא ידוע",
          category: event.category || "מוזיקה",
          imageSrc: event.imageUrl,
          date: event.date,
          location: event.venue || "מיקום לא ידוע",
          price: minPrice,
          soldOut: eventTickets.length === 0,
          ticketsLeft: eventTickets.length,
          timeLeft: calculateTimeLeft(event.date, event.time),
        };
      })
      .filter((c) => !c.soldOut);

    const lastDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];
    const newLastDocId = lastDoc ? lastDoc.id : null;
    const hasMore = eventsSnapshot.docs.length === pageSize;

    return NextResponse.json(
      { cards: eventCards, lastDocId: newLastDocId, hasMore },
      {
        headers: {
          "Cache-Control": "public, max-age=5, stale-while-revalidate=10",
        },
      },
    );
  } catch (error) {
    console.error("[api/events] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
