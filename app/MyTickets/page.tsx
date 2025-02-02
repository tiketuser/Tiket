"use client";

import React, { useState, useEffect } from "react";
import cardsData from "../DemoData/cardsData"; // Assuming you have static data
import NavBar from "../components/NavBar/NavBar";
import SingleCard from "../components/SingleCard/SingleCard";
import Footer from "../components/Footer/Footer";
import TitleSubtitle from "../components/TitleSubtitle/TitleSubtitle";
import ArrowIcon from "../../public/images/My Tickets/Web/Arrow.svg";
import Image from "next/image";

interface Props {
  params: {
    query: string;
  };
}

interface CardData {
  id: string | number;
  imageSrc: string;
  title: string;
  date: string;
  location: string;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

const MyTickets = ({ params }: Props) => {
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPurchases, setShowPurchases] = useState(true);

  // Function to toggle visibility of Upcoming cards
  const toggleUpcomingCardsVisibility = () => {
    setShowUpcoming((prevUpcoming) => !prevUpcoming);
  };

  // Function to toggle visibility of Upcoming cards
  const togglePurchasesCardsVisibility = () => {
    setShowPurchases((prevPurchases) => !prevPurchases);
  };

  // Use useEffect if you need to fetch data asynchronously
  useEffect(() => {
    // If you need to fetch data asynchronously, do it here.
    // For example, if you were fetching data:
    // async function fetchData() {
    //   const response = await fetch('/some-api');
    //   const data = await response.json();
    //   setCards(data);
    // }
    // fetchData();
  }, []); // Empty dependency array ensures this runs only once when the component mounts.

  return (
    <div>
      <NavBar />
      <TitleSubtitle title="אירועים קרובים" subtitle="אירועים שיתקיימו בקרוב" />

      <div className="pt-14 pr-32 pb-14 pl-32 gap-8 shadow-small-inner">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={toggleUpcomingCardsVisibility}
          className={`h-[18px] w-[32px] float-end cursor-pointer transition-transform duration-700 ${
            showUpcoming ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`mt-14 transition-all duration-700 ease-in-out ${
            showUpcoming ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showUpcoming &&
            cardsData.map((card) => (
              <div key={card.id} className="flex items-center justify-center">
                <div className="flex mb-8 w-full justify-center items-center">
                  <SingleCard
                    location={card.location}
                    date={card.date}
                    title={card.title}
                    price={card.price}
                    timeLeft={card.timeLeft}
                    buttonAction="צפייה בכרטיס"
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
      <TitleSubtitle title="היסטוריית רכישות" subtitle="אירועים שהסתיימו" />
      <div className="pt-14 pr-32 pb-14 pl-32 gap-8 shadow-small-inner">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={togglePurchasesCardsVisibility}
          className={`h-[18px] w-[32px] float-end cursor-pointer transition-transform duration-700 ${
            showPurchases ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`transition-all duration-700 ease-in-out mt-14 ${
            showPurchases ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showPurchases &&
            cardsData.map((card) => (
              <div key={card.id} className="flex items-center justify-center">
                <div className="flex mb-10 w-full justify-center items-center">
                  <SingleCard
                    location={card.location}
                    date={card.date}
                    title={card.title}
                    price={card.price}
                    expired={true}
                    buttonAction="צפייה בכרטיס"
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyTickets;
