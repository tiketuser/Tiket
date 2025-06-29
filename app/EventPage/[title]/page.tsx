import NavBar from "../../components/NavBar/NavBar";
import SingleCard from "../../components/SingleCard/SingleCard";
import Footer from "../../components/Footer/Footer";
import EventUpperSection from "../../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../../components/SeatingMap/SeatingMap";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";

interface CardData {
  id: string;
  title: string;
  imageSrc: string;
  date: string;
  location: string;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
}

const EventPage = async ({ params }: { params: { title: string } }) => {
  const title = decodeURIComponent(params.title);

  // Fetch tickets from Firestore
  const querySnapshot = await getDocs(collection(db, "tickets"));
  const allTickets: CardData[] = querySnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CardData, "id">),
    }))
    .filter(
      (card) => typeof card.title === "string" && card.title.trim() !== ""
    );

  const matchingEvents = allTickets.filter(
    (card) => card.title.trim() === title.trim()
  );

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
      <div className="flex flex-col items-center justify-center sm:pt-14 sm:pr-32 sm:pb-14 sm:pl-32 sm:gap-8 pt-8 pr-4 pb-8 pl-4 gap-4 shadow-small-inner">
        {matchingEvents.map((event) => (
          <div key={event.id} className="flex items-center justify-center">
            <div className="w-full">
              <SingleCard {...event} timeLeft="" buttonAction="קנה" />
            </div>
          </div>
        ))}
      </div>
      <div className="">
        <SeatingMap
          title={"מפת ישיבה"}
          venueName={matchingEvents[0].location}
          SeatingMapsvg="/images/Event Page/Web/Seats.svg"
        />
      </div>
      <Footer />
    </div>
  );
};

export async function generateStaticParams() {
  const querySnapshot = await getDocs(collection(db, "tickets"));
  const titles = Array.from(
    new Set(
      querySnapshot.docs
        .map((doc) => doc.data().title)
        .filter((title) => typeof title === "string" && title.trim() !== "")
    )
  );
  return titles.map((title) => ({
    title: encodeURIComponent(title),
  }));
}

export default EventPage;
