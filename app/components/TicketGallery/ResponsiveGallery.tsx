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
}

const ResponsiveGallery: React.FC<ResponsiveGalleryProps> = ({
  cardsData,
  openLoginDialog,
}) => {
  return (
    <div className="w-full px-1 sm:px-8 sm:mt-10 sm:mb-0 mb-20">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block ">
        <Carousel dir="ltr" className="w-full relative">
          <CarouselContent className="flex flex-nowrap gap-6 h-[600px]">
            {cardsData.map((card) => (
              <CarouselItem key={card.id} dir="rtl">
                <Link href={`/EventPage/${encodeURIComponent(card.title)}`}>
                  <Card {...card} openLoginDialog={openLoginDialog} />
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-16px]" />
          <CarouselNext className="absolute right-[-16px]" />
          <NavigationDotes />
        </Carousel>
      </div>
      {/* Layout for screens < sm */}
      <div className="sm:hidden flex flex-wrap justify-center gap-3 xs:gap-5 w-full mt-6 mb-8">
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

export default ResponsiveGallery;
