"use client";

import { useState } from "react";
import ResultSection from "../../components/ResultSection/ResultSection";
import SearchResultsClient from "./SearchResultsClient";
import { DateRange } from "react-day-picker";

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

interface FilterState {
  cities: string[];
  venues: string[];
  dateRange: DateRange | undefined;
  priceRange: number[];
}

interface SearchResultsWrapperProps {
  query: string;
  tickets: CardData[];
  artistNames: string[];
}

export default function SearchResultsWrapper({
  query,
  tickets,
  artistNames,
}: SearchResultsWrapperProps) {
  const [filteredTickets, setFilteredTickets] = useState<CardData[]>(tickets);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    cities: [],
    venues: [],
    dateRange: undefined,
    priceRange: [0, 1000],
  });

  // Apply filters to tickets
  const applyFilters = (
    concerts: CardData[],
    filters: FilterState
  ): CardData[] => {
    return concerts.filter((concert) => {
      // Filter by cities
      if (filters.cities.length > 0) {
        if (!filters.cities.includes(concert.location)) {
          return false;
        }
      }

      // Filter by venues
      if (filters.venues.length > 0) {
        if (!filters.venues.includes(concert.location)) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const normalizedDate = concert.date.replace(/\./g, "/");
        const concertDate = new Date(
          normalizedDate.split("/").reverse().join("-")
        );
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (concertDate < fromDate || concertDate > toDate) {
          return false;
        }
      }

      // Filter by price range
      if (
        concert.price < filters.priceRange[0] ||
        concert.price > filters.priceRange[1]
      ) {
        return false;
      }

      return true;
    });
  };

  // Handle filter changes
  const handleFilterChange = (filters: FilterState) => {
    setActiveFilters(filters);
    const filtered = applyFilters(tickets, filters);
    setFilteredTickets(filtered);
  };

  // Check if any filters are active
  const hasActiveFilters =
    activeFilters.cities.length > 0 ||
    activeFilters.venues.length > 0 ||
    activeFilters.dateRange !== undefined ||
    activeFilters.priceRange[0] !== 0 ||
    activeFilters.priceRange[1] !== 1000;

  // Use filtered tickets if filters are active, otherwise use all tickets
  const displayTickets = hasActiveFilters ? filteredTickets : tickets;

  const openLoginDialog = () => {};

  return (
    <div className="shadow-small-inner py-14 px-24">
      <ResultSection
        withUpperSection={true}
        title={query}
        upperText="חיפשת"
        subText="אלו המופעים הקרובים של האמן שחיפשת"
        artistNames={artistNames}
        onFilterChange={handleFilterChange}
      />
      {displayTickets.length === 0 && hasActiveFilters ? (
        <div className="text-center text-gray-500 text-xl mt-10 mb-10">
          לא נמצאו אירועים התואמים את הסינון
        </div>
      ) : (
        <SearchResultsClient tickets={displayTickets} />
      )}
    </div>
  );
}
