"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";

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
  createdAt: any;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      if (!db) {
        console.error("Firebase not initialized");
        return;
      }

      // In production, filter by actual user ID
      // For now, fetch all tickets (demo purposes)
      const ticketsSnapshot = await getDocs(collection(db as any, "tickets"));
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
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (ticket: Ticket) => {
    const status = ticket.verificationStatus || ticket.status;

    switch (status) {
      case "verified":
      case "available":
        return (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            ✅ מאומת ופעיל
          </div>
        );
      case "needs_review":
      case "pending_approval":
        return (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            ⏳ ממתין לאישור
          </div>
        );
      case "rejected":
        return (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            ❌ נדחה
          </div>
        );
      case "sold":
        return (
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            ✓ נמכר
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
            {status}
          </div>
        );
    }
  };

  const getVerificationInfo = (ticket: Ticket) => {
    if (!ticket.verificationDetails) return null;

    const { verificationStatus, verificationConfidence, verificationDetails } = ticket;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">אימות:</span>
          <span className="font-bold">
            {verificationConfidence}% אמינות
          </span>
        </div>
        
        {verificationDetails.ticketingSystem && (
          <div className="text-xs text-gray-600 mb-1">
            מערכת: {verificationDetails.ticketingSystem}
          </div>
        )}

        {verificationDetails.matchedFields?.length > 0 && (
          <div className="text-xs text-green-700 mb-1">
            ✓ תואם: {verificationDetails.matchedFields.join(", ")}
          </div>
        )}

        {verificationDetails.unmatchedFields?.length > 0 && (
          <div className="text-xs text-orange-700 mb-1">
            ⚠ לא תואם: {verificationDetails.unmatchedFields.join(", ")}
          </div>
        )}

        <div className="text-xs text-gray-700 mt-2 italic">
          {verificationDetails.reason}
        </div>
      </div>
    );
  };

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
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              הכרטיסים שלי
            </h1>
            <p className="text-gray-600">
              כאן תוכל לעקוב אחרי כל הכרטיסים שהעלית למכירה
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-2xl ml-3">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">תהליך אימות כרטיסים</p>
                <p>
                  כל כרטיס שהועלה עובר אימות אוטומטי מול מאגר האולמות.
                  כרטיסים שאומתו בהצלחה מפורסמים מיד.
                  כרטיסים עם התאמה חלקית עוברים בדיקה ידנית תוך 2-4 שעות.
                </p>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">עדיין לא העלית כרטיסים</p>
              <p className="text-gray-500 text-sm mt-2">
                העלה כרטיס ראשון כדי להתחיל למכור
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {ticket.artist}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {ticket.venue} • {ticket.date}
                        {ticket.time && ` • ${ticket.time}`}
                      </div>
                    </div>
                    {getStatusBadge(ticket)}
                  </div>

                  {/* Ticket Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-3">
                    <div>
                      <span className="font-medium">מיקום:</span>{" "}
                      {ticket.isStanding
                        ? "עמידה"
                        : `${ticket.section || ""} ${ticket.row || ""} ${
                            ticket.seat || ""
                          }`.trim() || "לא צוין"}
                    </div>
                    <div>
                      <span className="font-medium">מחיר:</span> ₪
                      {ticket.askingPrice}
                    </div>
                  </div>

                  {/* Verification Info */}
                  {getVerificationInfo(ticket)}

                  {/* Pending Review Message */}
                  {(ticket.verificationStatus === "needs_review" ||
                    ticket.status === "pending_approval") && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      <p className="font-medium">⏳ הכרטיס בתהליך אישור</p>
                      <p className="mt-1 text-xs">
                        הכרטיס שלך נמצא בבדיקה ידנית. תקבל עדכון ב-SMS/Email
                        ברגע שהכרטיס יאושר (בדרך כלל תוך 2-4 שעות).
                      </p>
                    </div>
                  )}

                  {/* Rejected Message */}
                  {ticket.verificationStatus === "rejected" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      <p className="font-medium">❌ הכרטיס נדחה</p>
                      <p className="mt-1 text-xs">
                        הכרטיס לא עבר אימות מול מאגר האולם. אנא בדוק את הפרטים
                        ונסה להעלות שוב.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
