"use client";

import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import CustomSearchInput from "../components/CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../public/images/SearchBar/Search Icon.svg";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useRouter } from "next/navigation";
import TiketFilters from "../components/TiketFilters/TiketFilters";
import ResponsiveGallery from "../components/TicketGallery/ResponsiveGallery";
import { DateRange } from "react-day-picker";
import { calculateTimeLeft } from "../../utils/timeCalculator";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter";
import { applyTheme, loadThemesFromFirebase } from "../theme/categoryThemes";

interface CardData {
  id: string;
  title: string;
  category?: string;
  imageSrc: string;
  date: string;
  location: string;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

interface FilterState {
  cities: string[];
  venues: string[];
  dateRange: DateRange | undefined;
  priceRange: number[];
}

interface Event {
  id: string;
  artist: string;
  title: string;
  category?: string;
  date: string;
  time: string;
  venue: string;
  imageData: string;
  status: string;
  views: number;
  categories?: string[]; // Array of category names
}

interface Ticket {
  id: string;
  concertId: string; // References concerts collection in Firebase
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

const ViewMore = () => {
  const router = useRouter();
  const [cardsData, setCardsData] = useState<CardData[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardData[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<CardData[]>([]);
  const [lastMinuteDeals, setLastMinuteDeals] = useState<CardData[]>([]);
  const [recommendations, setRecommendations] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    cities: [],
    venues: [],
    dateRange: undefined,
    priceRange: [0, 1000],
  });

  const openLoginDialog = () => {
    // Login dialog functionality
  };

  // Initialize default theme on mount
  useEffect(() => {
    const initializeThemes = async () => {
      await loadThemesFromFirebase(); // Load custom themes from Firebase
      applyTheme(null); // Apply default theme (music) with loaded themes
    };
    initializeThemes();
  }, []);

  // Apply filters to events
  const applyFilters = (
    events: CardData[],
    filters: FilterState,
    category: string | null
  ): CardData[] => {
    return events.filter((event) => {
      // Filter by category
      if (category !== null) {
        if (event.category !== category) {
          return false;
        }
      }

      // Filter by cities
      if (filters.cities.length > 0) {
        if (!filters.cities.includes(event.location)) {
          return false;
        }
      }

      // Filter by venues
      if (filters.venues.length > 0) {
        if (!filters.venues.includes(event.location)) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const normalizedDate = event.date.replace(/\./g, "/");
        const eventDate = new Date(
          normalizedDate.split("/").reverse().join("-")
        );
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (eventDate < fromDate || eventDate > toDate) {
          return false;
        }
      }

      // Filter by price range
      if (
        event.price < filters.priceRange[0] ||
        event.price > filters.priceRange[1]
      ) {
        return false;
      }

      return true;
    });
  };

  // Handle filter changes from TiketFilters component
  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters);
    const filtered = applyFilters(cardsData, filters, selectedCategory);
    setFilteredCards(filtered);
  };

  // Apply category filter whenever category or cardsData changes
  useEffect(() => {
    const filtered = applyFilters(cardsData, activeFilters, selectedCategory);
    setFilteredCards(filtered);
  }, [selectedCategory, cardsData]);

  // Fetch concerts with tickets from Firestore
  useEffect(() => {
    const fetchConcertsWithTickets = async () => {
      try {
        setLoading(true);

        if (!db) {
          console.error("Firebase database not initialized");
          setLoading(false);
          return;
        }

        // Fetch all events (concerts collection)
        const eventsSnapshot = await getDocs(collection(db as any, "concerts"));
        const events: Event[] = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];

        // Fetch all available tickets
        const ticketsSnapshot = await getDocs(collection(db as any, "tickets"));
        const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];

        // Map events to card data with ticket information
        const eventCards: CardData[] = events
          .filter(
            (event) =>
              event &&
              event.status === "active" &&
              event.artist &&
              event.imageData
          )
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
                ? originalPrices.reduce((a, b) => a + b, 0) /
                  originalPrices.length
                : minPrice;

            // Calculate time until event
            const timeLeft = calculateTimeLeft(event.date, event.time);

            const cardData: CardData = {
              id: event.id,
              title: event.artist || event.title,
              category: event.category,
              imageSrc: event.imageData,
              date: event.date,
              location: event.venue,
              priceBefore: Math.round(avgOriginalPrice),
              price: minPrice === maxPrice ? minPrice : minPrice,
              soldOut: eventTickets.length === 0,
              ticketsLeft: eventTickets.length,
              timeLeft: timeLeft,
            };

            return { ...cardData, categories: event.categories };
          })
          .filter((event) => !event.soldOut); // Hide sold-out events from public view

