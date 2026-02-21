"use client";

import Card from "../Card/Card";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  NavigationDotes,
} from "@/components/ui/carousel";

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

interface ResponsiveGalleryProps {
  cardsData: CardData[];
  openLoginDialog: () => void;
  userFavorites?: (string | number)[];
}

const ResponsiveGallery: React.FC<ResponsiveGalleryProps> = ({
  cardsData,
  openLoginDialog,
  userFavorites,
}) => {
  // Determine if we should center the carousel (when there are 3 or fewer cards)
  const shouldCenter = cardsData.length <= 3;

  return (
    <div className="w-full px-1 sm:px-8 sm:mt-10 sm:mb-0 mb-20">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block">
        <Carousel dir="ltr" className="w-full relative">
          <CarouselContent
            className={`flex flex-nowrap gap-6 ${
              shouldCenter ? "justify-center" : ""
            }`}
          >
            {cardsData.map((card) => (
              <CarouselItem
                key={card.id}
                dir="rtl"
                className={`basis-1/3 ${shouldCenter ? "lg:basis-auto" : ""}`}
              >
                <div className="w-[392px] h-[700px]">
                  <Card
                    {...card}
                    openLoginDialog={openLoginDialog}
                    userFavorites={userFavorites}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-16px]" />
          <CarouselNext className="absolute right-[-16px]" />
          <NavigationDotes />
        </Carousel>
        <div className="flex justify-center mt-6">
          <Link
            href="/ViewMore"
            className="hover:text-primary-dark text-text-large transition-colors"
          >
            גלה עוד
          </Link>
        </div>
      </div>
      {/* Grid Layout for screens < sm - 2 cards per row */}
      <div className="sm:hidden grid grid-cols-2 gap-2 w-full px-1 mt-4 mb-6">
        {cardsData.map((card) => (
          <div key={card.id} className="w-full">
            <Card
              {...card}
              openLoginDialog={openLoginDialog}
              userFavorites={userFavorites}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveGallery;
