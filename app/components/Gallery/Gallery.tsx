"use client";

import React from "react";
import CustomSearchInput from "../CustomSearchInput/CustomSearchInput";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import ResponsiveGallery from "../TicketGallery/ResponsiveGallery";
import cardsData from "../../DemoData/cardsData"; // ייבוא רשימת הכרטיסים

const Gallery = () => {
  const router = useRouter();

  // חילוץ רשימת שמות האמנים מתוך cardsData (ללא כפילויות)
  const artistNames = [...new Set(cardsData.map((card) => card.title))];

  const handleSearch = (query: string) => {
    router.push(`/SearchResults?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="shadow-small-inner flex flex-col items-center pt-6">
      <CustomSearchInput
        id="search-bar"
        placeholder="חפש אירוע"
        image={
          <Image src={SearchIcon} alt="Search Icon" width={24} height={24} />
        }
        onEnter={handleSearch} // מבצע חיפוש ומעביר לדף התוצאות
        suggestions={artistNames} // מעביר את רשימת האמנים
      />
      <ResponsiveGallery />
    </div>
  );
};

export default Gallery;
