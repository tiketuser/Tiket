import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";
import EventUpperSection from "../../components/EventUpperSection/EventUpperSection";
import SeatingMap from "../../components/SeatingMap/SeatingMap";
import TicketListClient from "./TicketListClient";
import dynamicImport from "next/dynamic";
import { db } from "../../../firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

// Dynamically import ViewTracker to avoid SSR issues
const ViewTracker = dynamicImport(
  () => import("./ViewTracker").then((mod) => mod.ViewTracker),
  { ssr: false },
);

// Use ISR - revalidate every 30 seconds for faster cache
export const revalidate = 30;

interface Event {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageUrl?: string;
  status: string;
}

interface Ticket {
  id: string;
  eventId: string;
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

    // Step 1: Query events by artist name directly (more efficient)
    const eventsRef = collection(db, "events");
    const concertsQuery = query(
      eventsRef,
      where("artist", "==", decodedTitle),
      where("status", "==", "active"),
      limit(1), // Only get one event to save bandwidth
    );

    // Step 2: Fetch tickets in parallel for better performance
    const ticketsRef = collection(db, "tickets");
    const ticketsQuery = query(
      ticketsRef,
      where("artist", "==", decodedTitle),
      where("status", "==", "available"),
    );

    // Execute both queries in parallel
    const [eventsSnapshot, ticketsSnapshot] = await Promise.all([
      getDocs(concertsQuery),
      getDocs(ticketsQuery),
    ]);

    // Get the first matching event — explicitly pick serializable fields only
    // (spreading doc.data() would include Firestore Timestamps which can't cross the Server→Client boundary)
    const eventDoc = eventsSnapshot.docs[0];
    const concert = eventDoc
      ? (() => {
          const d = eventDoc.data();
          return {
            id: eventDoc.id,
            artist: d.artist ?? "",
            title: d.title ?? "",
            date: d.date ?? "",
            time: d.time ?? "",
            venue: d.venue ?? "",
            imageUrl: d.imageUrl ?? undefined,
            status: d.status ?? "",
          } satisfies Event;
        })()
      : null;

    // If no event found
    if (!concert) {
      return (
        <div>
          <NavBar />
          <div className="text-center text-red-500 text-xl mt-20">
            לא נמצא אירוע של {decodedTitle} 😢
          </div>
          <Footer />
        </div>
      );
    }

    // Filter tickets that match the event ID — explicitly pick serializable fields only
    const tickets: Ticket[] = ticketsSnapshot.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          eventId: d.eventId ?? "",
          artist: d.artist ?? "",
          date: d.date ?? "",
          venue: d.venue ?? "",
          time: d.time ?? "",
          section: d.section ?? "",
          row: d.row ?? null,
          seat: d.seat ?? null,
          isStanding: d.isStanding ?? false,
          askingPrice: d.askingPrice ?? 0,
          originalPrice: d.originalPrice ?? 0,
          status: d.status ?? "",
          sellerId: d.sellerId ?? "",
        } satisfies Ticket;
      })
      .filter((ticket) => ticket.eventId === concert.id);

    // If no tickets found
    if (tickets.length === 0) {
      return (
        <div>
          <NavBar />
          <EventUpperSection
            imageSrc={concert.imageUrl || "/images/Artist/default.png"}
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
        <ViewTracker eventId={concert.id} />
        <NavBar />
        <EventUpperSection
          imageSrc={concert.imageUrl || "/images/Artist/default.png"}
          title={concert.artist}
          date={concert.date}
          location={concert.venue}
          time={concert.time}
          availableTickets={tickets.length}
        />
        <TicketListClient tickets={tickets} concert={concert} />
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

    // Get only active events and limit to reduce initial load
    const eventsQuery = query(
      collection(db, "events"),
      where("status", "==", "active"),
      limit(50), // Limit for faster initial build
    );
    const concertsSnapshot = await getDocs(eventsQuery);

    // Extract unique artists more efficiently
    const artists = Array.from(
      new Set(
        concertsSnapshot.docs
          .map((doc) => doc.data().artist)
          .filter((artist): artist is string => Boolean(artist?.trim())),
      ),
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
