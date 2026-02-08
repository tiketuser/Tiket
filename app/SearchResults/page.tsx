"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import cardsData from "../DemoData/cardsData";
import RegularGallery from "../components/TicketGallery/RegularGallery";
import NavBar from "../components/NavBar/NavBar";
import ResultSection from "../components/ResultSection/ResultSection";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  // Filter tickets based on search query
  const getSearchResults = (query: string) => {
    return cardsData.filter((card) => card.title.includes(query));
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
          artistNames={[]}
        />
        <RegularGallery cardsData={tickets} openLoginDialog={() => {}} />
      </div>
    </div>
  );
}

const SearchResults = () => {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
};

export default SearchResults;
