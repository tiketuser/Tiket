"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import NavBar from "../components/NavBar/NavBar";
import FavoritesClient from "./FavoritesClient";
import MobileFavorites from "../components/mobile/MobileFavorites";
import type { MobileEventCardData } from "../components/mobile/MobileEventCard";

interface Event {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageUrl: string;
  status: string;
}

interface Ticket {
  id: string;
  eventId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

const Favorites = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [favIds, setFavIds] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!db) return;
      try {
        const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
          getDocs(
            query(collection(db, "events"), where("status", "==", "active")),
          ),
          getDocs(
            query(
              collection(db, "tickets"),
              where("status", "==", "available"),
            ),
          ),
        ]);

        if (cancelled) return;

        const nextEvents: Event[] = eventsSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              artist: data.artist,
              title: data.title,
              date: data.date,
              time: data.time,
              venue: data.venue,
              imageUrl: data.imageUrl,
              status: data.status,
            };
          })
          .filter(
            (event): event is Event =>
              event.status === "active" && Boolean(event.artist),
          );

        const nextTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            eventId: data.eventId,
            askingPrice: data.askingPrice,
            originalPrice: data.originalPrice,
            status: data.status,
          };
        });

        setEvents(nextEvents);
        setTickets(nextTickets);
      } catch (error) {
        console.error("Error fetching favorites data:", error);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user || !db) {
        setSignedIn(false);
        setFavIds(new Set());
        setLoading(false);
        return;
      }
      setSignedIn(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const favs = snap.exists() ? snap.data().favorites || [] : [];
        setFavIds(new Set(favs));
      } catch (err) {
        console.error("Error fetching user favorites:", err);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const mobileCards: MobileEventCardData[] = useMemo(() => {
    const minPriceByEvent = new Map<string, number>();
    for (const t of tickets) {
      if (!t.eventId || !t.askingPrice) continue;
      const cur = minPriceByEvent.get(t.eventId);
      if (cur === undefined || t.askingPrice < cur) {
        minPriceByEvent.set(t.eventId, t.askingPrice);
      }
    }
    const ticketCountByEvent = tickets.reduce<Record<string, number>>(
      (acc, t) => {
        if (t.eventId) acc[t.eventId] = (acc[t.eventId] || 0) + 1;
        return acc;
      },
      {},
    );
    return events
      .filter((e) => favIds.has(e.id))
      .map((e) => ({
        id: e.id,
        title: e.artist,
        imageSrc: e.imageUrl || "",
        date: e.date,
        location: e.venue,
        price: minPriceByEvent.get(e.id) || 0,
        ticketsLeft: ticketCountByEvent[e.id] || 0,
      }));
  }, [events, tickets, favIds]);

  return (
    <>
      <MobileFavorites
        events={mobileCards}
        loading={loading}
        notSignedIn={signedIn === false}
      />
      <div className="hidden md:block">
        <NavBar />
        <FavoritesClient events={events} tickets={tickets} />
      </div>
    </>
  );
};

export default Favorites;
