"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import {
  artistNamesMatch,
  findBestArtistMatch,
} from "../../utils/artistMatcher";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface Ticket {
  id: string;
  concertId: string | null;
  artist: string;
  date: string;
  venue: string;
  time?: string;
  section: string;
  row: string;
  seat: string;
  isStanding: boolean;
  askingPrice: number;
  originalPrice: number | null;
  status: string;
  ticketImage?: string; // Base64 image of uploaded ticket
  createdAt: any;
  sellerId: string;
  // Verification fields
  verificationStatus?: "verified" | "needs_review" | "rejected";
  verificationConfidence?: number;
  verificationDetails?: {
    matchedFields: string[];
    unmatchedFields: string[];
    reason: string;
    officialTicketId?: string;
    eventId?: string;
    ticketingSystem?: string;
  };
  // Admin rejection
  adminComment?: string; // Admin's comment when rejecting
  rejectedAt?: string; // Timestamp when rejected
}

interface Concert {
  id: string;
  artist: string;
  title: string;
  date: string;
  venue: string;
}

export default function ApproveTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(
    null
  );
  const [adminComments, setAdminComments] = useState<Record<string, string>>(
    {}
  ); // Store admin comments for each ticket

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!db) {
        console.error("Firebase not initialized");
        return;
      }

      // Fetch ALL tickets first (avoid compound query index requirement)
      const ticketsSnapshot = await getDocs(collection(db as any, "tickets"));
      const allTickets = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];

      // Filter in memory for tickets that need manual review
      // Only show tickets with verification status "needs_review" or old "pending_approval"
      const pendingTickets = allTickets
        .filter(
          (t) =>
            t.verificationStatus === "needs_review" ||
            t.status === "pending_approval" ||
            t.status === "pending"
        )
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime; // descending order (newest first)
        });

      console.log("Total tickets:", allTickets.length);
      console.log("Pending tickets:", pendingTickets.length);
      console.log("Pending tickets data:", pendingTickets);

      setTickets(pendingTickets);

      // Fetch all concerts for reference
      const concertsSnapshot = await getDocs(collection(db as any, "concerts"));
      const concertsData = concertsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Concert[];
      setConcerts(concertsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ticketId: string) => {
    if (!confirm("האם לאשר כרטיס זה לפרסום?")) return;

    setProcessingTicketId(ticketId);
    try {
      await updateDoc(doc(db as any, "tickets", ticketId), {
        status: "available",
      });

      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      alert("הכרטיס אושר בהצלחה!");
    } catch (error) {
      console.error("Error approving ticket:", error);
      alert("שגיאה באישור הכרטיס");
    } finally {
      setProcessingTicketId(null);
    }
  };

  const handleReject = async (ticketId: string) => {
    if (!confirm("האם לדחות כרטיס זה?")) return;

    setProcessingTicketId(ticketId);
    try {
      // Get the admin comment from state (or empty string if none)
      const comment = adminComments[ticketId] || "";

      // Instead of deleting, update status to rejected with admin comment
      await updateDoc(doc(db as any, "tickets", ticketId), {
        status: "rejected",
        verificationStatus: "rejected",
        adminComment: comment || "הכרטיס נדחה על ידי המנהל",
        rejectedAt: new Date().toISOString(),
      });

      // Remove from pending list (it's now rejected)
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));

      // Clear the comment from state
      setAdminComments((prev) => {
        const newComments = { ...prev };
        delete newComments[ticketId];
        return newComments;
      });

      alert("הכרטיס נדחה בהצלחה");
    } catch (error) {
      console.error("Error rejecting ticket:", error);
      alert("שגיאה בדחיית הכרטיס");
    } finally {
      setProcessingTicketId(null);
    }
  };

  const getConcertForTicket = (ticket: Ticket): Concert | null => {
    if (!ticket.concertId) return null;
    return concerts.find((c) => c.id === ticket.concertId) || null;
  };

  // Get suggested concerts for tickets without a match
  const getSuggestedConcerts = (ticket: Ticket): Concert[] => {
    if (ticket.concertId) return []; // Already has a concert

    // Find concerts with similar artist names
    const artistList = concerts.map((c) => c.artist);
    const { match: bestArtistMatch } = findBestArtistMatch(
      ticket.artist,
      artistList,
      0.7
    );

    if (!bestArtistMatch) return [];

    // Filter concerts with matching or similar artist
    return concerts.filter((c) =>
      artistNamesMatch(ticket.artist, c.artist, 0.7)
    );
  };

  // Manually link ticket to a concert
  const handleLinkToConcert = async (ticketId: string, concertId: string) => {
    if (!confirm("האם לקשר כרטיס זה לאירוע?")) return;

    setProcessingTicketId(ticketId);
    try {
      await updateDoc(doc(db as any, "tickets", ticketId), {
        concertId: concertId,
      });

      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, concertId } : t))
      );
      alert("הכרטיס קושר לאירוע בהצלחה!");
    } catch (error) {
      console.error("Error linking ticket:", error);
      alert("שגיאה בקישור הכרטיס");
    } finally {
      setProcessingTicketId(null);
    }
  };

  if (loading) {
    return (
      <AdminProtection>
        <NavBar />
        <div className="min-h-screen bg-white py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">טוען כרטיסים...</p>
          </div>
        </div>
        <Footer />
      </AdminProtection>
    );
  }

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-heading-1-desktop font-bold text-strongText mb-4">
              אישור כרטיסים
            </h1>
            <p className="text-body-large text-mutedText">
              בדוק ואשר כרטיסים שהועלו על ידי משתמשים
            </p>

            {/* Debug Info */}
            <div className="mt-4 text-xs text-left bg-gray-100 p-3 rounded max-w-2xl mx-auto">
              <p className="font-bold"> Debug Info:</p>
              <p>Total tickets loaded: {tickets.length}</p>
              <p>
                pending_approval:{" "}
                {tickets.filter((t) => t.status === "pending_approval").length}
              </p>
              <p>
                pending: {tickets.filter((t) => t.status === "pending").length}
              </p>
              <p>Check browser console for detailed logs</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {tickets.length}
              </p>
              <p className="text-sm text-orange-700 mt-2">כרטיסים לאישור</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {tickets.filter((t) => !!getConcertForTicket(t)).length}
              </p>
              <p className="text-sm text-green-700 mt-2">עם אירוע מתאים</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {tickets.filter((t) => !getConcertForTicket(t)).length}
              </p>
              <p className="text-sm text-yellow-700 mt-2">ללא אירוע</p>
            </div>
          </div>

          {/* Tickets List */}
          {tickets.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
              <p className="text-heading-3-desktop text-green-800">
                אין כרטיסים ממתינים!
              </p>
              <p className="text-body-medium text-green-600 mt-2">
                כל הכרטיסים אושרו
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tickets.map((ticket) => {
                const concert = getConcertForTicket(ticket);
                const hasConcert = !!concert;

                return (
                  <div
                    key={ticket.id}
                    className={`border-2 rounded-xl p-6 shadow-medium ${
                      !hasConcert
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-orange-300 bg-orange-50"
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          !hasConcert
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-orange-200 text-orange-800"
                        }`}
                      >
                        {!hasConcert ? "ממתין לאירוע" : "ממתין לאישור"}
                      </span>
                      <span className="text-sm text-mutedText">
                        {new Date(
                          ticket.createdAt?.seconds * 1000
                        ).toLocaleDateString("he-IL")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Uploaded Ticket Image */}
                      {ticket.ticketImage && (
                        <div className="space-y-3">
                          <h3 className="text-heading-4-desktop font-bold text-strongText">
                            🎫 תמונת הכרטיס
                          </h3>
                          <div className="bg-white rounded-lg p-2 border-2 border-gray-200">
                            <img
                              src={ticket.ticketImage}
                              alt="Uploaded Ticket"
                              className="w-full h-auto rounded"
                            />
                          </div>
                        </div>
                      )}

                      {/* Ticket Details */}
                      <div className="space-y-3">
                        <h3 className="text-heading-4-desktop font-bold text-strongText">
                          פרטי הכרטיס
                        </h3>
                        <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                          <p>
                            <strong> אמן:</strong> {ticket.artist}
                          </p>
                          <p>
                            <strong> תאריך:</strong> {ticket.date}
                          </p>
                          <p>
                            <strong> מקום:</strong> {ticket.venue}
                          </p>
                          {ticket.time && (
                            <p>
                              <strong> שעה:</strong> {ticket.time}
                            </p>
                          )}
                          <div className="border-t pt-2 mt-2">
                            {ticket.isStanding ? (
                              <p>
                                <strong> עמידה:</strong> כן
                              </p>
                            ) : (
                              <>
                                <p>
                                  <strong> מקטע:</strong> {ticket.section}
                                </p>
                                <p>
                                  <strong> שורה:</strong> {ticket.row}
                                </p>
                                <p>
                                  <strong> מושב:</strong> {ticket.seat}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <p className="text-lg font-bold text-primary">
                              מחיר: ₪{ticket.askingPrice}
                            </p>
                            {ticket.originalPrice && (
                              <p className="text-xs text-mutedText">
                                מחיר מקורי: ₪{ticket.originalPrice}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Verification Info */}
                      {ticket.verificationDetails && (
                        <div className="space-y-3">
                          <h3 className="text-heading-4-desktop font-bold text-strongText">
                            🔍 אימות אולם
                          </h3>
                          <div
                            className={`rounded-lg p-4 space-y-2 text-sm border-2 ${
                              (ticket.verificationConfidence || 0) >= 90
                                ? "bg-green-50 border-green-200"
                                : (ticket.verificationConfidence || 0) >= 65
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            {/* Confidence Score */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold">דירוג אמינות:</span>
                              <span className="text-2xl font-bold">
                                {ticket.verificationConfidence}%
                              </span>
                            </div>

                            {/* Ticketing System */}
                            {ticket.verificationDetails.ticketingSystem && (
                              <p className="text-xs text-gray-600">
                                מערכת:{" "}
                                {ticket.verificationDetails.ticketingSystem}
                              </p>
                            )}

                            {/* Official Ticket ID */}
                            {ticket.verificationDetails.officialTicketId && (
                              <p className="text-xs text-gray-600">
                                מזהה רשמי:{" "}
                                {ticket.verificationDetails.officialTicketId}
                              </p>
                            )}

                            {/* Matched Fields */}
                            {ticket.verificationDetails.matchedFields?.length >
                              0 && (
                              <div className="mt-2">
                                <p className="font-medium text-green-800 mb-1">
                                  ✓ שדות תואמים:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {ticket.verificationDetails.matchedFields.map(
                                    (field, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                                      >
                                        {field}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Unmatched Fields */}
                            {ticket.verificationDetails.unmatchedFields
                              ?.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium text-orange-800 mb-1">
                                  ⚠ שדות לא תואמים:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {ticket.verificationDetails.unmatchedFields.map(
                                    (field, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs"
                                      >
                                        {field}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Reason */}
                            {ticket.verificationDetails.reason && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <p className="text-xs italic">
                                  {ticket.verificationDetails.reason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Concert Match */}
                      <div className="space-y-3">
                        <h3 className="text-heading-4-desktop font-bold text-strongText">
                          אירוע מתאים
                        </h3>
                        {concert ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
                            <p className="text-green-800 font-bold flex items-center gap-2">
                              נמצא אירוע מתאים
                            </p>
                            <p>
                              <strong>אמן:</strong> {concert.artist}
                            </p>
                            <p>
                              <strong>כותרת:</strong> {concert.title}
                            </p>
                            <p>
                              <strong>תאריך:</strong> {concert.date}
                            </p>
                            <p>
                              <strong>מקום:</strong> {concert.venue}
                            </p>
                            <p className="text-xs text-green-600 mt-2">
                              ID: {concert.id}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                              <p className="text-yellow-800 font-bold flex items-center gap-2 mb-3">
                                לא נמצא אירוע מתאים
                              </p>
                              <p className="text-yellow-700 mb-2">
                                יש ליצור אירוע עם הפרטים הבאים:
                              </p>
                              <div className="bg-white rounded p-2 space-y-1 font-mono text-xs">
                                <p>artist: "{ticket.artist}"</p>
                                <p>date: "{ticket.date}"</p>
                                <p>venue: "{ticket.venue}"</p>
                              </div>
                              <a
                                href="/Admin"
                                className="inline-block mt-3 text-primary underline text-xs"
                              >
                                → לך ליצירת אירוע
                              </a>
                            </div>

                            {/* Suggested Concerts */}
                            {(() => {
                              const suggestions = getSuggestedConcerts(ticket);
                              if (suggestions.length > 0) {
                                return (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-sm">
                                    <p className="text-blue-800 font-bold mb-3 flex items-center gap-2">
                                      אירועים מוצעים (התאמה חלקית)
                                    </p>
                                    <div className="space-y-3">
                                      {suggestions.map((suggestedConcert) => (
                                        <div
                                          key={suggestedConcert.id}
                                          className="bg-white rounded p-3 border border-blue-100"
                                        >
                                          <div className="space-y-1 mb-2">
                                            <p>
                                              <strong>אמן:</strong>{" "}
                                              {suggestedConcert.artist}
                                            </p>
                                            <p>
                                              <strong>כותרת:</strong>{" "}
                                              {suggestedConcert.title}
                                            </p>
                                            <p>
                                              <strong>תאריך:</strong>{" "}
                                              {suggestedConcert.date}
                                            </p>
                                            <p>
                                              <strong>מקום:</strong>{" "}
                                              {suggestedConcert.venue}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleLinkToConcert(
                                                ticket.id,
                                                suggestedConcert.id
                                              )
                                            }
                                            disabled={
                                              processingTicketId === ticket.id
                                            }
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                          >
                                            קשר לאירוע זה
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Admin Comment Input (for rejection) */}
                    <div className="mt-6 pt-6 border-t">
                      <label className="block mb-2">
                        <span className="text-sm font-semibold text-strongText">
                          הערה למוכר (אופציונלי - תוצג במקרה של דחייה):
                        </span>
                        <textarea
                          value={adminComments[ticket.id] || ""}
                          onChange={(e) =>
                            setAdminComments((prev) => ({
                              ...prev,
                              [ticket.id]: e.target.value,
                            }))
                          }
                          placeholder="למשל: הכרטיס לא ברור, התמונה לא קריאה, הפרטים לא תואמים למאגר..."
                          className="w-full mt-2 p-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none text-sm"
                          rows={3}
                        />
                      </label>
                      <p className="text-xs text-mutedText mt-1">
                        אם תדחה את הכרטיס, המוכר יוכל לראות הערה זו בעמוד
                        "הכרטיסים שלי"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={() => handleApprove(ticket.id)}
                        disabled={
                          processingTicketId === ticket.id || !hasConcert
                        }
                        className="btn btn-primary flex-1"
                      >
                        {processingTicketId === ticket.id ? (
                          <span className="loading loading-spinner"></span>
                        ) : !hasConcert ? (
                          "יש ליצור אירוע תחילה"
                        ) : (
                          "אשר ופרסם"
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(ticket.id)}
                        disabled={processingTicketId === ticket.id}
                        className="btn btn-error flex-1"
                      >
                        {processingTicketId === ticket.id ? (
                          <span className="loading loading-spinner"></span>
                        ) : (
                          "דחה כרטיס"
                        )}
                      </button>
                    </div>

                    {!hasConcert && (
                      <p className="text-xs text-yellow-700 mt-2 text-center">
                        יש ליצור אירוע מתאים לפני אישור הכרטיס
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
