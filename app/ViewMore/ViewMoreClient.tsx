"use client";

import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import CustomSearchInput from "../components/CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../public/images/SearchBar/Search Icon.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TiketFilters from "../components/TiketFilters/TiketFilters";
import ResponsiveGallery from "../components/TicketGallery/ResponsiveGallery";
import { DateRange } from "react-day-picker";
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

interface ViewMoreClientProps {
  initialCards: CardData[];
  recentlyViewed: CardData[];
  lastMinuteDeals: CardData[];
  recommendations: CardData[];
}

const ViewMoreClient: React.FC<ViewMoreClientProps> = ({
  initialCards,
  recentlyViewed,
  lastMinuteDeals,
  recommendations,
}) => {
  const router = useRouter();
  const [cardsData] = useState<CardData[]>(initialCards);
  const [filteredCards, setFilteredCards] = useState<CardData[]>(initialCards);
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
      await loadThemesFromFirebase();
      applyTheme(null);
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

  // Apply category filter whenever category changes
  useEffect(() => {
    const filtered = applyFilters(cardsData, activeFilters, selectedCategory);
    setFilteredCards(filtered);
  }, [selectedCategory, cardsData, activeFilters]);

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

        {cardsData.length === 0 && (
          <div className="text-center text-lg text-gray-500 py-8">
            אין אירועים זמינים כרגע
          </div>
        )}

        {displayCards.length === 0 && cardsData.length > 0 && (
          <div className="text-center text-lg text-gray-500 py-8">
            לא נמצאו אירועים התואמים את הסינון
          </div>
        )}

        {displayCards.length > 0 && (
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

export default ViewMoreClient;
