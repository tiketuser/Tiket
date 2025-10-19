import NavBar from "../../components/NavBar/NavBar";
import SingleCard from "../../components/SingleCard/SingleCard";
import Footer from "../../components/Footer/Footer";
import EventUpperSection from "../../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../../components/SeatingMap/SeatingMap";
import { db } from "../../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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
  try {
    const decodedTitle = decodeURIComponent(params.title);

    // Check if db is available
    if (!db) {
      return (
        <div>
          <NavBar />
          <div className="text-center text-red-500 text-xl mt-20">
            מסד הנתונים לא זמין כרגע
          </div>
          <Footer />
        </div>
      );
    }

    // Query Firestore for exact title match
    const ticketsRef = collection(db, "tickets");
    const querySnapshot = await getDocs(ticketsRef);

    // Process and filter tickets
    const allTickets: CardData[] = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CardData, "id">),
      }))
      .filter(
        (card) =>
          typeof card.title === "string" &&
          card.title.trim() === decodedTitle.trim()
      );

    // If no matching events found
    if (allTickets.length === 0) {
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
          imageSrc={allTickets[0].imageSrc}
          title={allTickets[0].title}
          date={allTickets[0].date}
          location={allTickets[0].location}
          time={"20:00"}
          availableTickets={allTickets.reduce(
            (sum, event) => sum + event.ticketsLeft,
            0
          )}
        />
        <div className="flex flex-col items-center justify-center sm:pt-14 sm:pr-32 sm:pb-14 sm:pl-32 sm:gap-8 pt-8 pr-4 pb-8 pl-4 gap-4 shadow-small-inner">
          {allTickets.map((event) => (
            <div key={event.id} className="flex items-center justify-center">
              <div className="w-full">
                <SingleCard {...event} timeLeft="" buttonAction="קנה" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <SeatingMap
            title={"מפת ישיבה"}
            venueName={allTickets[0].location}
            SeatingMapsvg="/images/Event Page/Web/Seats.svg"
          />
        </div>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error fetching event:", error);
    return (
      <div>
        <NavBar />
        <div className="text-center text-red-500 text-xl mt-20">
          שגיאה בטעינת האירוע, אנא נסה שוב מאוחר יותר
        </div>
        <Footer />
      </div>
    );
  }
};

export async function generateStaticParams() {
  try {
    // Return empty array if db is not available
    if (!db) {
      return [];
    }

    const querySnapshot = await getDocs(collection(db, "tickets"));
    const titles = Array.from(
      new Set(
        querySnapshot.docs
          .map((doc) => doc.data().title)
          .filter(
            (title): title is string =>
              typeof title === "string" && title.trim() !== ""
          )
      )
    );

    return titles.map((title) => ({
      title: encodeURIComponent(title),
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default EventPage;
