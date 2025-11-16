"use client";

import { useState, useEffect } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import { db } from "../../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface Concert {
  id: string;
  artist: string;
  date?: string;
  time?: string;
  venue?: string;
  [key: string]: any;
}

export default function FixConcertDatesPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      const concertsSnapshot = await getDocs(collection(db as any, "concerts"));
      const concertsData: Concert[] = [];

      concertsSnapshot.forEach((doc) => {
        concertsData.push({
          id: doc.id,
          ...(doc.data() as any),
        });
      });

      setConcerts(concertsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching concerts:", error);
      setLoading(false);
    }
  };

  const fixAllDates = async () => {
    if (
      !confirm(
        "This will set default dates for concerts missing dates. Continue?"
      )
    ) {
      return;
    }

    setFixing(true);
    setMessage(null);

    try {
      let fixedCount = 0;
      const defaultDates = [
        "25/12/2025",
        "01/01/2026",
        "14/02/2026",
        "20/03/2026",
        "15/04/2026",
        "01/05/2026",
        "20/06/2026",
        "15/07/2026",
      ];

      for (let i = 0; i < concerts.length; i++) {
        const concert = concerts[i];

        if (
          !concert.date ||
          concert.date === "" ||
          concert.date === "undefined"
        ) {
          const defaultDate = defaultDates[i % defaultDates.length];
          const defaultTime = "20:00";

          await updateDoc(doc(db as any, "concerts", concert.id), {
            date: defaultDate,
            time: defaultTime,
          });

          fixedCount++;
        }
      }

      setMessage({
        type: "success",
        text: `Fixed ${fixedCount} concerts with missing dates!`,
      });

      // Refresh data
      await fetchConcerts();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-heading-3-desktop text-strongText">
              Loading concerts...
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const concertsWithMissingDates = concerts.filter(
    (c) => !c.date || c.date === "" || c.date === "undefined"
  );

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-heading-1-desktop font-bold text-strongText mb-4">
              📅 Fix Concert Dates
            </h1>
            <p className="text-body-large text-mutedText">
              Check and fix any concerts with missing or invalid dates
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="text-heading-2-desktop font-bold text-blue-600 mb-2">
                {concerts.length}
              </div>
              <div className="text-body-medium text-blue-800">
                Total Concerts
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="text-heading-2-desktop font-bold text-green-600 mb-2">
                {
                  concerts.filter(
                    (c) => c.date && c.date !== "" && c.date !== "undefined"
                  ).length
                }
              </div>
              <div className="text-body-medium text-green-800">
                With Valid Dates
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center">
              <div className="text-heading-2-desktop font-bold text-red-600 mb-2">
                {concertsWithMissingDates.length}
              </div>
              <div className="text-body-medium text-red-800">Missing Dates</div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-8 p-4 rounded-xl ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Fix Button */}
          {concertsWithMissingDates.length > 0 && (
            <div className="mb-8 text-center">
              <button
                onClick={fixAllDates}
                disabled={fixing}
                className="bg-primary hover:bg-highlight text-white font-semibold px-8 py-4 rounded-xl 
                         shadow-large transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fixing
                  ? "Fixing..."
                  : `🔧 Fix ${concertsWithMissingDates.length} Concerts`}
              </button>
              <p className="text-body-small text-mutedText mt-2">
                This will set default dates for concerts missing dates
              </p>
            </div>
          )}

          {/* Concerts List */}
          <div className="bg-white rounded-xl shadow-large p-6">
            <h2 className="text-heading-3-desktop font-bold text-strongText mb-6">
              All Concerts
            </h2>
            <div className="space-y-4">
              {concerts.map((concert) => {
                const hasDate =
                  concert.date &&
                  concert.date !== "" &&
                  concert.date !== "undefined";

                return (
                  <div
                    key={concert.id}
                    className={`p-4 rounded-lg border-2 ${
                      hasDate
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-heading-5-desktop font-bold text-strongText">
                          🎤 {concert.artist}
                        </div>
                        <div className="text-body-small text-mutedText mt-1">
                          📍 {concert.venue || "No venue"}
                        </div>
                      </div>
                      <div className="text-right">
                        {hasDate ? (
                          <>
                            <div className="text-body-medium font-semibold text-green-700">
                              ✅ {concert.date}
                            </div>
                            <div className="text-body-small text-green-600">
                              {concert.time || "No time"}
                            </div>
                          </>
                        ) : (
                          <div className="text-body-medium font-semibold text-red-700">
                            ❌ No Date
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-body-extra-small text-mutedText">
                      ID: {concert.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block bg-secondary hover:bg-highlight text-strongText font-semibold px-6 py-3 rounded-lg 
                       transition-all duration-200"
            >
              🏠 Back to Gallery
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
