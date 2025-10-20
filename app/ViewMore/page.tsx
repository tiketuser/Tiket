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

interface FilterState {
  cities: string[];
  venues: string[];
  dateRange: DateRange | undefined;
  priceRange: number[];
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
  categories?: string[]; // Array of category names
}

interface Ticket {
  id: string;
  concertId: string;
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
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    cities: [],
    venues: [],
    dateRange: undefined,
    priceRange: [0, 1000],
  });

  const openLoginDialog = () => {
    // Login dialog functionality
  };

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

  // Handle filter changes from TiketFilters component
  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters);
    const filtered = applyFilters(cardsData, filters);
    setFilteredCards(filtered);
  };

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

        // Fetch all concerts
        const concertsSnapshot = await getDocs(
          collection(db as any, "concerts")
        );
        const concerts: Concert[] = concertsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Concert[];

        // Fetch all available tickets
        const ticketsSnapshot = await getDocs(collection(db as any, "tickets"));
        const allTickets: Ticket[] = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];

        // Map concerts to card data with ticket information
        const concertCards: CardData[] = concerts
          .filter(
            (concert) =>
              concert &&
              concert.status === "active" &&
              concert.artist &&
              concert.imageData
          )
          .map((concert) => {
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

            const cardData = {
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

            return { ...cardData, categories: concert.categories };
          });

        setCardsData(concertCards);
        setFilteredCards(concertCards);

        // Filter by categories
        setRecentlyViewed(
          concertCards.filter((card: any) =>
            card.categories?.includes("recently-viewed")
          )
        );
        setLastMinuteDeals(
          concertCards.filter((card: any) =>
            card.categories?.includes("last-minute-deals")
          )
        );
        setRecommendations(
          concertCards.filter((card: any) =>
            card.categories?.includes("recommendations")
          )
        );

        setLoading(false);
      } catch (error) {
        console.error("Error fetching concerts:", error);
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
            אין קונצרטים זמינים כרגע
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
