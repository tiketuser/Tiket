import React from "react";
import { collection, getDocs, query, where } from "../../../firebase";
import { limit } from "firebase/firestore";
import { db } from "../../../firebase";
import GalleryClient from "./GalleryClient";
import { calculateTimeLeft } from "../../../utils/timeCalculator";

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

interface Event {
  id: string;
  artist: string;
  title: string;
  category?: string;
  date: string;
  time: string;
  venue: string;
  imageUrl: string;
  status: string;
  views: number;
}

interface Ticket {
  id: string;
  eventId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

const INITIAL_PAGE_SIZE = 12;

async function getGalleryData(): Promise<{ cards: CardData[]; lastDocId: string | null }> {
  try {
    // Check if db is initialized
    if (!db) {
      console.error("Firebase database not initialized");
      return { cards: [], lastDocId: null };
    }

    // Fetch first page of active events and all available tickets in parallel
    const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db as any, "events"),
          where("status", "==", "active"),
          limit(INITIAL_PAGE_SIZE),
        ),
      ),
      getDocs(
        query(
          collection(db as any, "tickets"),
          where("status", "==", "available"),
        ),
      ),
    ]);

    // Serialize events - only plain objects
    const events: Event[] = eventsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          artist: data.artist,
          title: data.title,
          category: data.category,
          date: data.date,
          time: data.time,
          venue: data.venue,
          imageUrl: data.imageUrl,
          status: data.status,
          views: data.views || 0,
        };
      })
      .filter(
        (event) =>
          event && event.status === "active" && event.artist && event.imageUrl,
      );

    // Serialize tickets - only plain objects
    const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eventId: data.eventId,
        askingPrice: data.askingPrice,
        originalPrice: data.originalPrice,
        status: data.status,
      };
    });

    // Map events to card data with ticket information
    const eventCards: CardData[] = events
      .map((event) => {
        // Get available tickets for this event
        const eventTickets = allTickets.filter(
          (ticket) =>
            ticket.eventId === event.id && ticket.status === "available",
        );

        // Calculate price range
        const prices = eventTickets
          .map((t) => t.askingPrice)
          .filter((p) => p && !isNaN(p));
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        // Calculate average original price for "before" price
        const originalPrices = eventTickets
          .map((t) => t.originalPrice || t.askingPrice)
          .filter((p) => p && !isNaN(p) && p > minPrice);
        const avgOriginalPrice =
          originalPrices.length > 0
            ? Math.round(
                originalPrices.reduce((a, b) => a + b, 0) /
                  originalPrices.length,
              )
            : Math.round(minPrice * 1.2); // Default to 20% markup if no original prices

        return {
          id: event.id || "",
          title: event.artist || "אמן לא ידוע",
          category: event.category || "מוזיקה",
          imageSrc: event.imageUrl || "",
          date: event.date || "",
          location: event.venue || "מיקום לא ידוע",
          price: minPrice || 0,
          soldOut: eventTickets.length === 0,
          ticketsLeft: eventTickets.length,
          timeLeft: calculateTimeLeft(event.date || "", event.time || ""),
        };
      })
      .filter((event) => !event.soldOut);

    const lastDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];
    return { cards: eventCards, lastDocId: lastDoc?.id ?? null };
  } catch (error) {
    console.error("Error fetching gallery data:", error);
    return { cards: [], lastDocId: null };
  }
}

const Gallery = async () => {
  const { cards, lastDocId } = await getGalleryData();

  return <GalleryClient initialCards={cards} lastDocId={lastDocId} />;
};

export default Gallery;
