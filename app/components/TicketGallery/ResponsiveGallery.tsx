"use client";

import Card from "../Card/Card";
import Arrow from "../../../public/images/Home Page/Web/Arrow-1.svg";
import Image from "next/image";
import Link from "next/link";
import cardsData from "@/app/DemoData/cardsData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  NavigationDotes,
} from "@/components/ui/carousel";

const ResponsiveGallery: React.FC = () => {
  return (
    <div className="w-full px-1 sm:px-8 mt-10">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block ">
        <Carousel dir="ltr" className="w-full relative">
          <CarouselContent className="flex flex-nowrap gap-6 h-[600px]">
            {cardsData.map((card) => (
              <CarouselItem key={card.id} dir="rtl">
                <Link href="/EventPage">
                  <Card {...card} />
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

      {/* layout for screens < sm (SmartPhoens) */}
      <div className="sm:hidden flex flex-wrap justify-center gap-3 xs:gap-5 w-full mt-6 mb-8">
        {cardsData.map((card) => (
          <div
            key={card.id}
            className="xs:max-w-[160px] xs:max-h-[260px] flex justify-center items-center max-w-[155px] max-h-[245px]"
          >
            <div className="xs:scale-[0.43] scale-[0.39]">
              <Card {...card} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveGallery;
