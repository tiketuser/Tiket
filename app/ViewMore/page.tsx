import React from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import CustomInput from "../components/CustomInput/CustomInput";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import Image from "next/image";
import cardsData from "../DemoData/cardsData"; // ייבוא רשימת הכרטיסים
import { useRouter } from "next/router";

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
      <CustomInput
        id="search-bar"
        placeholder="חפש אירוע"
        image={
          <Image src={SearchIcon} alt="Search Icon" width={24} height={24} />
        }
        onEnter={handleSearch} // מבצע חיפוש ומעביר לדף התוצאות
        suggestions={artistNames} // מעביר את רשימת האמנים
      />

      <Footer />
    </div>
  );
};

export default ViewMore;
