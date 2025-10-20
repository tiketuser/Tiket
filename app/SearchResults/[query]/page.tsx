import React from "react";
import NavBar from "../../components/NavBar/NavBar";
import SearchResultsWrapper from "./SearchResultsWrapper";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";

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

interface Concert {
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
  concertId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

// Static params for SSG
export async function generateStaticParams() {
  // Return empty array if db is not available
  if (!db) {
    return [];
  }

  // Fetch artist names from concerts
  const querySnapshot = await getDocs(collection(db, "concerts"));
  const artistNames = Array.from(
    new Set(querySnapshot.docs.map((doc) => doc.data().artist))
  ).filter(Boolean);

  return artistNames.map((name) => ({
    query: encodeURIComponent(name as string),
  }));
}

const SearchResults = async ({ params }: { params: { query: string } }) => {
  const query = decodeURIComponent(params.query);

  // Handle case when db is not available
  if (!db) {
    return (
      <div>
        <NavBar />
        <SearchResultsWrapper
          query={query}
          tickets={[]}
          artistNames={[]}
        />
      </div>
    );
  }

  // Fetch all concerts
  const concertsSnapshot = await getDocs(collection(db, "concerts"));
  const concerts: Concert[] = concertsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Concert[];

  // Fetch all available tickets
  const ticketsSnapshot = await getDocs(collection(db, "tickets"));
  const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Ticket[];

  // Filter concerts that match the search query
  const matchingConcerts = concerts.filter(
    (concert) =>
      concert &&
      concert.status === "active" &&
      concert.artist &&
      concert.imageData &&
      concert.artist.toLowerCase().includes(query.toLowerCase())
  );

  // Map concerts to card data with ticket information
  const concertCards: CardData[] = matchingConcerts.map((concert) => {
    // Get available tickets for this concert
    const concertTickets = allTickets.filter(
      (ticket) =>
        ticket.concertId === concert.id && ticket.status === "available"
    );

    // Calculate price range
    const prices = concertTickets
      .map((t) => t.askingPrice)
      .filter((p) => p && !isNaN(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Calculate average original price
    const originalPrices = concertTickets
      .map((t) => t.originalPrice || t.askingPrice)
      .filter((p) => p && !isNaN(p));
    const avgOriginalPrice =
      originalPrices.length > 0
        ? originalPrices.reduce((a, b) => a + b, 0) / originalPrices.length
        : minPrice;

    // Calculate time until event
    const eventDate = new Date(concert.date.split("/").reverse().join("-"));
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let timeLeft = "";
    if (diffDays < 0) {
      timeLeft = "האירוע עבר";
    } else if (diffDays === 0) {
      timeLeft = "היום!";
    } else if (diffDays === 1) {
      timeLeft = "מחר";
    } else if (diffDays <= 7) {
      timeLeft = `בעוד ${diffDays} ימים`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      timeLeft = weeks === 1 ? "בעוד שבוע" : `בעוד ${weeks} שבועות`;
    }

    return {
      id: concert.id,
      title: concert.artist,
      imageSrc: concert.imageData,
      date: concert.date,
      location: concert.venue,
      priceBefore: Math.round(avgOriginalPrice),
      price: minPrice === maxPrice ? minPrice : minPrice,
      soldOut: concertTickets.length === 0,
      ticketsLeft: concertTickets.length,
      timeLeft: timeLeft,
    };
  });

  // Get all artist names for suggestions
  const artistNames = Array.from(
    new Set(concerts.map((concert) => concert.artist).filter(Boolean))
  );

  return (
    <div>
      <NavBar />
      <SearchResultsWrapper
        query={query}
        tickets={concertCards}
        artistNames={artistNames}
      />
    </div>
  );
};

export default SearchResults;
