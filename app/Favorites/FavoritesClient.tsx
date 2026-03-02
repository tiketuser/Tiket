"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import RegularGallery from "../components/TicketGallery/RegularGallery";
import ResultSection from "../components/ResultSection/ResultSection";
import HeartIcon from "../../public/images/Favorites/Heart.svg";
import Image from "next/image";
import { DateRange } from "react-day-picker";
import { calculateTimeLeft } from "../../utils/timeCalculator";

const PAGE_SIZE = 12;

interface CardData {
  imageSrc: string;
  id: string | number;
  title: string;
  date: string;
  location: string;
  ticketsLeft: number;
  price: number;
  soldOut: boolean;
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
}

interface Ticket {
  id: string;
  eventId: string;
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

interface FavoritesClientProps {
  events: Event[];
  tickets: Ticket[];
}

const FavoritesClient: React.FC<FavoritesClientProps> = ({
  events,
  tickets,
}) => {
  const [favoriteCards, setFavoriteCards] = useState<CardData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !user || !db) {
      if (authChecked) setLoading(false);
      return;
    }

    const processFavorites = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db as any, "users", user.uid));
        const favorites = userDoc.exists() ? userDoc.data().favorites || [] : [];

        if (favorites.length === 0) {
          setFavoriteCards([]);
          setLoading(false);
          return;
        }

        const favoriteEvents = events.filter((event) => favorites.includes(event.id));

        const eventCards: CardData[] = favoriteEvents.map((event) => {
          const eventTickets = tickets.filter(
            (ticket) => ticket.eventId === event.id && ticket.status === "available"
          );
          const prices = eventTickets.map((t) => t.askingPrice).filter((p) => p && !isNaN(p));
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

          return {
            id: event.id,
            title: event.artist,
            imageSrc: event.imageUrl,
            date: event.date,
            location: event.venue,
            price: minPrice,
            soldOut: eventTickets.length === 0,
            ticketsLeft: eventTickets.length,
            timeLeft: calculateTimeLeft(event.date, event.time),
          };
        });

        setFavoriteCards(eventCards);
        setVisibleCount(PAGE_SIZE);
        setLoading(false);
      } catch (error) {
        console.error("Error processing favorites:", error);
        setLoading(false);
      }
    };

    processFavorites();
  }, [authChecked, user, events, tickets]);

  const applyFilters = (cards: CardData[], filters: FilterState): CardData[] => {
    return cards.filter((event) => {
      if (filters.cities.length > 0 && !filters.cities.includes(event.location)) return false;
      if (filters.venues.length > 0 && !filters.venues.includes(event.location)) return false;

      if (filters.dateRange?.from && filters.dateRange?.to) {
        const normalizedDate = event.date.replace(/\./g, "/");
        const eventDate = new Date(normalizedDate.split("/").reverse().join("-"));
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (eventDate < fromDate || eventDate > toDate) return false;
      }

      if (event.price < filters.priceRange[0] || event.price > filters.priceRange[1]) return false;
      return true;
    });
  };

  const handleFilterChange = useCallback((filters: FilterState) => {
    setActiveFilters(filters);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const hasActiveFilters =
    activeFilters.cities.length > 0 ||
    activeFilters.venues.length > 0 ||
    activeFilters.dateRange !== undefined ||
    activeFilters.priceRange[0] !== 0 ||
    activeFilters.priceRange[1] !== 1000;

  const filteredCards = hasActiveFilters ? applyFilters(favoriteCards, activeFilters) : favoriteCards;
  const displayCards = filteredCards.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCards.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredCards.length));
  }, [filteredCards.length]);

  const openLoginDialog = useCallback(() => {}, []);

  return (
    <div className="shadow-small-inner py-6 sm:py-14 px-4 sm:px-24">
      <ResultSection
        withUpperSection={true}
        title="המועדפים שלי"
        image={
          <Image src={HeartIcon} alt="Example Icon" width={22} height={20} />
        }
        subText="אלו המופעים ששמרת במועדפים"
        artistNames={Array.from(new Set(favoriteCards.map((card) => card.title)))}
        onFilterChange={handleFilterChange}
      />
      {!authChecked || loading ? (
        <div className="flex flex-col items-center justify-center py-10 sm:py-20">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-base sm:text-lg text-gray-600">טוען מועדפים...</p>
        </div>
      ) : !user ? (
        <div className="text-center text-red-500 text-lg sm:text-xl mt-6 sm:mt-10 px-4">
          אנא התחבר כדי לראות את המועדפים שלך
        </div>
      ) : favoriteCards.length === 0 ? (
        <div className="text-center text-gray-500 text-lg sm:text-xl mt-6 sm:mt-10 px-4">
          עדיין לא הוספת אירועים למועדפים
        </div>
      ) : displayCards.length === 0 && hasActiveFilters ? (
        <div className="text-center text-gray-500 text-lg sm:text-xl mt-6 sm:mt-10 px-4">
          לא נמצאו אירועים התואמים את הסינון
        </div>
      ) : (
        <RegularGallery
          cardsData={displayCards}
          openLoginDialog={openLoginDialog}
          onNearEnd={loadMore}
          isLoadingMore={false}
          hasMore={hasMore}
        />
      )}
    </div>
  );
};

export default FavoritesClient;
