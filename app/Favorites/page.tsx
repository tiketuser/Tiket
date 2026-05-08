"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import NavBar from "../components/NavBar/NavBar";
import FavoritesClient from "./FavoritesClient";

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

  return (
    <div>
      <NavBar />
      <FavoritesClient events={events} tickets={tickets} />
    </div>
  );
};

export default Favorites;
