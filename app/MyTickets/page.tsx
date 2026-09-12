"use client";

import React, { useState, useEffect } from "react";
import { formatSeatLocation } from "../utils/categoryConfig";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import TitleSubtitle from "../components/TitleSubtitle/TitleSubtitle";
import MyTicketCard from "../components/MyTicketCard/MyTicketCard";
import MobileMyTickets, {
  type MobileTicket,
} from "../components/mobile/MobileMyTickets";
import TicketBarcode from "../components/TicketBarcode/TicketBarcode";
import { isEventPast } from "@/utils/eventDate";
import { demoBarcodeValue, DEMO_BARCODE_FORMAT } from "@/utils/demoBarcode";
import ArrowIcon from "../../public/images/My Tickets/Web/Arrow.svg";
import Image from "next/image";


interface PurchasedTicket {
  id: string; // transaction id
  ticketId: string;
  artist: string;
  date: string;
  venue: string;
  time?: string;
  category?: string;
  section?: string;
  block?: string;
  row?: string;
  seat?: string;
  isStanding?: boolean;
  amount: number;
  ticketImage?: string;
  eventImageUrl?: string;
  /** Re-issued entry barcode from the provider (the original was voided). */
  newBarcode?: string;
  newBarcodeFormat?: string;
}

// Skeleton row mirroring the desktop MyTicketCard layout (date · divider ·
// info · divider · price · button) so the swap to real tickets is seamless.
function WebTicketCardSkeleton() {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="flex flex-row items-center justify-between border-b-4 border-gray-200 pt-4 pr-8 pb-4 pl-6 gap-4 sm:gap-6 md:gap-12 lg:gap-14 shadow-large flex-1 max-w-[700px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] min-h-[100px] md:min-h-[128px] bg-white">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center gap-2 min-w-[60px] flex-shrink-0">
          <div className="h-7 w-10 rounded bg-gray-200" />
          <div className="h-3 w-8 rounded bg-gray-200" />
        </div>
        <div className="w-[3px] h-20 md:h-24 bg-gray-200 flex-shrink-0" />
        {/* Event info */}
        <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
          <div className="h-5 w-2/5 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-6 w-28 rounded-md bg-gray-200" />
        </div>
        <div className="w-[3px] h-20 md:h-24 bg-gray-200 flex-shrink-0" />
        {/* Price */}
        <div className="min-w-[70px] md:min-w-[130px] flex-shrink-0 flex justify-center">
          <div className="h-7 w-16 rounded bg-gray-200" />
        </div>
        {/* Button */}
        <div className="h-[36px] md:h-[40px] min-w-[80px] md:min-w-[100px] rounded-md bg-gray-200 flex-shrink-0" />
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPast, setShowPast] = useState(true);
  const [viewTicket, setViewTicket] = useState<PurchasedTicket | null>(null);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      if (user) {
        setSignedIn(true);
        // Reset when switching accounts so the incoming user never briefly sees
        // the previous user's tickets.
        setLoading(true);
        setTickets([]);
        fetchMyTickets(user.uid);
      } else {
        setSignedIn(false);
        setLoading(false);
        setTickets([]);
      }
    });
    return () => unsubscribe?.();
  }, []);

  const fetchMyTickets = async (uid: string) => {
    try {
      if (!db) return;

      const txQuery = query(
        collection(db as any, "transactions"),
        where("buyerId", "==", uid),
        where("status", "==", "completed")
      );
      const txSnapshot = await getDocs(txQuery);

      const purchased: PurchasedTicket[] = [];

      await Promise.all(
        txSnapshot.docs.map(async (txDoc) => {
          const tx = txDoc.data();
          if (!tx.ticketId) return;

          const ticketSnap = await getDoc(doc(db as any, "tickets", tx.ticketId));
          if (!ticketSnap.exists()) return;

          const ticket = ticketSnap.data();
          let eventImageUrl: string | undefined;
          if (ticket.eventId) {
            try {
              const eventSnap = await getDoc(
                doc(db as any, "events", ticket.eventId as string),
              );
              if (eventSnap.exists()) {
                const ev = eventSnap.data();
                const img = ev?.imageUrl;
                if (typeof img === "string" && !img.startsWith("data:")) {
                  eventImageUrl = img;
                }
              }
            } catch {
              // ignore missing event lookups
            }
          }
          const transfer = ticket.ownershipTransfer;
          const newBarcode =
            transfer?.status === "transferred" && transfer.newBarcode
              ? String(transfer.newBarcode)
              : undefined;

          purchased.push({
            id: txDoc.id,
            ticketId: tx.ticketId,
            artist: ticket.artist || "",
            date: ticket.date || "",
            venue: ticket.venue || "",
            time: ticket.time,
            category: ticket.category,
            section: ticket.section,
            block: ticket.block,
            row: ticket.row,
            seat: ticket.seat,
            isStanding: ticket.isStanding,
            amount: tx.ticketPrice || tx.amount,
            ticketImage: ticket.ticketImage || null,
            eventImageUrl,
            newBarcode,
            newBarcodeFormat:
              newBarcode && transfer.newBarcodeFormat
                ? String(transfer.newBarcodeFormat)
                : undefined,
          });
        })
      );

      setTickets(purchased);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingTickets = tickets.filter((t) => !isEventPast(t.date));
  const pastTickets = tickets.filter((t) => isEventPast(t.date));

  const seatLabel = (t: PurchasedTicket) =>
    formatSeatLocation({
      category: t.category,
      section: t.section,
      block: t.block,
      row: t.row,
      seat: t.seat,
      isStanding: t.isStanding,
    });

  const mobileTickets: MobileTicket[] = tickets.map((t) => ({
    id: t.id,
    artist: t.artist,
    date: t.date,
    time: t.time,
    venue: t.venue,
    section: t.section,
    block: t.block,
    row: t.row,
    seat: t.seat,
    isStanding: t.isStanding,
    amount: t.amount,
    ticketImage: t.ticketImage,
    eventImageUrl: t.eventImageUrl,
    newBarcode: t.newBarcode,
    newBarcodeFormat: t.newBarcodeFormat,
  }));

  if (loading) {
    return (
      <>
        <MobileMyTickets tickets={[]} loading={true} />
        <div className="hidden md:block">
          <NavBar />
          <TitleSubtitle title="הכרטיסים שלי" subtitle="כרטיסים שרכשתי" />
          <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-5 md:pb-14 shadow-small-inner w-full">
            <div className="mt-14 flex flex-col gap-4 animate-pulse">
              {[0, 1, 2].map((i) => (
                <WebTicketCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <MobileMyTickets
        tickets={mobileTickets}
        loading={false}
        notSignedIn={signedIn === false}
      />
      <div className="hidden md:block">
      <NavBar />
      <TitleSubtitle title="הכרטיסים שלי" subtitle="כרטיסים שרכשתי" />

      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-5 md:pb-14 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={() => setShowUpcoming((prev) => !prev)}
          className={`w-6 h-7 md:w-8 md:h-5 float-end cursor-pointer transition-transform duration-700 ${
            showUpcoming ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`mt-14 transition-all duration-700 ease-in-out ${
            showUpcoming ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showUpcoming &&
            (upcomingTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין כרטיסים קרובים
              </div>
            ) : (
              upcomingTickets.map((ticket) => (
                <div key={ticket.id} className="mb-4 w-full">
                  <MyTicketCard
                    artist={ticket.artist}
                    date={ticket.date}
                    time={ticket.time}
                    venue={ticket.venue}
                    price={ticket.amount}
                    seatLabel={seatLabel(ticket)}
                    buttonLabel="צפייה בכרטיס"
                    onButtonClick={() => setViewTicket(ticket)}
                  />
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
          onClick={() => setShowPast((prev) => !prev)}
          className={`w-6 h-7 md:w-8 md:h-5 float-end cursor-pointer transition-transform duration-700 ${
            showPast ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`transition-all duration-700 ease-in-out mt-14 ${
            showPast ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showPast &&
            (pastTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין כרטיסים ישנים
              </div>
            ) : (
              pastTickets.map((ticket) => (
                <div key={ticket.id} className="mb-4 w-full">
                  <MyTicketCard
                    artist={ticket.artist}
                    date={ticket.date}
                    time={ticket.time}
                    venue={ticket.venue}
                    price={ticket.amount}
                    seatLabel={seatLabel(ticket)}
                    tag="עבר"
                    buttonLabel="צפייה בכרטיס"
                    onButtonClick={() => setViewTicket(ticket)}
                  />
                </div>
              ))
            ))}
        </div>
      </div>
      <Footer />
      </div>

      {/* Ticket viewer dialog */}
      {viewTicket && (
        <div
          className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/60 p-4"
          onClick={() => setViewTicket(null)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-xl shadow-large w-full max-w-md flex flex-col gap-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-strongText">{viewTicket.artist}</h2>
              <button
                onClick={() => setViewTicket(null)}
                className="text-mutedText hover:text-strongText text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {viewTicket.newBarcode ? (
              <>
                <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[200px]">
                  <TicketBarcode
                    value={viewTicket.newBarcode}
                    format={viewTicket.newBarcodeFormat}
                  />
                </div>
                <p className="text-xs text-mutedText text-center">
                  הכרטיס הונפק מחדש על שמך — זהו ברקוד הכניסה בתוקף. הברקוד
                  המקורי בוטל.
                </p>
              </>
            ) : (
              <>
                <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[200px]">
                  <TicketBarcode
                    value={demoBarcodeValue(viewTicket.id)}
                    format={DEMO_BARCODE_FORMAT}
                  />
                </div>
                <p className="text-xs text-mutedText text-center">ברקוד כניסה</p>
              </>
            )}

            {!viewTicket.newBarcode && viewTicket.ticketImage && (
              <a
                href={viewTicket.ticketImage}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary rounded-md min-h-0 h-10 text-white text-sm font-medium w-full text-center"
              >
                הורד כרטיס
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
