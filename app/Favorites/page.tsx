import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import NavBar from "../components/NavBar/NavBar";
import FavoritesClient from "./FavoritesClient";
import { calculateTimeLeft } from "../../utils/timeCalculator";

// Enable dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds

interface Event {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageData: string;
  status: string;
}

interface Ticket {
  id: string;
  concertId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

interface ServerData {
  events: Event[];
  tickets: Ticket[];
}

async function getServerData(): Promise<ServerData> {
  try {
    if (!db) {
      return { events: [], tickets: [] };
    }

    // Fetch all events and tickets in parallel on the server
    // This happens once per request and is cached
    const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
      getDocs(collection(db as any, "concerts")),
      getDocs(collection(db as any, "tickets")),
    ]);

    // Serialize events - convert Firestore data to plain objects
    const events: Event[] = eventsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          artist: data.artist,
          title: data.title,
          date: data.date,
          time: data.time,
          venue: data.venue,
          imageData: data.imageData,
          status: data.status,
        };
      })
      .filter(
        (event: any) =>
          event.status === "active" && event.artist && event.imageData
      ) as Event[];

    // Serialize tickets - convert Firestore timestamps to plain values
    const tickets: Ticket[] = ticketsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        concertId: data.concertId,
        askingPrice: data.askingPrice,
        originalPrice: data.originalPrice,
        status: data.status,
      };
    }) as Ticket[];

    return { events, tickets };
  } catch (error) {
    console.error("Error fetching server data:", error);
    return { events: [], tickets: [] };
  }
}

const Favorites = async () => {
  // Fetch all events and tickets on the server
  // This is faster than client-side fetching and can be cached
  const serverData = await getServerData();

  return (
    <div>
      <NavBar />
      <FavoritesClient
        events={serverData.events}
        tickets={serverData.tickets}
      />
    </div>
  );
};

export default Favorites;
