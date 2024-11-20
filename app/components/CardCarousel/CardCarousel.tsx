"use client";

import React, { useState } from 'react';
import Card from '../Card/Card';

const cardsData = [
  { id: 1, title: 'אלמה דוג', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: true },
  { id: 2, title: 'שלמה ארצי', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  { id: 3, title: 'נועה קירל', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  { id: 4, title: 'אמן נוסף', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  { id: 5, title: 'אמן אחר', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  { id: 6, title: 'אמנית נוספת', date: '15 אוקטובר', location: 'היכל התרבות - תל אביב', price: 358, soldOut: false },
  // Add more cards as needed
];

const CardCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, cardsData.length - 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  return (
    <div className="relative w-full max-w-[90%] mx-auto overflow-hidden pt-4">
      {currentIndex > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-xl bg-white p-2 rounded-full shadow-md z-10"
        >
          &#8592;
        </button>
      )}

      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        <div className="flex gap-4">
          {cardsData.map((card) => (
            <div key={card.id} className="flex-grow min-w-[250px] max-w-[300px]">
              <Card {...card} />
            </div>
          ))}
        </div>
      </div>

      {currentIndex < cardsData.length - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xl bg-white p-2 rounded-full shadow-md z-10"
        >
          &#8594;
        </button>
      )}
    </div>
  );
};

export default CardCarousel;
