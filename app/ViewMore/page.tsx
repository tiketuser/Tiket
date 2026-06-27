"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../../firebase";
import ViewMoreClient from "./ViewMoreClient";
import { calculateTimeLeft } from "../../utils/timeCalculator";

const INITIAL_PAGE_SIZE = 12;

interface CardData {
  id: string;
  title: string;
  category?: string;
  imageSrc: string;
  date: string;
  location: string;
  price: number;
  maxPrice?: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
  categories?: string[];
}

interface RawEvent {
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
  categories?: string[];
}

interface RawTicket {
  id: string;
  eventId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

interface ViewMoreData {
  allCards: CardData[];
  lastDocId: string | null;
  recentlyViewed: CardData[];
  lastMinuteDeals: CardData[];
  recommendations: CardData[];
}

const EMPTY: ViewMoreData = {
  allCards: [],
  lastDocId: null,
  recentlyViewed: [],
  lastMinuteDeals: [],
  recommendations: [],
};

async function loadViewMoreData(): Promise<ViewMoreData> {
  if (!db) return EMPTY;

  const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "events"),
        where("status", "==", "active"),
        limit(INITIAL_PAGE_SIZE),
      ),
    ),
    getDocs(
      query(collection(db, "tickets"), where("status", "==", "available")),
    ),
  ]);

  const events: RawEvent[] = eventsSnapshot.docs
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
        categories: data.categories || [],
      };
    })
    .filter(
      (event) =>
        event && event.status === "active" && event.artist && event.imageUrl,
    );

  const allTickets: RawTicket[] = ticketsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      eventId: data.eventId,
      askingPrice: data.askingPrice,
      originalPrice: data.originalPrice,
      status: data.status,
    };
  });

  const eventCards: CardData[] = events
    .map((event) => {
      const eventTickets = allTickets.filter(
        (ticket) =>
          ticket.eventId === event.id && ticket.status === "available",
      );

      const prices = eventTickets
        .map((t) => t.askingPrice)
        .filter((p) => p && !isNaN(p));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        id: event.id,
        title: event.artist || event.title,
        category: event.category,
        imageSrc: event.imageUrl,
        date: event.date,
        location: event.venue,
        price: minPrice,
        maxPrice: maxPrice > minPrice ? maxPrice : undefined,
        soldOut: eventTickets.length === 0,
        ticketsLeft: eventTickets.length,
        timeLeft: calculateTimeLeft(event.date, event.time),
        categories: event.categories,
      };
    })
    .filter((card) => !card.soldOut);

  const now = new Date();
  const twoDaysFromNow = new Date(now);
  twoDaysFromNow.setDate(now.getDate() + 2);
  twoDaysFromNow.setHours(23, 59, 59, 999);

  const lastMinuteDeals = eventCards.filter((card) => {
    try {
      const normalizedDate = card.date.replace(/\./g, "/");
      const [day, month, year] = normalizedDate.split("/").map(Number);
      const eventDate = new Date(year, month - 1, day);
      return eventDate >= now && eventDate <= twoDaysFromNow;
    } catch {
      return false;
    }
  });

  const recommendations = eventCards.filter((card) =>
    card.categories?.includes("recommendations"),
  );

  const lastDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];

  return {
    allCards: eventCards,
    lastDocId: lastDoc?.id ?? null,
    recentlyViewed: [],
    lastMinuteDeals,
    recommendations,
  };
}

const ViewMore = () => {
  const [data, setData] = useState<ViewMoreData>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    loadViewMoreData()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        console.error("Error fetching view more data:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ViewMoreClient
      initialCards={data.allCards}
      lastDocId={data.lastDocId}
      recentlyViewed={data.recentlyViewed}
      lastMinuteDeals={data.lastMinuteDeals}
      recommendations={data.recommendations}
    />
  );
};

export default ViewMore;
