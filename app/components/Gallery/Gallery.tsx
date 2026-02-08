import React from "react";
import { collection, getDocs, query, where } from "../../../firebase";
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
  priceBefore: number;
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
  imageData: string;
  status: string;
  views: number;
}

interface Ticket {
  id: string;
  concertId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

async function getGalleryData(): Promise<CardData[]> {
  try {
    // Check if db is initialized
    if (!db) {
      console.error("Firebase database not initialized");
      return [];
    }

    // Fetch only active events and available tickets in parallel on the server
    const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db as any, "concerts"),
          where("status", "==", "active"),
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
          imageData: data.imageData,
          status: data.status,
          views: data.views || 0,
        };
      })
      .filter(
        (event) =>
          event && event.status === "active" && event.artist && event.imageData,
      );

    // Serialize tickets - only plain objects
    const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        concertId: data.concertId,
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
            ticket.concertId === event.id && ticket.status === "available",
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
          imageSrc: event.imageData || "",
          date: event.date || "",
          location: event.venue || "מיקום לא ידוע",
          priceBefore: maxPrice > minPrice ? maxPrice : avgOriginalPrice,
          price: minPrice || 0,
          soldOut: eventTickets.length === 0,
          ticketsLeft: eventTickets.length,
          timeLeft: calculateTimeLeft(event.date || "", event.time || ""),
        };
      })
      .filter((event) => !event.soldOut); // Hide sold-out events from public gallery

    return eventCards;
  } catch (error) {
    console.error("Error fetching gallery data:", error);
    return [];
  }
}

const Gallery = async () => {
  const initialCards = await getGalleryData();

  return <GalleryClient initialCards={initialCards} />;
};

export default Gallery;
