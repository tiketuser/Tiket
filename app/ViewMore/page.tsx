import React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import ViewMoreClient from "./ViewMoreClient";
import { calculateTimeLeft } from "../../utils/timeCalculator";

// Use ISR - revalidate every 30 seconds
export const revalidate = 30;

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
  categories?: string[];
}

interface Ticket {
  id: string;
  concertId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

async function getViewMoreData() {
  try {
    if (!db) {
      console.error("Firebase database not initialized");
      return {
        allCards: [],
        recentlyViewed: [],
        lastMinuteDeals: [],
        recommendations: [],
      };
    }

    // Fetch only active events and available tickets in parallel
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
          categories: data.categories || [],
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

        // Calculate average original price
        const originalPrices = eventTickets
          .map((t) => t.originalPrice || t.askingPrice)
          .filter((p) => p && !isNaN(p));
        const avgOriginalPrice =
          originalPrices.length > 0
            ? originalPrices.reduce((a, b) => a + b, 0) / originalPrices.length
            : minPrice;

        // Calculate time until event
        const timeLeft = calculateTimeLeft(event.date, event.time);

        const cardData: CardData = {
          id: event.id,
          title: event.artist || event.title,
          category: event.category,
          imageSrc: event.imageData,
          date: event.date,
          location: event.venue,
          priceBefore: Math.round(avgOriginalPrice),
          price: minPrice === maxPrice ? minPrice : minPrice,
          soldOut: eventTickets.length === 0,
          ticketsLeft: eventTickets.length,
          timeLeft: timeLeft,
        };

        return { ...cardData, categories: event.categories };
      })
      .filter((event) => !event.soldOut);

    // Filter by categories for special sections
    const recentlyViewed = eventCards.filter((card: any) =>
      card.categories?.includes("recently-viewed"),
    );

    // Last minute deals: events within 2 days from now
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(now.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    const lastMinuteDeals = eventCards.filter((card) => {
      try {
        const normalizedDate = card.date.replace(/\./g, "/");
        const [day, month, year] = normalizedDate.split("/").map(Number);
        const concertDate = new Date(year, month - 1, day);

        return concertDate >= now && concertDate <= twoDaysFromNow;
      } catch (error) {
        console.error("Error parsing date for last minute deals:", card.date);
        return false;
      }
    });

    const recommendations = eventCards.filter((card: any) =>
      card.categories?.includes("recommendations"),
    );

    return {
      allCards: eventCards,
      recentlyViewed,
      lastMinuteDeals,
      recommendations,
    };
  } catch (error) {
    console.error("Error fetching view more data:", error);
    return {
      allCards: [],
      recentlyViewed: [],
      lastMinuteDeals: [],
      recommendations: [],
    };
  }
}

const ViewMore = async () => {
  const data = await getViewMoreData();

  return (
    <ViewMoreClient
      initialCards={data.allCards}
      recentlyViewed={data.recentlyViewed}
      lastMinuteDeals={data.lastMinuteDeals}
      recommendations={data.recommendations}
    />
  );
};

export default ViewMore;
