"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface CardData {
  id: string;
  title: string;
  category?: string;
  imageSrc: string;
  date: string;
  location: string;
  price: number;
  maxPrice?: number;
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
  lastDocId: string | null;
  recentlyViewed: CardData[];
  lastMinuteDeals: CardData[];
  recommendations: CardData[];
}

type SectionKey = "all" | "recentlyViewed" | "lastMinute" | "recommendations";

const ViewMoreClient: React.FC<ViewMoreClientProps> = ({
  initialCards,
  lastDocId: initialLastDocId,
  lastMinuteDeals,
  recommendations,
}) => {
  const router = useRouter();
  const [allCards, setAllCards] = useState<CardData[]>(initialCards);
  const [lastDocId, setLastDocId] = useState<string | null>(initialLastDocId);
  const [hasMore, setHasMore] = useState<boolean>(initialLastDocId !== null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const isFetchingRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("all");
  const [recentlyViewed, setRecentlyViewed] = useState<CardData[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    cities: [],
    venues: [],
    dateRange: undefined,
    priceRange: [0, 1000],
  });

  const openLoginDialog = useCallback(() => {}, []);

  // Reset when ISR revalidates
  useEffect(() => {
    setAllCards(initialCards);
    setLastDocId(initialLastDocId);
    setHasMore(initialLastDocId !== null);
  }, [initialCards, initialLastDocId]);

  // Fetch next page from API
  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || !lastDocId) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/events?lastDocId=${lastDocId}`);
      if (!res.ok) throw new Error("Failed to fetch more events");
      const data = await res.json();
      setAllCards((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        return [...prev, ...data.cards.filter((c: CardData) => !ids.has(c.id))];
      });
      setLastDocId(data.lastDocId);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading more events:", error);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, lastDocId]);

  // Resolve the user's recently viewed events from their Firestore doc
  useEffect(() => {
    if (!db) return;
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRecentlyViewed([]);
        return;
      }
      try {
        const userRef = doc(db as any, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const recentIds: string[] = userSnap.exists()
          ? userSnap.data().recentlyViewed ?? []
          : [];
        const cards = recentIds
          .map((id) => initialCards.find((c) => c.id === id))
          .filter((c): c is CardData => c !== undefined);
        setRecentlyViewed(cards);
      } catch {
        setRecentlyViewed([]);
      }
    });
    return () => unsubscribe();
  }, [initialCards]);

  useEffect(() => {
    const initializeThemes = async () => {
      await loadThemesFromFirebase();
      applyTheme(null);
    };
    initializeThemes();
  }, []);

  const applyFilters = (
    events: CardData[],
    filters: FilterState,
    category: string | null,
  ): CardData[] => {
    return events.filter((event) => {
      if (category !== null && event.category !== category) return false;
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
  }, []);

  // Derived: filtered cards for display in the "all" tab
  const displayCards = (() => {
    const filtered = applyFilters(allCards, activeFilters, selectedCategory);
    return filtered;
  })();

  const tabs: { key: SectionKey; label: string; cards: CardData[] }[] = [
    { key: "all", label: "כל האירועים", cards: displayCards },
    ...(recentlyViewed.length > 0
      ? [{ key: "recentlyViewed" as SectionKey, label: "נצפה לאחרונה", cards: recentlyViewed }]
      : []),
    ...(lastMinuteDeals.length > 0
      ? [{ key: "lastMinute" as SectionKey, label: "דילים ברגע האחרון", cards: lastMinuteDeals }]
      : []),
    ...(recommendations.length > 0
      ? [{ key: "recommendations" as SectionKey, label: "המלצות שלנו", cards: recommendations }]
      : []),
  ];

  const currentTab = tabs.find((t) => t.key === activeSection) ?? tabs[0];

  const artistNames = [...new Set(allCards.map((card) => card.title))];

  const handleSearch = (query: string) => {
    router.push(`/SearchResults/${encodeURIComponent(query)}`);
  };

  return (
    <div dir="rtl" className="min-h-dvh flex flex-col bg-white">
      <NavBar />

      {/* Page header */}
      <div className="shadow-small-inner pt-10 pb-2 sm:pt-16 sm:pb-4 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-heading-3-desktop font-extrabold text-strongText mb-1 text-balance">
            כל האירועים
          </h1>
          <p className="text-text-regular text-mutedText mb-6 text-pretty">
            גלה אירועים, הצגות וקונצרטים — מצא כרטיסים במחירים הטובים ביותר
          </p>

          <div className="flex justify-center mb-4">
            <CustomSearchInput
              id="search-bar"
              placeholder="חפש אירוע"
              image={<Image src={SearchIcon} alt="Search Icon" width={24} height={24} />}
              onEnter={handleSearch}
              suggestions={artistNames}
            />
          </div>

          <div className="flex justify-center mb-2">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          <TiketFilters onFilterChange={handleFilterChange} />
        </div>
      </div>

      {/* Section tabs */}
      {allCards.length > 0 && tabs.length > 1 && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-10 flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`relative shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-text-large font-medium transition-colors duration-150 whitespace-nowrap ${
                  currentTab.key === tab.key
                    ? "text-primary"
                    : "text-mutedText hover:text-strongText"
                }`}
              >
                {tab.label}
                <span className="mr-1.5 text-xs sm:text-text-large tabular-nums text-weakText">
                  {tab.cards.length}
                </span>
                {currentTab.key === tab.key && (
                  <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 sm:px-10 pb-16 max-w-7xl mx-auto w-full">

        {allCards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p className="text-lg font-semibold text-mutedText">אין אירועים זמינים כרגע</p>
            <p className="text-sm text-weakText text-pretty max-w-xs">בדוק שוב בקרוב — כרטיסים חדשים מתווספים כל יום</p>
          </div>
        )}

        {allCards.length > 0 && currentTab.cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-lg font-semibold text-mutedText">לא נמצאו אירועים תואמים</p>
            <p className="text-sm text-weakText text-pretty max-w-xs">נסה לשנות את הסינון או לאפס אותו</p>
          </div>
        )}

        {allCards.length > 0 && currentTab.cards.length > 0 && (
          <ResponsiveGallery
            cardsData={currentTab.cards}
            openLoginDialog={openLoginDialog}
            hideViewMore
            onNearEnd={activeSection === "all" ? fetchMore : () => {}}
            isLoadingMore={activeSection === "all" ? isLoadingMore : false}
            hasMore={activeSection === "all" ? hasMore : false}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ViewMoreClient;
