"use client";

import React, { useState } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import { getAuth } from "firebase/auth";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface ArtistAlias {
  canonical: string;
  hebrewName: string;
  englishName: string;
  variations: string[];
}

export default function ManageArtistsPage() {
  const [canonicalName, setCanonicalName] = useState("");
  const [hebrewName, setHebrewName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [variations, setVariations] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAlias = async () => {
    if (!canonicalName || !hebrewName || !englishName) {
      alert("נא למלא את כל השדות הנדרשים");
      return;
    }

    setIsLoading(true);

    try {
      // Get current user's ID token for authentication
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const idToken = await user.getIdToken();

      // Parse variations
      const variationsList = variations
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      // Call API to add alias
      const response = await fetch("/api/add-artist-alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          canonicalName,
          hebrewName,
          englishName,
          variations: variationsList,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add alias");
      }

      // Show success message
      setSuccessMessage(
        `ההתאמה נוספה בהצלחה! "${data.alias.canonical}" עם ${data.alias.variations.length} וריאציות`
      );

      // Clear form after success
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (error: any) {
      console.error("Error adding alias:", error);
      alert(`שגיאה: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCanonicalName("");
    setHebrewName("");
    setEnglishName("");
    setVariations("");
    setSuccessMessage("");
  };

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-large p-8 mb-8">
            <h1 className="text-heading-1-desktop font-bold text-strongText mb-2">
              ניהול אמנים
            </h1>
            <p className="text-body-large text-mutedText">
              הוסף התאמות חדשות בין שמות אמנים בעברית ואנגלית
            </p>
          </div>

          {/* Add Alias Form */}
          <div className="bg-white rounded-xl shadow-large p-8">
            <h2 className="text-heading-2-desktop font-bold text-strongText mb-6">
              הוספת התאמה חדשה
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-strongText mb-2">
                  שם קנוני (Canonical Name) *
                </label>
                <input
                  type="text"
                  value={canonicalName}
                  onChange={(e) => setCanonicalName(e.target.value)}
                  placeholder="לדוגמה: omer adam"
                  className="w-full px-4 py-3 border border-mutedBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-mutedText mt-1">
                  זהו השם הבסיסי שכל הווריאציות יקושרו אליו (באותיות קטנות
                  באנגלית)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-strongText mb-2">
                    שם בעברית *
                  </label>
                  <input
                    type="text"
                    value={hebrewName}
                    onChange={(e) => setHebrewName(e.target.value)}
                    placeholder="לדוגמה: עומר אדם"
                    className="w-full px-4 py-3 border border-mutedBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-strongText mb-2">
                    שם באנגלית *
                  </label>
                  <input
                    type="text"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    placeholder="לדוגמה: Omer Adam"
                    className="w-full px-4 py-3 border border-mutedBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-strongText mb-2">
                  ווריאציות נוספות (אופציונלי)
                </label>
                <input
                  type="text"
                  value={variations}
                  onChange={(e) => setVariations(e.target.value)}
                  placeholder="לדוגמה: umeradam, Omer, עומר"
                  className="w-full px-4 py-3 border border-mutedBorder rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-mutedText mt-1">
                  הפרד בפסיקים כתיבות שונות או כינויים
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddAlias}
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "הוסף התאמה"
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isLoading}
                  className="btn btn-secondary flex-1"
                >
                  נקה שדות
                </button>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mt-6">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-green-900 mb-3">
                    ההתאמה נוספה בהצלחה
                  </h3>
                  <p className="text-sm text-green-800">{successMessage}</p>
                  <p className="text-xs text-green-700 mt-3">
                    ההתאמה נשמרה ב-Firestore ותהיה זמינה מיד לשימוש.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Existing Aliases */}
          <div className="bg-white rounded-xl shadow-large p-8 mt-8">
            <h2 className="text-heading-3-desktop font-bold text-strongText mb-4">
              התאמות קיימות במערכת
            </h2>
            <p className="text-sm text-mutedText mb-4">
              להלן דוגמאות להתאמות שכבר קיימות במערכת:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>עומר אדם</strong> ↔ Omer Adam
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>סטטיק ובן אל</strong> ↔ Static and Ben El Tavori
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>נטע ברזילי</strong> ↔ Netta Barzilai
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>אייל גולן</strong> ↔ Eyal Golan
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>שרית חדד</strong> ↔ Sarit Hadad
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>עידן רייכל</strong> ↔ Idan Raichel
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>משינה</strong> ↔ Mashina
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <strong>ברי סחרוף</strong> ↔ Berry Sakharof
              </div>
            </div>
            <p className="text-xs text-mutedText mt-4">
              ההתאמות מאוחסנות ב-Firestore ונטענות באופן דינמי.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
