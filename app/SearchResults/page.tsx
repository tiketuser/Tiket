"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import NavBar from "../components/NavBar/NavBar";
import SearchResultsWrapper from "./SearchResultsWrapper";
import SearchResultsSkeleton from "./SearchResultsSkeleton";
import MobileSearchResults from "../components/mobile/MobileSearchResults";
import { calculateTimeLeft } from "../../utils/timeCalculator";

interface CardData {
  id: string;
  title: string;
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
  date: string;
  time: string;
  venue: string;
  imageUrl: string;
  status: string;
  views: number;
  categories?: string[];
}

interface Ticket {
  id: string;
  eventId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? searchParams.get("query") ?? "";

  const [tickets, setTickets] = useState<CardData[]>([]);
  const [artistNames, setArtistNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!db || !queryParam) {
        setTickets([]);
        setArtistNames([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const eventsSnapshot = await getDocs(
          firestoreQuery(
            collection(db, "events"),
            where("status", "==", "active"),
          ),
        );
        if (cancelled) return;

        const events: Event[] = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Event, "id">),
        }));

        const matchingEvents = events.filter(
          (event) =>
            event &&
            event.artist &&
            event.artist.toLowerCase().includes(queryParam.toLowerCase()),
        );

        const matchingEventIds = matchingEvents.map((e) => e.id);
        let allTickets: Ticket[] = [];
        if (matchingEventIds.length > 0) {
          const chunks: string[][] = [];
          for (let i = 0; i < matchingEventIds.length; i += 30) {
            chunks.push(matchingEventIds.slice(i, i + 30));
          }
          const ticketSnapshots = await Promise.all(
            chunks.map((chunk) =>
              getDocs(
                firestoreQuery(
                  collection(db!, "tickets"),
                  where("eventId", "in", chunk),
                  where("status", "==", "available"),
                ),
              ),
            ),
          );
          if (cancelled) return;
          allTickets = ticketSnapshots.flatMap((snap) =>
            snap.docs.map(
              (doc) =>
                ({
                  id: doc.id,
                  ...(doc.data() as Omit<Ticket, "id">),
                }) as Ticket,
            ),
          );
        }

        const eventCards: CardData[] = matchingEvents
          .map((event) => {
            const eventTickets = allTickets.filter(
              (ticket) =>
                ticket.eventId === event.id && ticket.status === "available",
            );
            const prices = eventTickets
              .map((t) => t.askingPrice)
              .filter((p) => p && !isNaN(p));
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const timeLeft = calculateTimeLeft(event.date, event.time);
            return {
              id: event.id,
              title: event.artist,
              imageSrc: event.imageUrl,
              date: event.date,
              location: event.venue,
              price: minPrice,
              soldOut: eventTickets.length === 0,
              ticketsLeft: eventTickets.length,
              timeLeft,
            };
          })
          .filter((event) => !event.soldOut);

        const allArtistNames = Array.from(
          new Set(events.map((event) => event.artist).filter(Boolean)),
        );

        if (!cancelled) {
          setTickets(eventCards);
          setArtistNames(allArtistNames);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [queryParam]);

  if (loading) {
    return (
      <>
        <MobileSearchResults query={queryParam} />
        <div className="hidden md:block">
          <SearchResultsSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileSearchResults query={queryParam} />
      <div className="hidden md:block">
        <NavBar />
        <SearchResultsWrapper
          query={queryParam}
          tickets={tickets}
          artistNames={artistNames}
        />
      </div>
    </>
  );
}

const SearchResults = () => {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResultsContent />
    </Suspense>
  );
};

export default SearchResults;
