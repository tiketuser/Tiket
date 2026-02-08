"use client";

import React, { useState } from "react";
import cardsData from "../DemoData/cardsData";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import TitleSubtitle from "../components/TitleSubtitle/TitleSubtitle";
import SingleCard from "../components/SingleCard/SingleCard";
import ArrowIcon from "../../public/images/My Tickets/Web/Arrow.svg";
import Image from "next/image";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function MyTicketsPage() {
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPast, setShowPast] = useState(true);

  const toggleUpcomingVisibility = () => {
    setShowUpcoming((prev) => !prev);
  };

  const togglePastVisibility = () => {
    setShowPast((prev) => !prev);
  };

  return (
    <div>
      <NavBar />
      <TitleSubtitle title="הכרטיסים שלי" subtitle="כרטיסים שרכשתי" />

      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-5 md:pb-14 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={toggleUpcomingVisibility}
          className={`w-6 h-7 md:w-8 md:h-5  float-end cursor-pointer transition-transform duration-700 ${
            showUpcoming ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`mt-14 transition-all duration-700 ease-in-out ${
            showUpcoming ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showUpcoming &&
            (cardsData.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין כרטיסים קרובים
              </div>
            ) : (
              cardsData.map((card) => (
                <div key={card.id} className="flex items-center justify-center">
                  <div className="flex mb-8 w-full justify-center items-center">
                    <SingleCard
                      location={card.location}
                      date={card.date}
                      title={card.title}
                      price={card.price}
                      timeLeft={card.timeLeft}
                      buttonAction="הורד כרטיס"
                    />
                  </div>
                </div>
              ))
            ))}
        </div>
      </div>

      <TitleSubtitle title="אירועים שעברו" subtitle="כרטיסים משומשים" />
      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-16 md:pb-16 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={togglePastVisibility}
          className={`w-6 h-7 md:w-8 md:h-5  float-end cursor-pointer transition-transform duration-700 ${
            showPast ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`transition-all duration-700 ease-in-out mt-14 ${
            showPast ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showPast && (
            <div className="text-center py-8 text-gray-600">
              אין כרטיסים ישנים
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
