"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const LoginDialog = dynamic(
  () => import("../Dialogs/LoginDialog/LoginDialog"),
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
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

interface GalleryClientProps {
  initialCards: CardData[];
}

const GalleryClient: React.FC<GalleryClientProps> = ({ initialCards }) => {
  const router = useRouter();
  const [cardsData, setCardsData] = useState<CardData[]>(initialCards);
  const [allCardsData, setAllCardsData] = useState<CardData[]>(initialCards);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState<(string | number)[]>([]);

  // Define the function once
  const openLoginDialog = useCallback(() => setLoginDialogOpen(true), []);

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

  // Update cards when initialCards change
  useEffect(() => {
    setAllCardsData(initialCards);
    setCardsData(initialCards);
  }, [initialCards]);

  // Filter cards by category and apply theme
  useEffect(() => {
    if (selectedCategory === null) {
      // No category selected - show all events and apply default theme
      setCardsData(allCardsData);
      applyTheme(null); // Apply default theme (music)
    } else {
      // Filter by selected category
      const filtered = allCardsData.filter(
        (card) => card.category === selectedCategory,
      );
      setCardsData(filtered);
      applyTheme(selectedCategory); // Apply category-specific theme
    }
  }, [selectedCategory, allCardsData]);

  // Extract unique artist names for search suggestions (memoized)
  const artistNames = useMemo(
    () => [...new Set(cardsData.map((card) => card.title))],
    [cardsData],
  );

  const handleSearch = useCallback(
    (query: string) => {
      router.replace(`/SearchResults/${encodeURIComponent(query)}`);
    },
    [router],
  );

  return (
    <div className="shadow-small-inner flex flex-col items-center pt-6 pb-10">
      {/* Category Filter Buttons */}
      <div className="mt-[40px] mb-[40px]">
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
      {cardsData.length === 0 && (
        <div className="text-center text-lg text-gray-500 py-8">
          {selectedCategory === null
            ? "אין אירועים זמינים כרגע"
            : `אין אירועי ${selectedCategory} זמינים כרגע`}
        </div>
      )}
      {cardsData.length > 0 && (
        <ResponsiveGallery
          cardsData={cardsData}
          openLoginDialog={openLoginDialog}
          userFavorites={userFavorites}
        />
      )}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </div>
  );
};

export default GalleryClient;
