"use client";

import React, { useState, useEffect } from "react";
import { db, collection, getDocs } from "../../firebase";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

export default function DiagnosticPage() {
  const [concerts, setConcerts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!db) {
          console.error("Firebase not initialized");
          return;
        }

        // Fetch concerts
        const concertsSnapshot = await getDocs(
          collection(db as any, "concerts")
        );
        const concertsData = concertsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConcerts(concertsData);

        // Fetch tickets
        const ticketsSnapshot = await getDocs(collection(db as any, "tickets"));
        const ticketsData = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTickets(ticketsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <AdminProtection>
      <NavBar />
      <div className="p-8 max-w-7xl mx-auto" dir="rtl">
        <h1 className="text-3xl font-bold mb-8">אבחון מסד נתונים</h1>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-right mb-8">
          <h3 className="font-bold text-blue-900 mb-3">סיכום</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {concerts.length}
              </div>
              <div className="text-sm text-mutedText">הופעות</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {tickets.length}
              </div>
              <div className="text-sm text-mutedText">כרטיסים</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {concerts.filter((c) => c.status === "active").length}
              </div>
              <div className="text-sm text-mutedText">הופעות פעילות</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter((t) => t.status === "available").length}
              </div>
              <div className="text-sm text-mutedText">כרטיסים זמינים</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tickets.filter((t) => t.status === "pending").length}
              </div>
              <div className="text-sm text-mutedText">כרטיסים ממתינים</div>
            </div>
          </div>
        </div>

        {/* Concerts Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            הופעות ({concerts.length})
          </h2>
          {concerts.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-right">
              <p className="text-red-800 font-bold mb-2">אין הופעות במערכת!</p>
              <p className="text-red-600">
                עליך ליצור הופעות דרך דף הניהול או להריץ את המיגרציה.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  אפשרות 1: עבור ל-
                  <a href="/Admin" className="underline text-primary">
                    /Admin
                  </a>{" "}
                  וצור הופעות ידנית
                </p>
                <p>
                  אפשרות 2: עבור ל-
                  <a href="/migrate" className="underline text-primary">
                    /migrate
                  </a>{" "}
                  והרץ מיגרציה
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-medium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold">#</th>
                      <th className="px-4 py-3 text-sm font-semibold">תמונה</th>
                      <th className="px-4 py-3 text-sm font-semibold">אמן</th>
                      <th className="px-4 py-3 text-sm font-semibold">כותרת</th>
                      <th className="px-4 py-3 text-sm font-semibold">תאריך</th>
                      <th className="px-4 py-3 text-sm font-semibold">שעה</th>
                      <th className="px-4 py-3 text-sm font-semibold">מקום</th>
                      <th className="px-4 py-3 text-sm font-semibold">סטטוס</th>
                      <th className="px-4 py-3 text-sm font-semibold">
                        קטגוריה
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {concerts.map((concert, index) => (
                      <tr key={concert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3">
                          {concert.imageData ? (
                            <img
                              src={concert.imageData}
                              alt={concert.artist}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              אין תמונה
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary">
                          {concert.artist || "ללא שם"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {concert.title || "ללא כותרת"}
                        </td>
                        <td className="px-4 py-3 text-sm">{concert.date}</td>
                        <td className="px-4 py-3 text-sm">{concert.time}</td>
                        <td className="px-4 py-3 text-sm">{concert.venue}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              concert.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {concert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {concert.category || "מוזיקה"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pending Tickets Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">
            כרטיסים ממתינים (
            {tickets.filter((t) => t.status === "pending").length})
          </h2>
          {tickets.filter((t) => t.status === "pending").length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-right">
              <p className="text-green-800">אין כרטיסים ממתינים</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-bold">
                  כרטיסים אלה ממתינים להופעה מתאימה
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  צור הופעה עם אמן, תאריך ומקום תואמים כדי להפעיל אותם
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-medium overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-orange-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-sm font-semibold">אמן</th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          תאריך
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          מקום
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          יציע
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          שורה
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          מושב
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          מחיר
                        </th>
                        <th className="px-4 py-3 text-sm font-semibold">
                          סטטוס
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tickets
                        .filter((t) => t.status === "pending")
                        .map((ticket, index) => (
                          <tr key={ticket.id} className="hover:bg-orange-50">
                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-semibold">
                              {ticket.artist}
                            </td>
                            <td className="px-4 py-3 text-sm">{ticket.date}</td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.venue}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.section || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.row || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ticket.seat || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-primary">
                              ₪{ticket.askingPrice || ticket.price || 0}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                {ticket.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Available Tickets Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            כרטיסים זמינים (
            {tickets.filter((t) => t.status === "available").length})
          </h2>
          {tickets.filter((t) => t.status === "available").length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-right">
              <p className="text-yellow-800">אין כרטיסים זמינים במערכת</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-medium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold">#</th>
                      <th className="px-4 py-3 text-sm font-semibold">אמן</th>
                      <th className="px-4 py-3 text-sm font-semibold">תאריך</th>
                      <th className="px-4 py-3 text-sm font-semibold">מקום</th>
                      <th className="px-4 py-3 text-sm font-semibold">יציע</th>
                      <th className="px-4 py-3 text-sm font-semibold">שורה</th>
                      <th className="px-4 py-3 text-sm font-semibold">מושב</th>
                      <th className="px-4 py-3 text-sm font-semibold">מחיר</th>
                      <th className="px-4 py-3 text-sm font-semibold">
                        מחיר מקורי
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold">אימות</th>
                      <th className="px-4 py-3 text-sm font-semibold">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets
                      .filter((t) => t.status === "available")
                      .map((ticket, index) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            {ticket.artist}
                          </td>
                          <td className="px-4 py-3 text-sm">{ticket.date}</td>
                          <td className="px-4 py-3 text-sm">{ticket.venue}</td>
                          <td className="px-4 py-3 text-sm">
                            {ticket.section || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {ticket.row || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {ticket.seat || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-primary">
                            ₪{ticket.askingPrice || ticket.price || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-mutedText">
                            {ticket.originalPrice
                              ? `₪${ticket.originalPrice}`
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {ticket.verificationStatus && (
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  ticket.verificationStatus === "verified"
                                    ? "bg-green-100 text-green-800"
                                    : ticket.verificationStatus ===
                                      "needs_review"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {ticket.verificationStatus}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {ticket.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
