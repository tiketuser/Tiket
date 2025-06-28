import React from "react";
import NavBar from "../../components/NavBar/NavBar";
import ResultSection from "../../components/ResultSection/ResultSection";
import SearchResultsClient from "./SearchResultsClient";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";

// Define CardData type here or import it
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

// Static params for SSG
export async function generateStaticParams() {
  // You may want to fetch artist names from Firestore here
  const querySnapshot = await getDocs(collection(db, "tickets"));
  const artistNames = Array.from(
    new Set(querySnapshot.docs.map((doc) => doc.data().title))
  );
  return artistNames.map((name) => ({
    query: encodeURIComponent(name),
  }));
}

const SearchResults = async ({ params }: { params: { query: string } }) => {
  const query = decodeURIComponent(params.query);

  // Fetch tickets from Firestore
  const querySnapshot = await getDocs(collection(db, "tickets"));
  const allTickets: CardData[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<CardData, "id">),
  }));

  const tickets = allTickets.filter((card) => card.title === query);

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
        <SearchResultsClient tickets={tickets} />
      </div>
    </div>
  );
};

export default SearchResults;
