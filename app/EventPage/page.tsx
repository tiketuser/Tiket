"use client";

import { useSearchParams } from "next/navigation";
import NavBar from "../components/NavBar/NavBar";
import SingleCard from "../components/SingleCard/SingleCard";
import Footer from "../components/Footer/Footer";
import EventUpperSection from "../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../components/SeatingMap/SeatingMap";
import cardsData from "../DemoData/cardsData";
import MinimalCard from "../components/MinimalCard/MinimalCard";

const EventPage = () => {
  const searchParams = useSearchParams();
  const title = searchParams.get("title");

  // חיפוש כל הכרטיסים עם אותו שם אירוע
  const matchingEvents = cardsData.filter((card) => card.title === title);

  // אם לא נמצאו אירועים
  if (matchingEvents.length === 0) {
    return (
      <div>
        <NavBar />
        <div className="text-center text-red-500 text-xl mt-20">
          לא נמצאו כרטיסים לאירוע הזה 😢
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <EventUpperSection
        imageSrc={matchingEvents[0].imageSrc}
        title={matchingEvents[0].title}
        date={matchingEvents[0].date}
        location={matchingEvents[0].location}
        time={"20:00"}
        availableTickets={matchingEvents.reduce(
          (sum, event) => sum + event.ticketsLeft,
          0
        )}
      />
      <div className="pt-14 pr-32 pb-14 pl-32 gap-8 shadow-small-inner">
        {matchingEvents.map((event) => (
          <div key={event.id} className="flex items-center justify-center">
            <div className="flex mb-10 w-full justify-center items-center">
              <SingleCard {...event} buttonAction="קנה" />
            </div>
          </div>
        ))}
      </div>
      <SeatingMap
        title={"מפת ישיבה"}
        venueName={matchingEvents[0].location}
        SeatingMapsvg="/images/Event Page/Web/Seats.svg"
      />
      <Footer />
    </div>
  );
};

export default EventPage;
