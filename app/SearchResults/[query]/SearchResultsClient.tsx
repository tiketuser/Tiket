"use client";
import RegularGallery from "../../components/TicketGallery/RegularGallery";

interface CardData {
  id: string;
  title: string;
  imageSrc: string;
  date: string;
  location: string;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

export default function SearchResultsClient({
  tickets,
}: {
  tickets: CardData[];
}) {
  const openLoginDialog = () => {};

  return (
    <RegularGallery cardsData={tickets} openLoginDialog={openLoginDialog} />
  );
}
