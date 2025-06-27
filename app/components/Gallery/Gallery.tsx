"use client";

import React, { useState, useEffect } from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import ResponsiveGallery from "../TicketGallery/ResponsiveGallery";
import { db, collection, getDocs } from "../../../firebase";
import LoginDialog from "../Dialogs/LoginDialog/LoginDialog";

const Gallery = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cardsData, setCardsData] = useState<any[]>([]);
  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);

  // Fetch tickets from Firestore
  useEffect(() => {
    const fetchTickets = async () => {
      const querySnapshot = await getDocs(collection(db, "tickets"));
      const tickets = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCardsData(tickets);
    };
    fetchTickets();
  }, []);

  // Extract unique artist names
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    setLoading(true);
    router.replace(`/SearchResults/${encodeURIComponent(query)}`);
  };

  return (
    <div className="shadow-small-inner flex flex-col items-center pt-6">
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
      {!loading && (
        <ResponsiveGallery
          cardsData={cardsData}
          openLoginDialog={() => setLoginDialogOpen(true)}
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
