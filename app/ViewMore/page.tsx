"use client";

import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import CustomSearchInput from "../components/CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../public/images/SearchBar/Search Icon.svg";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // Adjust the path if needed
import { useRouter } from "next/navigation";
import TiketFilters from "../components/TiketFilters/TiketFilters";
import ResponsiveGallery from "../components/TicketGallery/ResponsiveGallery";

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
  // Add any other fields your cards use
}

const ViewMore = () => {
  const router = useRouter();
  const [cardsData, setCardsData] = useState<CardData[]>([]);
  // Add this state if you want to actually open a login dialog
  // const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);

  // Define the function once
  const openLoginDialog = () => {
    // setLoginDialogOpen(true);
    // Or leave empty if you don't have a dialog yet
  };

  // Fetch tickets from Firestore
  useEffect(() => {
    const fetchTickets = async () => {
      const querySnapshot = await getDocs(collection(db, "tickets"));
      const tickets: CardData[] = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<CardData, "id">),
        id: doc.id,
      }));
      setCardsData(tickets);
    };
    fetchTickets();
  }, []);

  // חילוץ רשימת שמות האמנים מתוך cardsData (ללא כפילויות)
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    router.push(`/SearchResults?query=${encodeURIComponent(query)}`);
  };
  return (
    <div>
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
            onEnter={handleSearch} // מבצע חיפוש ומעביר לדף התוצאות
            suggestions={artistNames} // מעביר את רשימת האמנים
          />
        </div>

        <TiketFilters />
        <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext">
          נצפה לאחרונה
        </h3>
        <ResponsiveGallery
          cardsData={cardsData}
          openLoginDialog={openLoginDialog}
        />
        <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext">
          דילים ברגע האחרון
        </h3>
        <ResponsiveGallery
          cardsData={cardsData}
          openLoginDialog={openLoginDialog}
        />
        <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext">
          המלצות שלנו
        </h3>
        <ResponsiveGallery
          cardsData={cardsData}
          openLoginDialog={openLoginDialog}
        />
      </div>
      <Footer />
      {/* 
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      /> 
      */}
    </div>
  );
};

export default ViewMore;
