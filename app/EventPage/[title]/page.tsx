import NavBar from "../../components/NavBar/NavBar";
import SingleCard from "../../components/SingleCard/SingleCard";
import Footer from "../../components/Footer/Footer";
import EventUpperSection from "../../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../../components/SeatingMap/SeatingMap";
import { db } from "../../../firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

// Enable dynamic rendering with revalidation
export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds for faster cache

interface Concert {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageData?: string;
  status: string;
}

interface Ticket {
  id: string;
  concertId: string;
  artist: string;
  date: string;
  venue: string;
  time: string;
  section: string;
  row: number | null;
  seat: number | null;
  isStanding: boolean;
  askingPrice: number;
  originalPrice: number;
  status: string;
  sellerId: string;
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

    // Step 1: Query concerts by artist name directly (more efficient)
    const concertsRef = collection(db, "concerts");
    const concertsQuery = query(
      concertsRef,
      where("artist", "==", decodedTitle),
      where("status", "==", "active"),
      limit(1) // Only get one concert to save bandwidth
    );

    // Step 2: Fetch tickets in parallel for better performance
    const ticketsRef = collection(db, "tickets");
    const ticketsQuery = query(
      ticketsRef,
      where("artist", "==", decodedTitle),
      where("status", "==", "available")
    );

    // Execute both queries in parallel
    const [concertsSnapshot, ticketsSnapshot] = await Promise.all([
      getDocs(concertsQuery),
      getDocs(ticketsQuery),
    ]);

    // Get the first matching concert
    const concert =
      concertsSnapshot.docs.length > 0
        ? {
            id: concertsSnapshot.docs[0].id,
            ...(concertsSnapshot.docs[0].data() as Omit<Concert, "id">),
          }
        : null;

    // If no concert found
    if (!concert) {
      return (
        <div>
          <NavBar />
          <div className="text-center text-red-500 text-xl mt-20">
            לא נמצא קונצרט של {decodedTitle} 😢
          </div>
          <Footer />
        </div>
      );
    }

    // Filter tickets that match the concert ID (since we queried by artist)
    const tickets: Ticket[] = ticketsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Ticket, "id">),
      }))
      .filter((ticket) => ticket.concertId === concert.id);

    // If no tickets found
    if (tickets.length === 0) {
      return (
        <div>
          <NavBar />
          <EventUpperSection
            imageSrc={concert.imageData || "/images/Artist/default.png"}
            title={concert.artist}
            date={concert.date}
            location={concert.venue}
            time={concert.time}
            availableTickets={0}
          />
          <div className="text-center text-red-500 text-xl mt-20 mb-20">
            לא נמצאו כרטיסים זמינים לאירוע הזה 😢
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div>
        <NavBar />
        <EventUpperSection
          imageSrc={concert.imageData || "/images/Artist/default.png"}
          title={concert.artist}
          date={concert.date}
          location={concert.venue}
          time={concert.time}
          availableTickets={tickets.length}
        />
        <div className="flex flex-col items-center justify-center sm:pt-14 sm:pr-32 sm:pb-14 sm:pl-32 sm:gap-8 pt-8 pr-4 pb-8 pl-4 gap-4 shadow-small-inner">
          {tickets.map((ticket) => {
            // Format seat location more efficiently
            const seatLocation = ticket.isStanding
              ? `עמידה - ${ticket.section}`
              : `מושב ${ticket.section}${ticket.row ? `-${ticket.row}` : ""}${
                  ticket.seat ? `-${ticket.seat}` : ""
                }`;

            return (
              <div key={ticket.id} className="flex items-center justify-center">
                <div className="w-full">
                  <SingleCard
                    title={concert.artist}
                    imageSrc={concert.imageData || "/images/Artist/default.png"}
                    date={concert.date}
                    location={concert.venue}
                    seatLocation={seatLocation}
                    priceBefore={ticket.originalPrice}
                    price={ticket.askingPrice}
                    soldOut={false}
                    ticketsLeft={tickets.length}
                    timeLeft=""
                    buttonAction="קנה"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <SeatingMap
          title={"מפת ישיבה"}
          venueName={concert.venue}
          SeatingMapsvg="/images/Event Page/Web/Seats.svg"
        />
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

    // Get only active concerts and limit to reduce initial load
    const concertsQuery = query(
      collection(db, "concerts"),
      where("status", "==", "active"),
      limit(50) // Limit for faster initial build
    );
    const concertsSnapshot = await getDocs(concertsQuery);

    // Extract unique artists more efficiently
    const artists = Array.from(
      new Set(
        concertsSnapshot.docs
          .map((doc) => doc.data().artist)
          .filter((artist): artist is string => Boolean(artist?.trim()))
      )
    );

    return artists.map((artist) => ({
      title: encodeURIComponent(artist),
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default EventPage;
