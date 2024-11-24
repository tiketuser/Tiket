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
    price: 358,
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
];

const CardCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCards = 4;

  const nextSlide = () => {
    if (currentIndex < cardsData.length - visibleCards) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Arrow */}
      {currentIndex > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xl bg-white p-2 rounded-full shadow-md z-10"
        >
          &#8592;
        </button>
      )}

      {/* Cards Container */}
      <div
        dir="ltr"
        className="mb-10 mt-10 flex justify-between h-full items-center w-full transition-transform duration-300 ease-in-out"
        style={{
          // change the number for a bigger leap
          transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
        }}
      >
        {cardsData.map((card) => (
          // Increase percentage to hide the next card
          <div dir="rtl" key={card.id} className="min-w-[24%]">
            <Card {...card} />
          </div>
        ))}
      </div>
      {/* Navigation Dots */}
      <div
        dir="ltr"
        className="absolute bottom-4 left-0 right-0 flex justify-center items-center"
      >
        {cardsData.map((_, index) => (
          <button
            key={index + 2}
            className={`mx-1 rounded-full transition-all duration-300 ${
              index === currentIndex + 2
                ? "w-3 h-3 bg-mutedText"
                : "w-2 h-2 bg-weakText"
            }`}
            onClick={() => setCurrentIndex(index - 2)}
          />
        ))}
      </div>
      {/* Right Arrow */}
      {currentIndex < cardsData.length - visibleCards && (
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xl bg-white p-2 rounded-full shadow-md z-10"
        >
          &#8594;
        </button>
      )}
    </div>
  );
};

export default CardCarousel;
