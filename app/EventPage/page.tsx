import React from "react";
import cardsData from "../DemoData/cardsData";
import NavBar from "../components/NavBar/NavBar";
import SingleCard from "../components/SingleCard/SingleCard";
import Footer from "../components/Footer/Footer";
import EventUpperSection from "../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../components/SeatingMap/SeatingMap";
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

const getEventPage = (query: number) => {
  // Filter the tickets by the given query ID
  return cardsData.filter((CardData: any) => CardData.id === query);
};

const EventPage = async ({ params }: Props) => {
  const { query } = params;
  const tickets = getEventPage(1); //Enter Id of card
  return (
    <div>
      <NavBar />
      <EventUpperSection
        imageSrc={"/images/Artist/Alma_Gov.png"}
        title={"עלמה גוב"}
        date={"חמישי, 15 אוק’"}
        location={"היכל התרבות - תל אביב"}
        time={"20:00"}
        availableTickets={3}
      />
      <div className="pt-14 pr-32 pb-14 pl-32 gap-8 shadow-small-inner">
        {cardsData.map((card) => (
          <div key={card.id} className="flex items-center justify-center">
            <div className="flex mb-10 w-full justify-center items-center">
              <SingleCard {...card} buttonAction="קנה" />
            </div>
          </div>
        ))}
      </div>
      <SeatingMap
        title={"מפת ישיבה"}
        venueName={"היכל התרבות - תל אביב"}
        SeatingMapsvg="/images/Event Page/Web/Seats.svg"
      />
      <Footer />
    </div>
  );
};

export default EventPage;
