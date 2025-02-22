"use client";

import React from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import CustomSearchInput from "../components/CustomSearchInput/CustomSearchInput";
import SearchIcon from "../../public/images/SearchBar/Search Icon.svg";
import Image from "next/image";
import cardsData from "../DemoData/cardsData"; // ייבוא רשימת הכרטיסים
import { useRouter } from "next/navigation";
import TiketFilters from "../components/TiketFilters/TiketFilters";
import ResponsiveGallery from "../components/TicketGallery/ResponsiveGallery";

const ViewMore = () => {
  const router = useRouter();

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
        <ResponsiveGallery />
        <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext">
          דילים ברגע האחרון
        </h3>
        <ResponsiveGallery />
        <h3 className="text-heading-3-desktop font-extrabold mr-8 text-subtext">
          המלצות שלנו
        </h3>
        <ResponsiveGallery />
      </div>
      <Footer />
    </div>
  );
};

export default ViewMore;
