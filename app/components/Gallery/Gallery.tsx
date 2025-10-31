"use client";

import React, { useState, useEffect } from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import ResponsiveGallery from "../TicketGallery/ResponsiveGallery";
import { db, collection, getDocs } from "../../../firebase";
import LoginDialog from "../Dialogs/LoginDialog/LoginDialog";
import { calculateTimeLeft } from "../../../utils/timeCalculator";
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
}

interface Ticket {
  id: string;
  concertId: string; // References concerts collection in Firebase
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

const Gallery = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cardsData, setCardsData] = useState<CardData[]>([]);
  const [allCardsData, setAllCardsData] = useState<CardData[]>([]); // Store all data for filtering
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

  // Fetch concerts and their tickets from Firestore
  useEffect(() => {
    const fetchConcertsWithTickets = async () => {
      try {
        setLoading(true);

        // Check if db is initialized
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
          ) // Only show active events with required data
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

            // Calculate average original price for "before" price
            const originalPrices = eventTickets
              .map((t) => t.originalPrice || t.askingPrice)
              .filter((p) => p && !isNaN(p) && p > minPrice);
            const avgOriginalPrice =
              originalPrices.length > 0
                ? Math.round(
                    originalPrices.reduce((a, b) => a + b, 0) /
                      originalPrices.length
                  )
                : Math.round(minPrice * 1.2); // Default to 20% markup if no original prices

            return {
              id: event.id || "",
              title: event.artist || "אמן לא ידוע",
              category: event.category || "מוזיקה",
              imageSrc: event.imageData || "",
              date: event.date || "",
              location: event.venue || "מיקום לא ידוע",
              priceBefore: maxPrice > minPrice ? maxPrice : avgOriginalPrice,
              price: minPrice || 0,
              soldOut: eventTickets.length === 0,
              ticketsLeft: eventTickets.length,
              timeLeft: calculateTimeLeft(event.date || "", event.time || ""),
            };
          })
          .filter((event) => !event.soldOut) // Hide sold-out events from public gallery
          .sort((a, b) => {
            // Sort by date
            return 0;
          });

        setAllCardsData(eventCards); // Store all cards
        setCardsData(eventCards); // Initially show all cards
      } catch (error) {
        console.error("Error fetching concerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConcertsWithTickets();
  }, []);

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
    setLoading(true);
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
      {loading && (
        <div className="text-center text-lg text-gray-500 py-4">
          טוען תוצאות...
        </div>
      )}
      {!loading && !db && (
        <div className="text-center text-lg text-red-500 py-8">
          Firebase לא מוגדר. נא לבדוק את הגדרות הסביבה.
        </div>
      )}
      {!loading && db && cardsData.length === 0 && (
        <div className="text-center text-lg text-gray-500 py-8">
          {selectedCategory === null
            ? "אין אירועים זמינים כרגע"
            : `אין אירועי ${selectedCategory} זמינים כרגע`}
        </div>
      )}
      {!loading && db && cardsData.length > 0 && (
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

export default Gallery;
