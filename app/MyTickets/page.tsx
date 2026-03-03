"use client";

import React, { useState, useEffect } from "react";
import { formatSeatLocation } from "../utils/categoryConfig";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import TitleSubtitle from "../components/TitleSubtitle/TitleSubtitle";
import MyTicketCard from "../components/MyTicketCard/MyTicketCard";
import ArrowIcon from "../../public/images/My Tickets/Web/Arrow.svg";
import Image from "next/image";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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
}

function parseTicketDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Format: "DD/MM/YYYY"
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPast, setShowPast] = useState(true);
  const [viewTicket, setViewTicket] = useState<PurchasedTicket | null>(null);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      if (user) {
        fetchMyTickets(user.uid);
      } else {
        setLoading(false);
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTickets = tickets.filter((t) => {
    const d = parseTicketDate(t.date);
    return d ? d >= today : true;
  });

  const pastTickets = tickets.filter((t) => {
    const d = parseTicketDate(t.date);
    return d ? d < today : false;
  });

  const seatLabel = (t: PurchasedTicket) =>
    formatSeatLocation({
      category: t.category,
      section: t.section,
      block: t.block,
      row: t.row,
      seat: t.seat,
      isStanding: t.isStanding,
    });

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="min-h-screen bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-gray-600">טוען כרטיסים...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
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

      {/* Ticket viewer dialog */}
      {viewTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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

            <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[200px]">
              {viewTicket.ticketImage ? (
                <img
                  src={viewTicket.ticketImage}
                  alt="כרטיס"
                  className="w-full h-auto object-contain max-h-[60vh]"
                />
              ) : (
                <p className="text-mutedText text-sm py-8">אין תמונת כרטיס</p>
              )}
            </div>

            {viewTicket.ticketImage && (
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
    </div>
  );
}
