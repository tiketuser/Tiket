"use client";

import { useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";

export default function RegenerateTicketsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleRegenerate = async () => {
    if (
      !confirm(
        "⚠️ This will DELETE ALL existing tickets and create new ones!\n\nAre you sure you want to continue?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/regenerate-tickets", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate tickets"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-heading-1-desktop font-bold text-strongText mb-4">
              🎫 Regenerate Tickets
            </h1>
            <p className="text-body-large text-mutedText max-w-2xl mx-auto">
              This tool will delete all existing tickets and generate new
              realistic tickets for each concert in the database.
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-4xl">⚠️</span>
              <div>
                <h3 className="text-heading-4-desktop font-semibold text-red-800 mb-2">
                  Warning: Destructive Action
                </h3>
                <p className="text-body-medium text-red-700">
                  This will{" "}
                  <strong>permanently delete ALL existing tickets</strong> from
                  your database and create new randomly generated ones. This
                  action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="bg-primary hover:bg-highlight text-white font-semibold px-8 py-4 rounded-xl 
                       shadow-large transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       text-body-large"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Regenerating Tickets...
                </span>
              ) : (
                "🔄 Regenerate All Tickets"
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <h3 className="text-heading-5-desktop font-semibold text-red-800 mb-2">
                    Error
                  </h3>
                  <p className="text-body-medium text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
              <div className="text-center mb-6">
                <span className="text-6xl mb-4 block">✨</span>
                <h2 className="text-heading-2-desktop font-bold text-green-800 mb-2">
                  Tickets Regenerated Successfully!
                </h2>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-primary mb-1">
                    {result.concerts}
                  </div>
                  <div className="text-body-small text-mutedText">Concerts</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-red-600 mb-1">
                    {result.oldTicketsDeleted}
                  </div>
                  <div className="text-body-small text-mutedText">Deleted</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-green-600 mb-1">
                    {result.newTicketsCreated}
                  </div>
                  <div className="text-body-small text-mutedText">Created</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-highlight mb-1">
                    {result.averagePerConcert}
                  </div>
                  <div className="text-body-small text-mutedText">
                    Avg/Concert
                  </div>
                </div>
              </div>

              {/* Concert Details */}
              <div>
                <h3 className="text-heading-4-desktop font-semibold text-strongText mb-4">
                  📋 Concert Breakdown
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.concertDetails.map((concert: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 shadow-medium flex items-center justify-between"
                    >
                      <div>
                        <div className="text-body-large font-semibold text-strongText">
                          🎤 {concert.artist}
                        </div>
                        <div className="text-body-small text-mutedText">
                          📅 {concert.date} | 📍 {concert.venue}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-body-medium font-semibold text-primary">
                          {concert.ticketCount} tickets
                        </div>
                        <div className="text-body-small text-mutedText">
                          {concert.priceRange}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Links */}
              <div className="mt-8 flex gap-4 justify-center">
                <a
                  href="/"
                  className="bg-primary hover:bg-highlight text-white font-semibold px-6 py-3 rounded-lg 
                           transition-all duration-200 text-body-medium"
                >
                  🏠 View Gallery
                </a>
                <a
                  href="/diagnostic"
                  className="bg-secondary hover:bg-highlight text-strongText font-semibold px-6 py-3 rounded-lg 
                           transition-all duration-200 text-body-medium"
                >
                  🔍 View Diagnostic
                </a>
              </div>
            </div>
          )}

          {/* Info Section */}
          {!result && !error && !loading && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-heading-4-desktop font-semibold text-blue-800 mb-4">
                ℹ️ What This Does
              </h3>
              <ul className="space-y-2 text-body-medium text-blue-700">
                <li className="flex items-start gap-2">
                  <span>1️⃣</span>
                  <span>Fetches all concerts from your database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2️⃣</span>
                  <span>Deletes ALL existing tickets permanently</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>3️⃣</span>
                  <span>Generates 5-20 realistic tickets per concert</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>4️⃣</span>
                  <span>
                    Creates tickets with varied sections (A, B, C, VIP, Gold,
                    Silver)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>5️⃣</span>
                  <span>
                    Includes both seated tickets (with row/seat) and standing
                    tickets
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>6️⃣</span>
                  <span>
                    Generates realistic price ranges (₪150-₪1000) with discounts
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
