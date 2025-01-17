import React from "react";
import cardsData from "../DemoData/cardsData";
import RegularGallery from "../components/TicketGallery/RegularGallery";
import NavBar from "../components/NavBar/NavBar";
import ResultSection from "../components/ResultSection/ResultSection";
interface Props {
  params: {
    query: string;
  };
}

interface CardData {
  id: string | number;
  imageSrc: string;
  title: string;
  date: string;
  location: string;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

// To be replaced with something smarter in the future
const getSearchResults = (query: string) => {
  // Filter the tickets by the search query
  return cardsData.filter((CardData: any) => CardData.title.includes(query));
};

const SearchResults = async ({ params }: Props) => {
  const { query } = params;
  const tickets = getSearchResults(query); //change later
  return (
    <div>
      <NavBar />
      <div className="shadow-small-inner py-14 px-24">
        <ResultSection
          title={query}
          upperText="חיפשת"
          subText="אלו המופעים הקרובים של האמן שחיפשת"
        />
        <RegularGallery cardsData={tickets} />
      </div>
    </div>
  );
};

export default SearchResults;
