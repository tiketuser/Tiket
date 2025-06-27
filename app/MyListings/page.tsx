"use client";

import React, { useState, useEffect } from "react";
import cardsData from "../DemoData/cardsData"; // Assuming you have static data
import NavBar from "../components/NavBar/NavBar";
import SingleCard from "../components/SingleCard/SingleCard";
import Footer from "../components/Footer/Footer";
import TitleSubtitle from "../components/TitleSubtitle/TitleSubtitle";
import ArrowIcon from "../../public/images/My Tickets/Web/Arrow.svg";
import Image from "next/image";

// interface Props {
//   params: {
//     query: string;
//   };
// }

// interface CardData {
//   id: string | number;
//   imageSrc: string;
//   title: string;
//   date: string;
//   location: string;
//   priceBefore: number;
//   price: number;
//   soldOut: boolean;
//   ticketsLeft: number;
//   timeLeft: string;
// }

const MyListings = () => {
  const [showLivePosts, setShowLivePosts] = useState(true);
  const [showSold, setShowSold] = useState(true);

  // Function to toggle visibility of LivePosts cards
  const toggleLivePostsCardsVisibility = () => {
    setShowLivePosts((prevLivePosts) => !prevLivePosts);
  };

  // Function to toggle visibility of LivePosts cards
  const toggleSoldCardsVisibility = () => {
    setShowSold((prevSold) => !prevSold);
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
      <TitleSubtitle title="המודעות שלי" subtitle="מודעות שבאוויר" />

      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-5 md:pb-14 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={toggleLivePostsCardsVisibility}
          className={`w-6 h-7 md:w-8 md:h-5  float-end cursor-pointer transition-transform duration-700 ${
            showLivePosts ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`mt-14 transition-all duration-700 ease-in-out ${
            showLivePosts ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showLivePosts &&
            cardsData.map((card) => (
              <div key={card.id} className="flex items-center justify-center">
                <div className="flex mb-8 w-full justify-center items-center">
                  <SingleCard
                    location={card.location}
                    date={card.date}
                    title={card.title}
                    price={card.price}
                    timeLeft={card.timeLeft}
                    buttonAction="ביטול מכירה"
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <TitleSubtitle title="היסטוריית מכירות" subtitle="אירועים שנמכרו" />
      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-16 md:pb-16 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={toggleSoldCardsVisibility}
          className={`w-6 h-7 md:w-8 md:h-5  float-end cursor-pointer transition-transform duration-700 ${
            showSold ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`transition-all duration-700 ease-in-out mt-14 ${
            showSold ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showSold &&
            cardsData.map((card) => (
              <div key={card.id} className="flex items-center justify-center">
                <div className="flex mb-10 w-full justify-center items-center">
                  <SingleCard
                    location={card.location}
                    date={card.date}
                    title={card.title}
                    price={card.price}
                    tag="Sold"
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

export default MyListings;