        setCardsData(eventCards);
        setFilteredCards(eventCards);

        // Filter by categories
        setRecentlyViewed(
          eventCards.filter((card: any) =>
            card.categories?.includes("recently-viewed")
          )
        );

        // Last minute deals: events within 2 days from now
        const now = new Date();
        const twoDaysFromNow = new Date(now);
        twoDaysFromNow.setDate(now.getDate() + 2);
        twoDaysFromNow.setHours(23, 59, 59, 999);

        const lastMinute = eventCards.filter((card) => {
          try {
            const normalizedDate = card.date.replace(/\./g, "/");
            const [day, month, year] = normalizedDate.split("/").map(Number);
            const concertDate = new Date(year, month - 1, day);

            return concertDate >= now && concertDate <= twoDaysFromNow;
          } catch (error) {
            console.error(
              "Error parsing date for last minute deals:",
              card.date
            );
            return false;
          }
        });

        setLastMinuteDeals(lastMinute);

        setRecommendations(
          eventCards.filter((card: any) =>
            card.categories?.includes("recommendations")
          )
        );

        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };

    fetchConcertsWithTickets();
  }, []);

  // חילוץ רשימת שמות האמנים מתוך cardsData (ללא כפילויות)
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    router.push(`/SearchResults?query=${encodeURIComponent(query)}`);
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedCategory !== null ||
    activeFilters.cities.length > 0 ||
    activeFilters.venues.length > 0 ||
    activeFilters.dateRange !== undefined ||
    activeFilters.priceRange[0] !== 0 ||
    activeFilters.priceRange[1] !== 1000;

  // Use filtered cards if filters are active, otherwise use all cards
  const displayCards = hasActiveFilters ? filteredCards : cardsData;

  return (
    <div dir="rtl">
      <NavBar />
      <div className="pt-14 pb-14 pr-6 pl-6 shadow-small-inner">
        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <div className="flex justify-center">
          <CustomSearchInput
            id="search-bar"
            placeholder="חפש אירוע"
            image={
              <Image
                src={SearchIcon}
                alt="Search Icon"
                width={24}
                height={24}
              />
            }
            onEnter={handleSearch}
            suggestions={artistNames}
          />
        </div>

        <TiketFilters onFilterChange={handleFilterChange} />

        {loading && (
          <div className="text-center text-lg text-gray-500 py-8">
            טוען אירועים...
          </div>
        )}

        {!loading && !db && (
          <div className="text-center text-lg text-red-500 py-8">
            Firebase לא מוגדר. נא לבדוק את הגדרות הסביבה.
          </div>
        )}

        {!loading && db && cardsData.length === 0 && (
          <div className="text-center text-lg text-gray-500 py-8">
            אין אירועים זמינים כרגע
          </div>
        )}

        {!loading &&
          db &&
          displayCards.length === 0 &&
          cardsData.length > 0 && (
            <div className="text-center text-lg text-gray-500 py-8">
              לא נמצאו אירועים התואמים את הסינון
            </div>
          )}

        {!loading && db && displayCards.length > 0 && (
          <>
            {!hasActiveFilters && (
              <>
                {recentlyViewed.length > 0 && (
                  <>
                    <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext mb-4 mt-6">
                      נצפה לאחרונה
                    </h3>
                    <ResponsiveGallery
                      cardsData={recentlyViewed}
                      openLoginDialog={openLoginDialog}
                    />
                  </>
                )}

                {lastMinuteDeals.length > 0 && (
                  <>
                    <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext mb-4 mt-6">
                      דילים ברגע האחרון
                    </h3>
                    <ResponsiveGallery
                      cardsData={lastMinuteDeals}
                      openLoginDialog={openLoginDialog}
                    />
                  </>
                )}

                {recommendations.length > 0 && (
                  <>
                    <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext mb-4 mt-6">
                      המלצות שלנו
                    </h3>
                    <ResponsiveGallery
                      cardsData={recommendations}
                      openLoginDialog={openLoginDialog}
                    />
                  </>
                )}
              </>
            )}

            <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext mb-4 mt-6">
              {hasActiveFilters
                ? `תוצאות סינון (${displayCards.length})`
                : `כל האירועים (${displayCards.length})`}
            </h3>
            <ResponsiveGallery
              cardsData={displayCards}
              openLoginDialog={openLoginDialog}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ViewMore;
