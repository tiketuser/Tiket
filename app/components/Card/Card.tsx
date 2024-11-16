// components/Card.tsx
import React from "react";

interface CardProps {
  title: string;
  date: string;
  location: string;
  price: number;
  soldOut: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  date,
  location,
  price,
  soldOut,
}) => {
  return (
    <div className="relative p-4 bg-white shadow-lg rounded-lg">
      {soldOut && (
        <div className="absolute top-0 left-0 bg-red-600 text-white text-xs p-1 rounded-tr-lg rounded-bl-lg">
          Sold Out
        </div>
      )}
      <img
        src="https://via.placeholder.com/300x200"
        alt={title}
        className="w-full h-48 object-cover rounded-lg mb-4"
      />
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-600">{date}</p>
      <p className="text-sm text-gray-600">{location}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="text-lg font-semibold text-gray-800">{price} ₪</span>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200">
          Buy
        </button>
      </div>
    </div>
  );
};

export default Card;
