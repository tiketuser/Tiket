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
    price: 788,
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
    title: "נועה נועה נועה נועה קירל",
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
    imageSrc: "/images/Artist/Noa_Kirel.png",
    id: 5,
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
    imageSrc: "/images/Artist/Alma_Gov.png",
    id: 6,
    title: "עלמה גוב",
    date: "חמישי, 15 אוק’",
    location: "היכל התרבות - תל אביב",
    ticketsLeft: 42,
    priceBefore: 457,
    price: 289,
    soldOut: false,
    timeLeft: "2d 42m",
  },
  {
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 7,
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
    id: 8,
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
    imageSrc: "/images/Artist/Noa_Kirel.png",
    id: 9,
    title: "נועה קירל",
    date: "שלישי, 13 אוק’",
    location: "פארק הירקון - תל אביב",
    ticketsLeft: 17,
    priceBefore: 290,
    price: 210,
    soldOut: false,
    timeLeft: "5d 42m",
  },
  {
    imageSrc: "/images/Artist/Alma_Gov.png",
    id: 10,
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
    imageSrc: "/images/Artist/Omer_Adam.png",
    id: 11,
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
    imageSrc: "/images/Artist/Alma_Gov.png",
    id: 1,
    title: "עלמה גוב",
    date: "חמישי, 15 אוק’",
    location: "היכל התרבות - תל אביב",
    ticketsLeft: 42,
    priceBefore: 457,
    price: 788,
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
    title: "נועה נועה נועה נועה קירל",
    date: "שלישי, 13 אוק’",
    location: "פארק הירקון - תל אביב",
    ticketsLeft: 17,
    priceBefore: 250,
    price: 210,
    soldOut: false,
    timeLeft: "5d 42m",
  },
];

const CardCarousel: React.FC = () => {
  return (
    <div className="w-full px-8">
      {" "}
      {/* Adds 32px padding on the edges */}
      <Carousel dir="ltr" className="w-full relative">
        {/* Change gap property for changing distance between the cards */}
        <CarouselContent className="flex mt-8 mb-10 gap-8">
          {cardsData.map((card) => (
            <CarouselItem key={card.id} className="" dir="rtl">
              <Card {...card} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-0" />
        <CarouselNext className="absolute right-0" />
      </Carousel>
    </div>
  );
};

export default CardCarousel;
