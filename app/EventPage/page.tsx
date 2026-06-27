"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import EventUpperSection from "../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../components/SeatingMap/SeatingMap";
import TicketListClient from "./TicketListClient";
import EventPageSkeleton from "./EventPageSkeleton";
import MobileEventDetail from "../components/mobile/MobileEventDetail";
import MobileTicketList from "../components/mobile/MobileTicketList";
import { firestoreRestQuery } from "@/lib/firestoreRest";

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
      setState({ status: "loading" });
      try {
        const decoded = decodeURIComponent(title);
        const [eventDocs, ticketDocs] = await Promise.all([
          firestoreRestQuery({
            collection: "events",
            filters: [
              { field: "artist", op: "EQUAL", value: decoded },
              { field: "status", op: "EQUAL", value: "active" },
            ],
            limit: 1,
          }),
          firestoreRestQuery({
            collection: "tickets",
            filters: [
              { field: "artist", op: "EQUAL", value: decoded },
              { field: "status", op: "EQUAL", value: "available" },
            ],
          }),
        ]);

        if (cancelled) return;

        const eventDoc = eventDocs[0];
        if (!eventDoc) {
          setState({ status: "not-found", title: decoded });
          return;
        }
        const d = eventDoc.data;
        const imageUrl = typeof d.imageUrl === "string" ? d.imageUrl : "";
        const event: Event = {
          id: eventDoc.id,
          artist: (d.artist as string) ?? "",
          title: (d.title as string) ?? "",
          date: (d.date as string) ?? "",
          time: (d.time as string) ?? "",
          venue: (d.venue as string) ?? "",
          imageUrl:
            imageUrl && !imageUrl.startsWith("data:") ? imageUrl : undefined,
          status: (d.status as string) ?? "",
        };

        const tickets: Ticket[] = ticketDocs
          .map((doc) => {
            const td = doc.data;
            return {
              id: doc.id,
              eventId: (td.eventId as string) ?? "",
              artist: (td.artist as string) ?? "",
              date: (td.date as string) ?? "",
              venue: (td.venue as string) ?? "",
              time: (td.time as string) ?? "",
              category: (td.category as string | undefined) ?? undefined,
              section: (td.section as string) ?? "",
              block: (td.block as string | null) ?? null,
              row: (td.row as number | null) ?? null,
              seat: (td.seat as number | null) ?? null,
              isStanding: (td.isStanding as boolean) ?? false,
              askingPrice: (td.askingPrice as number) ?? 0,
              originalPrice: (td.originalPrice as number) ?? 0,
              status: (td.status as string) ?? "",
              sellerId: (td.sellerId as string) ?? "",
              bundleId: (td.bundleId as string | null) ?? null,
              canSplit: (td.canSplit as boolean | null) ?? null,
              bundleSize: (td.bundleSize as number | null) ?? null,
            };
          })
          .filter((ticket) => ticket.eventId === event.id);

        if (tickets.length === 0) {
          setState({ status: "no-tickets", event });
          return;
        }
        setState({ status: "ok", event, tickets });
      } catch (error) {
        const detail =
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : JSON.stringify(error, Object.getOwnPropertyNames(error as object)) ||
              String(error);
        console.error("Error fetching event:", detail);
        if (!cancelled) setState({ status: "error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [title]);

  if (state.status === "loading") {
    return <EventPageSkeleton />;
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
      <>
        <MobileEventDetail event={event} availableTickets={0}>
          <div
            style={{
              padding: "30px 8px",
              textAlign: "center",
              color: "var(--tk-muted)",
              fontSize: 13,
            }}
          >
            לא נמצאו כרטיסים זמינים לאירוע הזה
          </div>
        </MobileEventDetail>
        <div className="hidden md:block">
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
      </>
    );
  }

  const { event, tickets } = state;
  return (
    <>
      <MobileEventDetail event={event} availableTickets={tickets.length}>
        <MobileTicketList tickets={tickets} event={event} />
      </MobileEventDetail>
      <div className="hidden md:block">
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
    </>
  );
}

const EventPage = () => {
  return (
    <Suspense fallback={<EventPageSkeleton />}>
      <EventPageContent />
    </Suspense>
  );
};

export default EventPage;
