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
  price: number;
  soldOut: boolean;
  timeLeft: string;
}

interface ResponsiveGalleryProps {
  cardsData: CardData[];
  openLoginDialog: () => void;
  userFavorites?: (string | number)[];
  hideViewMore?: boolean;
}

const ResponsiveGallery: React.FC<ResponsiveGalleryProps> = ({
  cardsData,
  openLoginDialog,
  userFavorites,
  hideViewMore,
}) => {
  // Determine if we should center the carousel (when there are 3 or fewer cards)
  const shouldCenter = cardsData.length <= 3;

  return (
    <div className="w-full px-1 sm:px-2 sm:mt-10 sm:mb-0 mb-20">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block">
        <Carousel
          dir="ltr"
          className="w-full relative"
          opts={{ align: "start", dragFree: false, duration: 25, slidesToScroll: 3 }}
        >
          <CarouselContent className="-ml-6">
            {cardsData.map((card) => (
              <CarouselItem
                key={card.id}
                dir="rtl"
                className="pl-6 basis-auto shrink-0"
              >
                <div className="w-[400px] h-[700px]">
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
        {!hideViewMore && (
          <div className="flex justify-center mt-6">
            <Link
              href="/ViewMore"
              className="px-8 py-2 rounded-full border border-primary text-primary text-text-large hover:bg-primary hover:text-white transition-colors duration-200"
            >
              גלה עוד
            </Link>
          </div>
        )}
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
