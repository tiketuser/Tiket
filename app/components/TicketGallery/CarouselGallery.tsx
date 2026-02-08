"use client";

import Card from "../Card/Card";
import Arrow from "../../../public/images/Home Page/Web/Arrow-1.svg";
import Image from "next/image";
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

interface RegularGalleryProps {
  cardsData: CardData[];
  openLoginDialog: () => void;
  userFavorites?: (string | number)[];
}

const CardCarousel: React.FC<RegularGalleryProps> = ({
  cardsData,
  openLoginDialog,
  userFavorites,
}) => {
  return (
    <div className="w-full px-1 sm:px-8 mt-10">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block ">
        <Carousel dir="ltr" className="w-full relative">
          <CarouselContent className="flex flex-nowrap gap-6 h-[600px]">
            {cardsData.map((card) => (
              <CarouselItem key={card.id} dir="rtl">
                <Link href={`/EventPage/${encodeURIComponent(card.title)}`}>
                  <Card
                    {...card}
                    openLoginDialog={openLoginDialog}
                    userFavorites={userFavorites}
                  />
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-16px]" />
          <CarouselNext className="absolute right-[-16px]" />
          <NavigationDotes />
        </Carousel>

        <div className="flex justify-center mt-6 mb-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-text-medium font-light text-center">
              גלה עוד
            </span>
            <Image src={Arrow} alt="Arrow Icon" width={9} height={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CardCarousel;
