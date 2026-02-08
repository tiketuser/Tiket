"use client";

import React, { useState, useEffect } from "react";
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
  title: string;
  date: string;
  venue: string;
  categories?: string[];
}

const AVAILABLE_CATEGORIES = [
  { id: "recently-viewed", label: "נצפה לאחרונה" },
  { id: "last-minute-deals", label: "דילים ברגע האחרון" },
  { id: "recommendations", label: "המלצות שלנו" },
];

export default function ManageCategoriesPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      const concertsSnapshot = await getDocs(collection(db as any, "concerts"));
      const concertsData: Concert[] = concertsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Concert[];

      setConcerts(concertsData.filter((c) => c.artist && c.date));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching concerts:", error);
      setLoading(false);
    }
  };

  const toggleCategory = async (concertId: string, categoryId: string) => {
    setSaving(concertId);

    try {
      const concert = concerts.find((c) => c.id === concertId);
      if (!concert) return;

      const currentCategories = concert.categories || [];
      const newCategories = currentCategories.includes(categoryId)
        ? currentCategories.filter((cat) => cat !== categoryId)
        : [...currentCategories, categoryId];

      await updateDoc(doc(db as any, "concerts", concertId), {
        categories: newCategories,
      });

      // Update local state
      setConcerts((prev) =>
        prev.map((c) =>
          c.id === concertId ? { ...c, categories: newCategories } : c
        )
      );

      setSaving(null);
    } catch (error) {
      console.error("Error updating categories:", error);
      alert("שגיאה בעדכון הקטגוריות");
      setSaving(null);
    }
  };

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-xl shadow-large p-8 mb-8">
            <h1 className="text-heading-1-desktop font-bold text-strongText mb-2">
              ניהול קטגוריות
            </h1>
            <p className="text-body-large text-mutedText">
              בחר באילו קטגוריות כל אירוע יוצג בדף ViewMore
            </p>
          </div>

          {loading && (
            <div className="text-center text-lg text-gray-500 py-8">
              טוען אירועים...
            </div>
          )}

          {!loading && concerts.length === 0 && (
            <div className="text-center text-lg text-gray-500 py-8">
              אין אירועים זמינים
            </div>
          )}

          {!loading && concerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-large p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-right px-4 py-3 font-bold text-strongText">
                        אמן
                      </th>
                      <th className="text-right px-4 py-3 font-bold text-strongText">
                        תאריך
                      </th>
                      <th className="text-right px-4 py-3 font-bold text-strongText">
                        מקום
                      </th>
                      {AVAILABLE_CATEGORIES.map((cat) => (
                        <th
                          key={cat.id}
                          className="text-center px-4 py-3 font-bold text-strongText"
                        >
                          {cat.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {concerts.map((concert) => (
                      <tr
                        key={concert.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 text-strongText">
                          {concert.artist}
                        </td>
                        <td className="px-4 py-4 text-mutedText">
                          {concert.date}
                        </td>
                        <td className="px-4 py-4 text-mutedText">
                          {concert.venue}
                        </td>
                        {AVAILABLE_CATEGORIES.map((cat) => (
                          <td key={cat.id} className="px-4 py-4 text-center">
                            <button
                              onClick={() => toggleCategory(concert.id, cat.id)}
                              disabled={saving === concert.id}
                              className={`w-8 h-8 rounded border-2 transition-colors ${
                                concert.categories?.includes(cat.id)
                                  ? "bg-primary border-primary"
                                  : "bg-white border-gray-300 hover:border-primary"
                              } ${
                                saving === concert.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {concert.categories?.includes(cat.id) && (
                                <span className="text-white text-sm">✓</span>
                              )}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">מידע:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>לחץ על התיבות כדי להוסיף או להסיר אירוע מקטגוריה</li>
                  <li>אירועים יכולים להיות במספר קטגוריות בו זמנית</li>
                  <li>השינויים נשמרים אוטומטית ויופיעו מיד בדף ViewMore</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
