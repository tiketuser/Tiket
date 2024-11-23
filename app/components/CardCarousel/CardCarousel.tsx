"use client";

import React, { useState } from "react";
import Card from "../Card/Card";

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

  // { id: 4, title: 'אמן נוסף', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  // { id: 5, title: 'אמן אחר', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  // { id: 6, title: 'אמנית נוספת', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  // Add more cards as needed
];

const CardCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + 1, cardsData.length - 1)
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  return (
    <div className="relative w-full pt-4 mb-24 mt-4">
      {currentIndex > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-xl bg-white p-2 rounded-full shadow-md z-10"
        >
          &#8592;
        </button>
      )}

      <div
        className="flex justify-between transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        <div className="flex gap-[15%] relative left-[3%]">
          {cardsData.map((card) => (
            <div
              key={card.id}
              className="flex-grow min-w-[250px] max-w-[300px]"
            >
              <Card {...card} />
            </div>
          ))}
        </div>
      </div>

      {currentIndex < cardsData.length - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-[3%] top-1/2 transform -translate-y-1/2 text-xl bg-white p-2 rounded-full shadow-md z-10"
        >
          &#8594;
        </button>
      )}
    </div>
  );
};

export default CardCarousel;
