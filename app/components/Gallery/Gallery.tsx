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
}

interface Ticket {
  id: string;
  concertId: string;
  askingPrice: number;
  originalPrice?: number;
  status: string;
}

const Gallery = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cardsData, setCardsData] = useState<CardData[]>([]);
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);

  // Define the function once
  const openLoginDialog = () => setLoginDialogOpen(true);

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
          ) // Only show active concerts with required data
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

            // Calculate average original price for "before" price
            const originalPrices = concertTickets
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
              id: concert.id || "",
              title: concert.artist || "אמן לא ידוע",
              imageSrc: concert.imageData || "",
              date: concert.date || "",
              location: concert.venue || "מיקום לא ידוע",
              priceBefore: maxPrice > minPrice ? maxPrice : avgOriginalPrice,
              price: minPrice || 0,
              soldOut: concertTickets.length === 0,
              ticketsLeft: concertTickets.length,
              timeLeft: calculateTimeLeft(
                concert.date || "",
                concert.time || ""
              ),
            };
          })
          .sort((a, b) => {
            // Sort by tickets available (sold out last), then by date
            if (a.soldOut !== b.soldOut) return a.soldOut ? 1 : -1;
            return 0;
          });

        setCardsData(concertCards);
      } catch (error) {
        console.error("Error fetching concerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConcertsWithTickets();
  }, []);

  // Extract unique artist names for search suggestions
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    setLoading(true);
    router.replace(`/SearchResults/${encodeURIComponent(query)}`);
  };

  return (
    <div className="shadow-small-inner flex flex-col items-center pt-6 pb-10">
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
          אין קונצרטים זמינים כרגע
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
