"use client";

import React, { useState } from "react";
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
    imageSrc: "/images/Artist/Shlomo_Artzi.png",
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
    imageSrc: "/images/Artist/Tuna.png",
    id: 5,
    title: "טונה",
    date: "שלישי, 13 אוק’",
    location: "פארק הירקון - תל אביב",
    ticketsLeft: 17,
    priceBefore: 300,
    price: 290,
    soldOut: false,
    timeLeft: "5d 42m",
  },
  {
    imageSrc: "/images/Artist/Keren_Peles.png",
    id: 6,
    title: "קרן פלס",
    date: "חמישי, 15 אוק’",
    location: "היכל התרבות - תל אביב",
    ticketsLeft: 42,
    priceBefore: 457,
    price: 289,
    soldOut: false,
    timeLeft: "2d 42m",
  },
  {
    imageSrc: "/images/Artist/Ravid_Plotnik.png",
    id: 9,
    title: "רביד פלוטניק",
    date: "שלישי, 13 אוק’",
    location: "פארק הירקון - תל אביב",
    ticketsLeft: 17,
    priceBefore: 290,
    price: 210,
    soldOut: false,
    timeLeft: "5d 42m",
  },
  {
    imageSrc: "/images/Artist/Ron_Asael.png",
    id: 8,
    title: "מי זה",
    date: "שני, 05 דצמ'",
    location: "היכל מנורה - תל אביב",
    ticketsLeft: 19,
    priceBefore: 420,
    price: 400,
    soldOut: false,
    timeLeft: "3d 42m",
  },
  {
    imageSrc: "/images/Artist/Shlomo_Artzi.png",
    id: 9,
    title: "שלמה ארצי",
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
    imageSrc: "/images/Artist/Shlomo_Artzi.png",
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
    <div className="w-full px-1 sm:px-8 ">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block ">
        <Carousel dir="ltr" className="w-full relative-">
          <CarouselContent className="flex flex-nowrap gap-4">
            {cardsData.map((card) => (
              <CarouselItem key={card.id} dir="rtl">
                <Card {...card} />
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
      <div className="sm:hidden flex flex-wrap justify-center gap-2 w-full ">
        {cardsData.map((card) => (
          <div
            key={card.id}
            className="xs:max-w-[180px] xs:max-h-[270px] flex justify-center items-center max-w-[150px] max-h-[220px]"
          >
            <div className="xs:scale-48 scale-[0.38]">
              <Card {...card} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardCarousel;
