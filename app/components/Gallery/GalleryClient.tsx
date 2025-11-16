"use client";

import React, { useState, useEffect } from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import ResponsiveGallery from "../TicketGallery/ResponsiveGallery";
import LoginDialog from "../Dialogs/LoginDialog/LoginDialog";
import { applyTheme, loadThemesFromFirebase } from "../../theme/categoryThemes";
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

  // Define the function once
  const openLoginDialog = () => setLoginDialogOpen(true);

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
        (card) => card.category === selectedCategory
      );
      setCardsData(filtered);
      applyTheme(selectedCategory); // Apply category-specific theme
    }
  }, [selectedCategory, allCardsData]);

  // Extract unique artist names for search suggestions
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    router.replace(`/SearchResults/${encodeURIComponent(query)}`);
  };

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
