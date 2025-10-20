"use client";

import React, { useState, useEffect } from "react";
import { db, collection, getDocs } from "../../firebase";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";

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
      <div className="p-8 max-w-6xl mx-auto" dir="rtl">
        <h1 className="text-3xl font-bold mb-8">🔍 Database Diagnostic</h1>

        {/* Concerts Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            קונצרטים ({concerts.length})
          </h2>
          {concerts.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-right">
              <p className="text-red-800 font-bold mb-2">
                ❌ אין קונצרטים במערכת!
              </p>
              <p className="text-red-600">
                עליך ליצור קונצרטים דרך דף הניהול או להריץ את המיגרציה.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  📋 אפשרות 1: עבור ל-
                  <a href="/Admin" className="underline text-primary">
                    /Admin
                  </a>{" "}
                  וצור קונצרטים ידנית
                </p>
                <p>
                  📋 אפשרות 2: עבור ל-
                  <a href="/migrate" className="underline text-primary">
                    /migrate
                  </a>{" "}
                  והרץ מיגרציה
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {concerts.map((concert, index) => (
                <div
                  key={concert.id}
                  className="bg-white border border-secondary rounded-lg p-4 shadow-medium"
                >
                  <div className="flex gap-4">
                    {concert.imageData && (
                      <img
                        src={concert.imageData}
                        alt={concert.artist}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 text-right">
                      <h3 className="text-xl font-bold text-primary">
                        {index + 1}. {concert.artist || "ללא שם"}
                      </h3>
                      <p className="text-strongText">
                        {concert.title || "ללא כותרת"}
                      </p>
                      <p className="text-mutedText text-sm">
                        📅 {concert.date} | 🕐 {concert.time}
                      </p>
                      <p className="text-mutedText text-sm">
                        📍 {concert.venue}
                      </p>
                      <p className="text-sm">
                        <span
                          className={
                            concert.status === "active"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          ● {concert.status}
                        </span>
                      </p>
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs space-y-1">
                        <p className="font-bold text-blue-800">
                          🔍 Matching Fields:
                        </p>
                        <p className="font-mono">artist: "{concert.artist}"</p>
                        <p className="font-mono">date: "{concert.date}"</p>
                        <p className="font-mono">venue: "{concert.venue}"</p>
                        <p className="text-blue-600 mt-1">
                          Tickets must match all three fields exactly
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tickets Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">
            ⏳ כרטיסים ממתינים (
            {tickets.filter((t) => t.status === "pending").length})
          </h2>
          {tickets.filter((t) => t.status === "pending").length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-right">
              <p className="text-green-800">✅ אין כרטיסים ממתינים</p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="mb-3 p-3 bg-white rounded border-l-4 border-orange-500">
                <p className="text-sm text-orange-800 font-bold">
                  ⚠️ כרטיסים אלה ממתינים לקונצרט מתאים
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  צור קונצרט עם artist, date, ו-venue תואמים כדי להפעיל אותם
                </p>
              </div>
              <div className="space-y-4">
                {tickets
                  .filter((t) => t.status === "pending")
                  .map((ticket, index) => (
                    <div
                      key={ticket.id}
                      className="bg-white border-2 border-orange-300 rounded-lg p-4"
                    >
                      <p className="font-bold text-lg mb-2">
                        🎫 כרטיס ממתין #{index + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <p>
                          💰 מחיר: ₪{ticket.askingPrice || ticket.price || 0}
                        </p>
                        <p>
                          📊 סטטוס:{" "}
                          <span className="text-orange-600 font-bold">
                            {ticket.status}
                          </span>
                        </p>
                        {ticket.section && <p>🪑 מקטע: {ticket.section}</p>}
                        {ticket.row && <p>📍 שורה: {ticket.row}</p>}
                        {ticket.seat && <p>💺 מושב: {ticket.seat}</p>}
                      </div>
                      <div className="mt-3 p-3 bg-orange-100 rounded text-xs space-y-1">
                        <p className="font-bold text-orange-900">
                          🔍 צריך להתאים:
                        </p>
                        <p className="font-mono bg-white p-1 rounded">
                          artist: "{ticket.artist}"
                        </p>
                        <p className="font-mono bg-white p-1 rounded">
                          date: "{ticket.date}"
                        </p>
                        <p className="font-mono bg-white p-1 rounded">
                          venue: "{ticket.venue}"
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Available Tickets Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            ✅ כרטיסים זמינים (
            {tickets.filter((t) => t.status === "available").length})
          </h2>
          {tickets.filter((t) => t.status === "available").length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-right">
              <p className="text-yellow-800">ℹ️ אין כרטיסים זמינים במערכת</p>
            </div>
          ) : (
            <div className="bg-secondary rounded-lg p-4">
              <div className="space-y-2 text-right text-sm">
                {tickets
                  .filter((t) => t.status === "available")
                  .slice(0, 5)
                  .map((ticket, index) => (
                    <div
                      key={ticket.id}
                      className="border-b border-primary pb-2"
                    >
                      <p className="font-semibold">כרטיס {index + 1}:</p>
                      <p>🎫 Concert ID: {ticket.concertId || "ללא ID"}</p>
                      <p>💰 מחיר: ₪{ticket.askingPrice || ticket.price || 0}</p>
                      <p>📊 סטטוס: {ticket.status || "לא ידוע"}</p>
                      {ticket.section && <p>🪑 מקטע: {ticket.section}</p>}
                      {ticket.row && <p>📍 שורה: {ticket.row}</p>}
                      <div className="mt-2 p-2 bg-purple-50 rounded text-xs space-y-1">
                        <p className="font-bold text-purple-800">
                          🔍 Ticket Fields:
                        </p>
                        <p className="font-mono">artist: "{ticket.artist}"</p>
                        <p className="font-mono">date: "{ticket.date}"</p>
                        <p className="font-mono">venue: "{ticket.venue}"</p>
                      </div>
                      {ticket.seat && <p>💺 מושב: {ticket.seat}</p>}
                    </div>
                  ))}
                {tickets.filter((t) => t.status === "available").length > 5 && (
                  <p className="text-mutedText text-center pt-2">
                    ועוד{" "}
                    {tickets.filter((t) => t.status === "available").length - 5}{" "}
                    כרטיסים...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-right">
          <h3 className="font-bold text-blue-900 mb-3">📊 סיכום</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✓ קונצרטים במערכת: {concerts.length}</li>
            <li>✓ כרטיסים במערכת: {tickets.length}</li>
            <li>
              ✓ קונצרטים פעילים:{" "}
              {concerts.filter((c) => c.status === "active").length}
            </li>
            <li className="text-green-700">
              ✓ כרטיסים זמינים:{" "}
              {tickets.filter((t) => t.status === "available").length}
            </li>
            <li
              className={
                tickets.filter((t) => t.status === "pending").length > 0
                  ? "text-orange-700 font-bold"
                  : "text-blue-800"
              }
            >
              {tickets.filter((t) => t.status === "pending").length > 0
                ? "⚠️"
                : "✓"}{" "}
              כרטיסים ממתינים:{" "}
              {tickets.filter((t) => t.status === "pending").length}
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
