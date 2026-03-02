"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import ResponsiveGallery from "../TicketGallery/ResponsiveGallery";
import dynamic from "next/dynamic";
import { applyTheme, loadThemesFromFirebase } from "../../theme/categoryThemes";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

const AuthDialog = dynamic(
  () => import("../Dialogs/AuthDialog/AuthDialog"),
  { ssr: false },
);
import CategoryFilter from "../CategoryFilter/CategoryFilter";

interface CardData {
  id: string;
  title: string;
  category?: string;
  imageSrc: string;
  date: string;
  location: string;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

interface GalleryClientProps {
  initialCards: CardData[];
  lastDocId: string | null;
}

const GalleryClient: React.FC<GalleryClientProps> = ({ initialCards, lastDocId: initialLastDocId }) => {
  const router = useRouter();
  const [allCards, setAllCards] = useState<CardData[]>(initialCards);
  const [lastDocId, setLastDocId] = useState<string | null>(initialLastDocId);
  const [hasMore, setHasMore] = useState<boolean>(initialLastDocId !== null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const isFetchingRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<(string | number)[]>([]);

  // Define the function once
  const openLoginDialog = useCallback(() => setAuthDialogOpen(true), []);

  // Fetch user favorites ONCE (instead of N+1 per card)
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        try {
          const userRef = doc(db as any, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const favorites = userSnap.exists()
            ? userSnap.data().favorites || []
            : [];
          setUserFavorites(favorites);
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      } else {
        setUserFavorites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize default theme on mount
  useEffect(() => {
    const initializeThemes = async () => {
      await loadThemesFromFirebase(); // Load custom themes from Firebase
      applyTheme(null); // Apply default theme (music) with loaded themes
    };
    initializeThemes();
  }, []);

  // Reset when ISR revalidates and sends new initialCards (only when no category is active)
  useEffect(() => {
    if (selectedCategory !== null) return;
    setAllCards(initialCards);
    setLastDocId(initialLastDocId);
    setHasMore(initialLastDocId !== null);
  }, [initialCards, initialLastDocId, selectedCategory]);

  // Apply theme + fetch fresh page when category changes
  useEffect(() => {
    applyTheme(selectedCategory);

    const fetchByCategory = async () => {
      isFetchingRef.current = true;
      setIsCategoryLoading(true);
      try {
        const url = selectedCategory
          ? `/api/events?category=${encodeURIComponent(selectedCategory)}`
          : `/api/events`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch events for category");
        const data = await res.json();
        setAllCards(data.cards);
        setLastDocId(data.lastDocId);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Error loading category events:", error);
      } finally {
        setIsCategoryLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchByCategory();
  }, [selectedCategory]);

  // Derived: filtered cards for display (single source of truth — server already filters)
  const displayedCards = useMemo(() => allCards, [allCards]);

  // Fetch next page from API
  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || !lastDocId) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ lastDocId });
      if (selectedCategory) params.set("category", selectedCategory);
      const res = await fetch(`/api/events?${params}`);
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
  }, [hasMore, lastDocId, selectedCategory]);

  // Extract unique artist names for search suggestions (memoized)
  const artistNames = useMemo(
    () => [...new Set(displayedCards.map((card) => card.title))],
    [displayedCards],
  );

  const handleSearch = useCallback(
    (query: string) => {
      router.replace(`/SearchResults/${encodeURIComponent(query)}`);
    },
    [router],
  );

  return (
    <div className="shadow-small-inner flex flex-col items-center sm:pt-6 pt-0 pb-10">
      {/* Category Filter Buttons */}
      <div className="sm:mt-[40px] xs:mt-[30px] mt-[20px] sm:mb-[40px] xs:mb-[30px] mb-[20px]">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>
      <CustomSearchInput
        id="search-bar"
        placeholder="חפש אירוע"
        image={
          <Image src={SearchIcon} alt="Search Icon" width={24} height={24} />
        }
        onEnter={handleSearch}
        suggestions={artistNames}
      />
      {displayedCards.length === 0 && !isLoadingMore && !isCategoryLoading && (
        <div className="text-center text-lg text-gray-500 py-8">
          {selectedCategory === null
            ? "אין אירועים זמינים כרגע"
            : `אין אירועי ${selectedCategory} זמינים כרגע`}
        </div>
      )}
      {displayedCards.length > 0 && (
        <ResponsiveGallery
          cardsData={displayedCards}
          openLoginDialog={openLoginDialog}
          userFavorites={userFavorites}
          onNearEnd={fetchMore}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
      )}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </div>
  );
};

export default GalleryClient;
