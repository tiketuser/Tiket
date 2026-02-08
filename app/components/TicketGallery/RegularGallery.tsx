"use client";

import Card from "../Card/Card";

interface CardData {
  imageSrc: string;
  id: string | number;
  title: string;
  date: string;
  location: string;
  ticketsLeft: number;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  timeLeft: string;
}

interface RegularGalleryProps {
  cardsData: CardData[];
  openLoginDialog: () => void;
}

const RegularGallery: React.FC<RegularGalleryProps> = ({
  cardsData,
  openLoginDialog,
}) => {
  return (
    <div className="w-full px-0 sm:px-8 sm:mt-10 sm:mb-0 mb-20">
      {/* Grid Layout for desktop */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {cardsData.map((card) => (
          <div key={card.id} className="w-full">
            <Card {...card} openLoginDialog={openLoginDialog} />
          </div>
        ))}
      </div>
      {/* Grid Layout for screens < sm - 2 cards per row */}
      <div className="sm:hidden grid grid-cols-2 gap-3 w-full">
        {cardsData.map((card) => (
          <div key={card.id} className="w-full">
            <Card {...card} openLoginDialog={openLoginDialog} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegularGallery;
