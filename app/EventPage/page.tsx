"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query as firestoreQuery,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import EventUpperSection from "../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../components/SeatingMap/SeatingMap";
import TicketListClient from "./TicketListClient";

interface Event {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageUrl?: string;
  status: string;
}

interface Ticket {
  id: string;
  eventId: string;
  artist: string;
  date: string;
  venue: string;
  time: string;
  category?: string;
  section: string;
  block?: string | null;
  row: number | null;
  seat: number | null;
  isStanding: boolean;
  askingPrice: number;
  originalPrice: number;
  status: string;
  sellerId: string;
  bundleId: string | null;
  canSplit: boolean | null;
  bundleSize: number | null;
}

type LoadState =
  | { status: "loading" }
  | { status: "no-title" }
  | { status: "not-found"; title: string }
  | { status: "no-tickets"; event: Event }
  | { status: "ok"; event: Event; tickets: Ticket[] }
  | { status: "error" };

function EventPageContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("t") ?? searchParams.get("title");

  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!title) {
        setState({ status: "no-title" });
        return;
      }
      if (!db) {
        setState({ status: "error" });
        return;
      }
      try {
        const decoded = decodeURIComponent(title);
        const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
          getDocs(
            firestoreQuery(
              collection(db, "events"),
              where("artist", "==", decoded),
              where("status", "==", "active"),
              limit(1),
            ),
          ),
          getDocs(
            firestoreQuery(
              collection(db, "tickets"),
              where("artist", "==", decoded),
              where("status", "==", "available"),
            ),
          ),
        ]);

        if (cancelled) return;

        const eventDoc = eventsSnapshot.docs[0];
        if (!eventDoc) {
          setState({ status: "not-found", title: decoded });
          return;
        }
        const d = eventDoc.data();
        const event: Event = {
          id: eventDoc.id,
          artist: d.artist ?? "",
          title: d.title ?? "",
          date: d.date ?? "",
          time: d.time ?? "",
          venue: d.venue ?? "",
          imageUrl:
            d.imageUrl && !d.imageUrl.startsWith("data:")
              ? d.imageUrl
              : undefined,
          status: d.status ?? "",
        };

        const tickets: Ticket[] = ticketsSnapshot.docs
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
          .filter((ticket) => ticket.eventId === event.id);

        if (tickets.length === 0) {
          setState({ status: "no-tickets", event });
          return;
        }
        setState({ status: "ok", event, tickets });
      } catch (error) {
        console.error("Error fetching event:", error);
        if (!cancelled) setState({ status: "error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [title]);

  if (state.status === "loading") {
    return (
      <div>
        <NavBar />
        <div className="text-center text-xl mt-20">טוען...</div>
      </div>
    );
  }

  if (state.status === "no-title") {
    return (
      <div>
        <NavBar />
        <div className="text-center text-red-500 text-xl mt-20">
          לא צויין אירוע
        </div>
        <Footer />
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div>
        <NavBar />
        <div className="text-center text-red-500 text-xl mt-20">
          לא נמצא אירוע של {state.title} 😢
        </div>
        <Footer />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <NavBar />
        <div className="text-center text-red-500 text-xl mt-20">
          שגיאה בטעינת האירוע, אנא נסה שוב מאוחר יותר
        </div>
        <Footer />
      </div>
    );
  }

  if (state.status === "no-tickets") {
    const { event } = state;
    return (
      <div>
        <NavBar />
        <EventUpperSection
          imageSrc={event.imageUrl || "/images/Artist/default.png"}
          title={event.artist}
          date={event.date}
          location={event.venue}
          time={event.time}
          availableTickets={0}
        />
        <div className="text-center text-red-500 text-xl mt-20 mb-20">
          לא נמצאו כרטיסים זמינים לאירוע הזה 😢
        </div>
        <Footer />
      </div>
    );
  }

  const { event, tickets } = state;
  return (
    <div>
      <NavBar />
      <EventUpperSection
        imageSrc={event.imageUrl || "/images/Artist/default.png"}
        title={event.artist}
        date={event.date}
        location={event.venue}
        time={event.time}
        availableTickets={tickets.length}
      />
      <TicketListClient tickets={tickets} event={event} />
      <SeatingMap
        title={"מפת ישיבה"}
        venueName={event.venue}
        SeatingMapsvg="/images/Event Page/Web/Seats.svg"
      />
      <Footer />
    </div>
  );
}

const EventPage = () => {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <EventPageContent />
    </Suspense>
  );
};

export default EventPage;
