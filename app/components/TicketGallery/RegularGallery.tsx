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
    <div className="w-full px-1 sm:px-8 mt-10">
      {/* layout for screens < sm (SmartPhoens) */}
      <div className="flex flex-wrap justify-center gap-3 xs:gap-5 w-full mt-6 mb-8">
        {cardsData.map((card) => (
          <div
            key={card.id}
            className="flex justify-center items-center lg:max-w-[600px] lg:max-h-[600px] sm:max-w-[155px] sm:max-h-[245px] xs:max-w-[160px] xs:max-h-[260px] "
          >
            <div className="xs:scale-[0.43] lg:scale-[0.90] scale-[0.39]">
              <Card {...card} openLoginDialog={openLoginDialog} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegularGallery;
