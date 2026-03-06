"use client";

import React, { useState, useEffect } from "react";
import { formatSeatLocation } from "../utils/categoryConfig";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
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
  category?: string;
  section: string;
  block?: string;
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
  formatSeatLocation({
    category: ticket.category,
    section: ticket.section,
    block: ticket.block,
    row: ticket.row,
    seat: ticket.seat,
    isStanding: ticket.isStanding,
  });

const MyListings = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLivePosts, setShowLivePosts] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showSold, setShowSold] = useState(true);
  const [showRejected, setShowRejected] = useState(true);
  const [cancelTicketId, setCancelTicketId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [removeTicketId, setRemoveTicketId] = useState<string | null>(null);

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

  const confirmCancelListing = async () => {
    if (!cancelTicketId || !db) return;
    setCanceling(true);
    try {
      await deleteDoc(doc(db as any, "tickets", cancelTicketId));
      setTickets((prev) => prev.filter((t) => t.id !== cancelTicketId));
    } catch (error) {
      console.error("Error canceling listing:", error);
    } finally {
      setCanceling(false);
      setCancelTicketId(null);
    }
  };

  const toggleLivePostsCardsVisibility = () => {
    setShowLivePosts((prev) => !prev);
  };

  const toggleSoldCardsVisibility = () => {
    setShowSold((prev) => !prev);
  };

  const togglePendingCardsVisibility = () => {
    setShowPending((prev) => !prev);
  };

  const toggleRejectedCardsVisibility = () => {
    setShowRejected((prev) => !prev);
  };

  // Filter tickets by status
  const activeTickets = tickets.filter(
    (t) => t.verificationStatus === "verified" || t.status === "available"
  );

  const pendingTickets = tickets.filter(
    (t) => t.verificationStatus === "needs_review"
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
                    time={ticket.time}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    buttonLabel="ביטול מכירה"
                    onButtonClick={() => setCancelTicketId(ticket.id)}
                  />
                </div>
              ))
            ))}
        </div>
      </div>

      <TitleSubtitle title="ממתין לאישור" subtitle="בבדיקת מנהל" />
      <div className="pt-5 md:pt-14 px-4 md:px-8 lg:px-32 pb-5 md:pb-14 gap-4 md:gap-8 shadow-small-inner w-full">
        <Image
          src={ArrowIcon}
          alt="Arrow icon"
          onClick={togglePendingCardsVisibility}
          className={`w-6 h-7 md:w-8 md:h-5 float-end cursor-pointer transition-transform duration-700 ${
            showPending ? "rotate-0" : "rotate-180"
          }`}
        />
        <div
          className={`mt-14 transition-all duration-700 ease-in-out ${
            showPending ? "opacity-100 h-auto" : "opacity-0 h-0"
          }`}
        >
          {showPending &&
            (pendingTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                אין כרטיסים הממתינים לאישור
              </div>
            ) : (
              pendingTickets.map((ticket) => (
                <div key={ticket.id} className="flex flex-col items-center justify-center mb-4">
                  <MyTicketCard
                    artist={ticket.artist}
                    date={ticket.date || ""}
                    time={ticket.time}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    tag="ממתין"
                    buttonLabel="מחק"
                    onButtonClick={() => setCancelTicketId(ticket.id)}
                  />
                  <div className="w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] mt-2 px-5 py-3 bg-secondary/30 border-r-4 border-primary rounded-md flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div className="flex-1" dir="rtl">
                      <p className="font-bold text-strongText text-sm">הכרטיס בבדיקה</p>
                      <p className="text-weakTextBluish text-sm">הכרטיס שהעלית נמצא כעת בבדיקת המנהל. תקבל עדכון בהקדם.</p>
                    </div>
                  </div>
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
                    time={ticket.time}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    tag="נדחה"
                    buttonLabel="מחק"
                  />

                  {/* Display admin comment if available */}
                  {ticket.adminComment && (
                    <div className="w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] mt-2 px-5 py-3 bg-secondary/20 border-r-4 border-highlight rounded-md flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-highlight flex-shrink-0"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      <div className="flex-1" dir="rtl">
                        <p className="font-bold text-strongText text-sm">הערת מנהל:</p>
                        <p className="text-weakTextBluish text-sm">{ticket.adminComment}</p>
                      </div>
                    </div>
                  )}

                  {/* Display verification reason if no admin comment */}
                  {!ticket.adminComment &&
                    ticket.verificationDetails?.reason && (
                      <div className="w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] mt-2 px-5 py-3 bg-secondary/20 border-r-4 border-highlight rounded-md flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-highlight flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <div className="flex-1" dir="rtl">
                          <p className="font-bold text-strongText text-sm">סיבת דחייה:</p>
                          <p className="text-weakTextBluish text-sm">{ticket.verificationDetails.reason}</p>
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
                    time={ticket.time}
                    venue={ticket.venue}
                    price={ticket.askingPrice}
                    seatLabel={seatLabel(ticket)}
                    tag="נמכר"
                    buttonLabel="הסר"
                    onButtonClick={() => setRemoveTicketId(ticket.id)}
                  />
                </div>
              ))
            ))}
        </div>
      </div>
      <Footer />

      {/* Cancel confirmation dialog */}
      {cancelTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-xl shadow-large p-6 mx-4 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold text-strongText text-center">ביטול מכירה</h2>
            <p className="text-sm text-mutedText text-center">
              האם אתה בטוח שברצונך לבטל את המכירה? הכרטיס יוסר מהמודעות הפעילות.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setCancelTicketId(null)}
                disabled={canceling}
                className="btn btn-outline rounded-md min-h-0 h-10 px-5 text-sm font-medium flex-1"
              >
                חזרה
              </button>
              <button
                onClick={confirmCancelListing}
                disabled={canceling}
                className="btn btn-primary rounded-md min-h-0 h-10 px-5 text-white text-sm font-medium flex-1"
              >
                {canceling ? <span className="loading loading-spinner loading-sm" /> : "כן, בטל מכירה"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove sold ticket confirmation dialog */}
      {removeTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl">
          <div className="bg-white rounded-xl shadow-large p-6 mx-4 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold text-strongText text-center">הסרת כרטיס</h2>
            <p className="text-sm text-mutedText text-center">
              האם אתה בטוח שברצונך להסיר את הכרטיס מההיסטוריה?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setRemoveTicketId(null)}
                className="btn btn-outline rounded-md min-h-0 h-10 px-5 text-sm font-medium flex-1"
              >
                חזרה
              </button>
              <button
                onClick={() => {
                  setTickets((prev) => prev.filter((t) => t.id !== removeTicketId));
                  setRemoveTicketId(null);
                }}
                className="btn btn-primary rounded-md min-h-0 h-10 px-5 text-white text-sm font-medium flex-1"
              >
                כן, הסר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
