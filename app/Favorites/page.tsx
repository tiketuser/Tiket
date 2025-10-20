"use client";

import React, { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import RegularGallery from "../components/TicketGallery/RegularGallery";
import NavBar from "../components/NavBar/NavBar";
import ResultSection from "../components/ResultSection/ResultSection";
import HeartIcon from "../../public/images/Favorites/Heart.svg";
import Image from "next/image";
import { DateRange } from "react-day-picker";

interface CardData {
  imageSrc: string;
  id: string | number;
  title: string;
  date: string;
  location: string;
  ticketsLeft: number;
  priceBefore: number;
  price: number;
  soldOut: boolean;
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
}

interface Ticket {
  id: string;
  concertId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

interface FilterState {
  cities: string[];
  venues: string[];
  dateRange: DateRange | undefined;
  priceRange: number[];
}

const Favorites = () => {
  const [favoriteCards, setFavoriteCards] = useState<CardData[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = not checked yet
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    cities: [],
    venues: [],
    dateRange: undefined,
    priceRange: [0, 1000],
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return; // Don't run until auth is checked
    if (!user) {
      setLoading(false);
      setFavoriteCards([]);
      return;
    }

    if (!db) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        // Get user's favorite concert IDs
        const userDoc = await getDoc(doc(db as any, "users", user.uid));
        const favorites = userDoc.exists()
          ? userDoc.data().favorites || []
          : [];

        if (favorites.length === 0) {
          setFavoriteCards([]);
          setLoading(false);
          return;
        }

        // Fetch all concerts and tickets
        const [concertsSnapshot, ticketsSnapshot] = await Promise.all([
          getDocs(collection(db as any, "concerts")),
          getDocs(collection(db as any, "tickets")),
        ]);

        const concerts: Concert[] = concertsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Concert[];

        const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];

        // Filter concerts that are in favorites
        const favoriteConcerts = concerts.filter(
          (concert) =>
            favorites.includes(concert.id) &&
            concert.status === "active" &&
            concert.artist &&
            concert.imageData
        );

        // Map concerts to card data
        const concertCards: CardData[] = favoriteConcerts.map((concert) => {
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

          // Calculate average original price
          const originalPrices = concertTickets
            .map((t) => t.originalPrice || t.askingPrice)
            .filter((p) => p && !isNaN(p));
          const avgOriginalPrice =
            originalPrices.length > 0
              ? originalPrices.reduce((a, b) => a + b, 0) /
                originalPrices.length
              : minPrice;

          // Calculate time until event
          const eventDate = new Date(
            concert.date.split("/").reverse().join("-")
          );
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
            price: minPrice,
            soldOut: concertTickets.length === 0,
            ticketsLeft: concertTickets.length,
            timeLeft: timeLeft,
          };
        });

        setFavoriteCards(concertCards);
        setFilteredCards(concertCards);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  // Apply filters to concerts
  const applyFilters = (
    concerts: CardData[],
    filters: FilterState
  ): CardData[] => {
    return concerts.filter((concert) => {
      // Filter by cities
      if (filters.cities.length > 0) {
        if (!filters.cities.includes(concert.location)) {
          return false;
        }
      }

      // Filter by venues
      if (filters.venues.length > 0) {
        if (!filters.venues.includes(concert.location)) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const concertDate = new Date(
          concert.date.split("/").reverse().join("-")
        );
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (concertDate < fromDate || concertDate > toDate) {
          return false;
        }
      }

      // Filter by price range
      if (
        concert.price < filters.priceRange[0] ||
        concert.price > filters.priceRange[1]
      ) {
        return false;
      }

      return true;
    });
  };

  // Handle filter changes
  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters);
    const filtered = applyFilters(favoriteCards, filters);
    setFilteredCards(filtered);
  };

  // Check if any filters are active
  const hasActiveFilters =
    activeFilters.cities.length > 0 ||
    activeFilters.venues.length > 0 ||
    activeFilters.dateRange !== undefined ||
    activeFilters.priceRange[0] !== 0 ||
    activeFilters.priceRange[1] !== 1000;

  // Use filtered cards if filters are active, otherwise use all cards
  const displayCards = hasActiveFilters ? filteredCards : favoriteCards;

  // Define the function once
  const openLoginDialog = () => {};

  return (
    <div>
      <NavBar />
      <div className="shadow-small-inner py-14 px-24">
        <ResultSection
          withUpperSection={true}
          title="המועדפים שלי"
          image={
            <Image src={HeartIcon} alt="Example Icon" width={22} height={20} />
          }
          subText="אלו המופעים ששמרת במועדפים"
          artistNames={Array.from(
            new Set(favoriteCards.map((card) => card.title))
          )}
          onFilterChange={handleFilterChange}
        />
        {user === undefined || loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-gray-600">טוען מועדפים...</p>
          </div>
        ) : !user ? (
          <div className="text-center text-red-500 text-xl mt-10">
            אנא התחבר כדי לראות את המועדפים שלך
          </div>
        ) : favoriteCards.length === 0 ? (
          <div className="text-center text-gray-500 text-xl mt-10">
            עדיין לא הוספת אירועים למועדפים
          </div>
        ) : displayCards.length === 0 && hasActiveFilters ? (
          <div className="text-center text-gray-500 text-xl mt-10">
            לא נמצאו אירועים התואמים את הסינון
          </div>
        ) : (
          <RegularGallery
            cardsData={displayCards}
            openLoginDialog={openLoginDialog}
          />
        )}
      </div>
    </div>
  );
};

export default Favorites;

const auth = getAuth();
setPersistence(auth, browserLocalPersistence);
