"use client";

import { useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

export default function RegenerateTicketsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleRegenerate = async () => {
    if (
      !confirm(
        "אזהרה: פעולה זו תמחק את כל הכרטיסים הקיימים ותיצור כרטיסים חדשים!\n\nהאם אתה בטוח שברצונך להמשיך?"
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
              יצירת כרטיסים מחדש
            </h1>
            <p className="text-body-large text-mutedText max-w-2xl mx-auto">
              כלי זה ימחק את כל הכרטיסים הקיימים ויצור כרטיסים ריאליסטיים חדשים
              לכל הופעה במסד הנתונים.
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-4xl">⚠</span>
              <div>
                <h3 className="text-heading-4-desktop font-semibold text-red-800 mb-2">
                  אזהרה: פעולה הרסנית
                </h3>
                <p className="text-body-medium text-red-700">
                  פעולה זו תמחק <strong>לצמיתות את כל הכרטיסים הקיימים</strong>{" "}
                  ממסד הנתונים ותיצור כרטיסים חדשים באופן אקראי. לא ניתן לבטל
                  פעולה זו.
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
                  מייצר כרטיסים מחדש...
                </span>
              ) : (
                "יצירת כרטיסים מחדש"
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✕</span>
                <div>
                  <h3 className="text-heading-5-desktop font-semibold text-red-800 mb-2">
                    שגיאה
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
                <span className="text-6xl mb-4 block">✓</span>
                <h2 className="text-heading-2-desktop font-bold text-green-800 mb-2">
                  הכרטיסים נוצרו מחדש בהצלחה!
                </h2>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-primary mb-1">
                    {result.concerts}
                  </div>
                  <div className="text-body-small text-mutedText">הופעות</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-red-600 mb-1">
                    {result.oldTicketsDeleted}
                  </div>
                  <div className="text-body-small text-mutedText">נמחקו</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-green-600 mb-1">
                    {result.newTicketsCreated}
                  </div>
                  <div className="text-body-small text-mutedText">נוצרו</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-medium">
                  <div className="text-heading-2-desktop font-bold text-highlight mb-1">
                    {result.averagePerConcert}
                  </div>
                  <div className="text-body-small text-mutedText">
                    ממוצע להופעה
                  </div>
                </div>
              </div>

              {/* Concert Details */}
              <div>
                <h3 className="text-heading-4-desktop font-semibold text-strongText mb-4">
                  פירוט הופעות
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.concertDetails.map((concert: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 shadow-medium flex items-center justify-between"
                    >
                      <div>
                        <div className="text-body-large font-semibold text-strongText">
                          {concert.artist}
                        </div>
                        <div className="text-body-small text-mutedText">
                          {concert.date} | {concert.venue}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-body-medium font-semibold text-primary">
                          {concert.ticketCount} כרטיסים
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
                  לגלריה
                </a>
                <a
                  href="/diagnostic"
                  className="bg-secondary hover:bg-highlight text-strongText font-semibold px-6 py-3 rounded-lg 
                           transition-all duration-200 text-body-medium"
                >
                  לאבחון
                </a>
              </div>
            </div>
          )}

          {/* Info Section */}
          {!result && !error && !loading && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-heading-4-desktop font-semibold text-blue-800 mb-4">
                מה עושה הכלי הזה
              </h3>
              <ul className="space-y-2 text-body-medium text-blue-700">
                <li className="flex items-start gap-2">
                  <span>1.</span>
                  <span>מביא את כל הההופעות ממסד הנתונים</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>2.</span>
                  <span>מוחק את כל הכרטיסים הקיימים לצמיתות</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>3.</span>
                  <span>מייצר 5-20 כרטיסים ריאליסטיים להופעה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>4.</span>
                  <span>
                    יוצר כרטיסים עם יציעים שונים (A, B, C, VIP, זהב, כסף)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>5.</span>
                  <span>כולל גם כרטיסים עם מקומות ישיבה וכרטיסי עמידה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>6.</span>
                  <span>
                    מייצר טווחי מחירים ריאליסטיים (150-1000 ש״ח) עם הנחות
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
