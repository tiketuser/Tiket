import React from "react";
import NavBar from "../../components/NavBar/NavBar";
import SearchResultsWrapper from "./SearchResultsWrapper";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { calculateTimeLeft } from "../../../utils/timeCalculator";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define CardData type here or import it
interface CardData {
  id: string;
  title: string;
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
  concertId: string; // References concerts collection in Firebase
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

// Removed generateStaticParams - using dynamic rendering instead

const SearchResults = async ({ params }: { params: { query: string } }) => {
  const query = decodeURIComponent(params.query);

  // Handle case when db is not available
  if (!db) {
    return (
      <div>
        <NavBar />
        <SearchResultsWrapper query={query} tickets={[]} artistNames={[]} />
      </div>
    );
  }

  // Fetch all events (concerts collection)
  const eventsSnapshot = await getDocs(collection(db, "concerts"));
  const events: Event[] = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Event[];

  // Fetch all available tickets
  const ticketsSnapshot = await getDocs(collection(db, "tickets"));
  const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Ticket[];

  // Filter events that match the search query
  const matchingEvents = events.filter(
    (event) =>
      event &&
      event.status === "active" &&
      event.artist &&
      event.imageData &&
      event.artist.toLowerCase().includes(query.toLowerCase())
  );

  // Map events to card data with ticket information
  const eventCards: CardData[] = matchingEvents
    .map((event) => {
      // Get available tickets for this event
      const eventTickets = allTickets.filter(
        (ticket) =>
          ticket.concertId === event.id && ticket.status === "available"
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

      return {
        id: event.id,
        title: event.artist,
        imageSrc: event.imageData,
        date: event.date,
        location: event.venue,
        priceBefore: Math.round(avgOriginalPrice),
        price: minPrice === maxPrice ? minPrice : minPrice,
        soldOut: eventTickets.length === 0,
        ticketsLeft: eventTickets.length,
        timeLeft: timeLeft,
      };
    })
    .filter((event) => !event.soldOut); // Hide sold-out events from search results

  // Get all artist names for suggestions
  const artistNames = Array.from(
    new Set(events.map((event) => event.artist).filter(Boolean))
  );

  return (
    <div>
      <NavBar />
      <SearchResultsWrapper
        query={query}
        tickets={eventCards}
        artistNames={artistNames}
      />
    </div>
  );
};

export default SearchResults;
