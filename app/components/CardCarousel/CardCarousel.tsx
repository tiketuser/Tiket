"use client";

import React from "react";
import Card from "../Card/Card";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const cardsData = [
  {
    imageSrc: "/images/Artist/Alma_Gov.png",
    id: 1,
    title: "עלמה גוב",
    date: "חמישי, 15 אוק’",
    location: "היכל התרבות - תל אביב",
    ticketsLeft: 42,
    priceBefore: 457,
    price: 358,
    soldOut: false,
    timeLeft: "2d 42m",
  },
  {
    imageSrc: "/images/Artist/Shlomo_Artzi.jpg",
    id: 2,
    title: "שלמה ארצי",
    date: "שבת, 17 אוק’",
    location: "קיסריה",
    ticketsLeft: 34,
    priceBefore: 350,
    price: 320,
    soldOut: false,
    timeLeft: "12d 42m",
  },
  {
    imageSrc: "/images/Artist/Noa_Kirel.png",
    id: 3,
    title: "נועה קירל",
    date: "שלישי, 13 אוק’",
    location: "פארק הירקון - תל אביב",
    ticketsLeft: 17,
    priceBefore: 250,
    price: 210,
    soldOut: false,
    timeLeft: "5d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 4,
    title: "עומר אדם",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 4,
    title: "עומר אדם",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 4,
    title: "עומר אדם",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 4,
    title: "עומר אדם",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 4,
    title: "עומר אדם",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 4,
    title: "עומר אדם",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  }
];

const CardCarousel: React.FC = () => {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: false
      }}
      dir="ltr"
      className="flex justify-center items-center w-full m-4"
    >
      
      <CarouselContent className="gap-5">
        {cardsData.map((card) => (
          <CarouselItem
            key={card.id}
            className="sm:basis-full md:basis-1/2 xl:basis-1/3 2xl:basis-1/4 max-w-[392px]"
          >
            <div>
              <Card {...card} />
            </div>
            
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-5"/>
      <CarouselNext className="absolute right-5"/>
    </Carousel>
  );
};

export default CardCarousel;
