import React from "react";
import cardsData from "../../DemoData/cardsData";
import RegularGallery from "../../components/TicketGallery/RegularGallery";
import NavBar from "../../components/NavBar/NavBar";
import ResultSection from "../../components/ResultSection/ResultSection";

// Add this function for static export!
export async function generateStaticParams() {
  // Get unique artist names from cardsData
  const artistNames = Array.from(new Set(cardsData.map((card) => card.title)));
  return artistNames.map((name) => ({
    query: encodeURIComponent(name),
  }));
}

const SearchResults = ({ params }: { params: { query: string } }) => {
  const query = decodeURIComponent(params.query);

  // Filter tickets based on search query
  const getSearchResults = (query: string) => {
    return cardsData.filter((card) => card.title === query);
  };

  const tickets = getSearchResults(query);

  return (
    <div>
      <NavBar />
      <div className="shadow-small-inner py-14 px-24">
        <ResultSection
          withUpperSection={true}
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
