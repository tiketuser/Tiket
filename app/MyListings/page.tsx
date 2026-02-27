"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import MyTicketCard from "../components/MyTicketCard/MyTicketCard";
import Footer from "../components/Footer/Footer";
import TitleSubtitle from "../components/TitleSubtitle/TitleSubtitle";
import ArrowIcon from "../../public/images/My Tickets/Web/Arrow.svg";
import Image from "next/image";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface Ticket {
  id: string;
  artist: string;
  date: string;
  venue: string;
  time?: string;
  section: string;
  row: string;
  seat: string;
  isStanding: boolean;
  askingPrice: number;
  status: string;
  verificationStatus?: "verified" | "needs_review" | "rejected";
  verificationConfidence?: number;
  verificationDetails?: {
    matchedFields: string[];
    unmatchedFields: string[];
    reason: string;
    ticketingSystem?: string;
  };
  adminComment?: string; // Admin's comment for rejected tickets
  rejectedAt?: string;
  createdAt: any;
}

const seatLabel = (ticket: Ticket) =>
  ticket.time ||
  (ticket.isStanding
    ? "עמידה"
    : `${ticket.section ? `אזור ${ticket.section}` : ""} ${ticket.row ? `שורה ${ticket.row}` : ""} ${ticket.seat ? `מושב ${ticket.seat}` : ""}`.trim() || "מיקום לא צוין");

const MyListings = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLivePosts, setShowLivePosts] = useState(true);
  const [showSold, setShowSold] = useState(true);
  const [showRejected, setShowRejected] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      if (!db) {
        console.error("Firebase not initialized");
        return;
      }

      const currentUser = auth?.currentUser;
      if (!currentUser) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      // Fetch only this seller's tickets
      const q = query(
        collection(db as any, "tickets"),
        where("sellerId", "==", currentUser.uid)
      );
      const ticketsSnapshot = await getDocs(q);
      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];

      // Sort by creation date (newest first)
      ticketsData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLivePostsCardsVisibility = () => {
    setShowLivePosts((prev) => !prev);
  };

  const toggleSoldCardsVisibility = () => {
    setShowSold((prev) => !prev);
  };

  const toggleRejectedCardsVisibility = () => {
    setShowRejected((prev) => !prev);
  };

  // Filter tickets by status
  const activeTickets = tickets.filter(
    (t) => t.verificationStatus === "verified" || t.status === "available"
  );

  const soldTickets = tickets.filter((t) => t.status === "sold");

  const rejectedTickets = tickets.filter(
    (t) => t.verificationStatus === "rejected"
  );

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="min-h-screen bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-gray-600">טוען מודעות...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
            (activeTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין מודעות פעילות
              </div>
            ) : (
              activeTickets.map((ticket) => (
                <div key={ticket.id} className="mb-4 w-full">
                  <MyTicketCard
                    artist={ticket.artist}
                    date={ticket.date || ""}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    buttonLabel="ביטול מכירה"
                  />
                </div>
              ))
            ))}
        </div>
      </div>

      <TitleSubtitle title="כרטיסים שנדחו" subtitle="לא עברו אימות" />
      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-5 md:pb-14 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={toggleRejectedCardsVisibility}
          className={`w-6 h-7 md:w-8 md:h-5  float-end cursor-pointer transition-transform duration-700 ${
            showRejected ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`mt-14 transition-all duration-700 ease-in-out ${
            showRejected ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showRejected &&
            (rejectedTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין מודעות שנדחו
              </div>
            ) : (
              rejectedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col items-center justify-center mb-4"
                >
                  <MyTicketCard
                    artist={ticket.artist}
                    date={ticket.date || ""}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    tag="נדחה"
                    buttonLabel="מחק"
                  />

                  {/* Display admin comment if available */}
                  {ticket.adminComment && (
                    <div className="w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-xl">💬</div>
                        <div className="flex-1">
                          <p className="font-bold text-red-800 text-sm mb-1">
                            הערת מנהל:
                          </p>
                          <p className="text-red-700 text-sm">
                            {ticket.adminComment}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display verification reason if no admin comment */}
                  {!ticket.adminComment &&
                    ticket.verificationDetails?.reason && (
                      <div className="w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] mt-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="text-xl">ℹ️</div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm mb-1">
                              סיבת דחייה:
                            </p>
                            <p className="text-gray-700 text-sm">
                              {ticket.verificationDetails.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ))
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
            (soldTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין מודעות שנמכרו
              </div>
            ) : (
              soldTickets.map((ticket) => (
                <div key={ticket.id} className="mb-4 w-full">
                  <MyTicketCard
                    artist={ticket.artist}
                    date={ticket.date || ""}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    tag="נמכר"
                    buttonLabel="צפייה בכרטיס"
                  />
                </div>
              ))
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyListings;
