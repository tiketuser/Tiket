"use client";

import React, { useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";

export default function UpdateImagesPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!confirm("האם אתה בטוח שברצונך לעדכן את תמונות הקונצרטים?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/update-concert-images", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update images");
      }

      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
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
          <div className="text-center mb-8">
            <h1 className="text-heading-2-desktop font-bold text-primary mb-2">
              🎨 עדכון תמונות קונצרטים
            </h1>
            <p className="text-text-large text-mutedText">
              המרת תמונות מהתיקייה public/images/Artist והוספתן לקונצרטים
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-secondary border border-primary rounded-lg p-6 mb-8 text-right">
            <h3 className="font-bold text-primary text-text-large mb-3">
              💡 איך זה עובד?
            </h3>
            <ul className="space-y-2 text-strongText text-text-medium">
              <li>• הסקריפט קורא תמונות מתיקיית Artist</li>
              <li>• ממיר אותן לפורמט base64</li>
              <li>• מתאים כל תמונה לקונצרט לפי שם האמן</li>
              <li>• מעדכן את שדה imageData בפיירסטור</li>
              <li>• מדלג על קונצרטים שכבר יש להם תמונה</li>
            </ul>
          </div>

          {/* Available Images */}
          <div className="bg-white border border-secondary rounded-lg p-6 mb-8 text-right shadow-large">
            <h3 className="font-bold text-primary text-text-large mb-4">
              📁 תמונות זמינות
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "עלמה גוב",
                "פאטן נבי",
                "גיא אביב",
                "כרן פלס",
                "מק בני",
                "נועה קירל",
                "אופק",
                "עומר אדם",
                "רביד פלוטניק",
                "רון אסעל",
                "שלמה ארצי",
                "טונה",
              ].map((artist) => (
                <div
                  key={artist}
                  className="bg-secondary p-3 rounded-lg text-center"
                >
                  <span className="text-strongText text-text-medium">
                    🎤 {artist}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className={`py-4 px-8 rounded-lg font-bold text-white text-text-large transition-all transform hover:scale-105 shadow-large ${
                loading
                  ? "bg-weakText cursor-not-allowed"
                  : "bg-primary hover:bg-highlight"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  מעדכן תמונות...
                </span>
              ) : (
                "🎨 עדכן תמונות קונצרטים"
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-right">
              <h3 className="font-bold text-red-900 mb-2">❌ שגיאה</h3>
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-secondary border border-primary rounded-lg p-6 text-right">
                <h3 className="font-bold text-primary text-text-large mb-4">
                  📊 סיכום
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <div className="text-heading-3-desktop font-bold text-primary">
                      {results.total}
                    </div>
                    <div className="text-text-small text-mutedText">
                      סה"כ קונצרטים
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <div className="text-heading-3-desktop font-bold text-green-600">
                      {results.updated}
                    </div>
                    <div className="text-text-small text-mutedText">עודכנו</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <div className="text-heading-3-desktop font-bold text-yellow-600">
                      {results.skipped}
                    </div>
                    <div className="text-text-small text-mutedText">דולגו</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <div className="text-heading-3-desktop font-bold text-red-600">
                      {results.notFound + results.errors}
                    </div>
                    <div className="text-text-small text-mutedText">שגיאות</div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white border border-secondary rounded-lg p-6 text-right shadow-large">
                <h3 className="font-bold text-primary text-text-large mb-4">
                  📋 פירוט
                </h3>
                <div className="space-y-3">
                  {results.details.map((detail: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        detail.status === "updated"
                          ? "bg-green-50 border-green-200"
                          : detail.status === "skipped"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 text-right">
                          <p className="font-bold text-strongText">
                            {detail.artist}
                          </p>
                          <p className="text-text-small text-mutedText">
                            {detail.message}
                          </p>
                          {detail.imageFile && (
                            <p className="text-text-extra-small text-mutedText">
                              📁 {detail.imageFile}
                            </p>
                          )}
                        </div>
                        <div className="mr-4">
                          {detail.status === "updated" && (
                            <span className="text-2xl">✅</span>
                          )}
                          {detail.status === "skipped" && (
                            <span className="text-2xl">⏭️</span>
                          )}
                          {(detail.status === "not_found" ||
                            detail.status === "error") && (
                            <span className="text-2xl">❌</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Message */}
              {results.updated > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-right">
                  <h3 className="font-bold text-green-900 mb-2">
                    ✅ עדכון הושלם בהצלחה!
                  </h3>
                  <p className="text-green-800">
                    {results.updated} קונצרטים עודכנו בהצלחה עם תמונות מקצועיות.
                    <br />
                    עכשיו אפשר לראות אותם בגלריה בדף הבית!
                  </p>
                  <div className="mt-4">
                    <a
                      href="/"
                      className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-highlight transition-colors"
                    >
                      🏠 חזרה לדף הבית
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-right">
            <h3 className="font-bold text-blue-900 text-text-large mb-3">
              📝 הוראות
            </h3>
            <ol className="space-y-2 text-blue-800 text-text-medium list-decimal list-inside">
              <li>ודא שיש קונצרטים בפיירסטור (הרץ מיגרציה או צור ידנית)</li>
              <li>לחץ על כפתור "עדכן תמונות קונצרטים"</li>
              <li>המתן לסיום העדכון (עשוי לקחת מספר שניות)</li>
              <li>בדוק את התוצאות ורשימת העדכונים</li>
              <li>עבור לדף הבית כדי לראות את הקונצרטים עם התמונות החדשות</li>
            </ol>
          </div>
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
