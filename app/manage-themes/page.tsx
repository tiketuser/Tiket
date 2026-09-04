"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import MobileAdminChrome from "../components/mobile/MobileAdminChrome";
import { categoryThemes, CategoryTheme } from "../theme/categoryThemes";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface ThemeConfig {
  [category: string]: CategoryTheme;
}

export default function ManageThemesPage() {
  const [themes, setThemes] = useState<ThemeConfig>(categoryThemes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("מוזיקה");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      if (!db) {
        console.error("Firebase not initialized");
        setThemes(categoryThemes);
        setLoading(false);
        return;
      }

      // Try to fetch themes from Firebase
      const themesDoc = await getDoc(
        doc(db as any, "settings", "categoryThemes")
      );

      if (themesDoc.exists()) {
        const data = themesDoc.data();
        setThemes(data.themes || categoryThemes);
      } else {
        // Use default themes if none exist in Firebase
        setThemes(categoryThemes);
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
      setThemes(categoryThemes);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (
    category: string,
    colorType: "primary" | "secondary" | "highlight",
    value: string
  ) => {
    setThemes((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [colorType]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!confirm("האם לשמור את השינויים? הצבעים ישתנו לכל המשתמשים.")) return;

    setSaving(true);
    try {
      if (!db) {
        throw new Error("Firebase not initialized");
      }

      // Save to Firebase
      await setDoc(doc(db as any, "settings", "categoryThemes"), {
        themes: themes,
        updatedAt: new Date().toISOString(),
      });

      alert(" הצבעים נשמרו בהצלחה!");

      // Reload the page to apply new themes
      window.location.reload();
    } catch (error) {
      console.error("Error saving themes:", error);
      alert("❌ שגיאה בשמירת הצבעים");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("האם לאפס את כל הצבעים לברירת המחדל?")) return;
    setThemes(categoryThemes);
  };

  const applyPreview = (category: string) => {
    const theme = themes[category];
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-secondary", theme.secondary);
    root.style.setProperty("--color-highlight", theme.highlight);
  };

  const categories = Object.keys(themes);

  if (loading) {
    return (
      <AdminProtection>
        <MobileAdminChrome title="צבעי קטגוריות" />
        <div className="hidden md:block">
          <NavBar />
        </div>
        <div className="tk-admin min-h-screen bg-white py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">טוען צבעים...</p>
          </div>
        </div>
        <div className="hidden md:block">
          <Footer />
        </div>
      </AdminProtection>
    );
  }

  return (
    <AdminProtection>
      <MobileAdminChrome title="צבעי קטגוריות" />
      <div className="hidden md:block">
        <NavBar />
      </div>
      <div className="tk-admin min-h-screen bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-heading-1-desktop font-bold text-strongText mb-4">
              ניהול צבעי קטגוריות
            </h1>
            <p className="text-body-large text-mutedText">
              התאם אישית את ערכת הצבעים לכל קטגוריה
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary px-8"
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  שומר...
                </>
              ) : (
                " שמור שינויים"
              )}
            </button>
            <button onClick={handleReset} className="btn btn-outline px-8">
              אפס לברירת מחדל
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  if (previewMode) applyPreview(category);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-strongText hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Color Editor */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-heading-3-desktop font-bold text-strongText">
                עריכת צבעים: {selectedCategory}
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={previewMode}
                  onChange={(e) => {
                    setPreviewMode(e.target.checked);
                    if (e.target.checked) {
                      applyPreview(selectedCategory);
                    }
                  }}
                  className="toggle toggle-primary"
                />
                <span className="text-sm font-semibold">תצוגה מקדימה</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Primary Color */}
              <div className="space-y-4">
                <label className="block">
                  <span className="text-lg font-semibold text-strongText mb-2 block">
                    צבע ראשי (Primary)
                  </span>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={themes[selectedCategory]?.primary || "#B54653"}
                      onChange={(e) =>
                        handleColorChange(
                          selectedCategory,
                          "primary",
                          e.target.value
                        )
                      }
                      className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={themes[selectedCategory]?.primary || "#B54653"}
                        onChange={(e) =>
                          handleColorChange(
                            selectedCategory,
                            "primary",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="#B54653"
                      />
                      <p className="text-xs text-mutedText mt-1">
                        צבע כפתורים וטקסט מודגש
                      </p>
                    </div>
                  </div>
                </label>

                {/* Preview Box */}
                <div
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: themes[selectedCategory]?.primary,
                    borderColor: themes[selectedCategory]?.primary,
                  }}
                >
                  <p className="text-white font-bold text-center">כפתור ראשי</p>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-4">
                <label className="block">
                  <span className="text-lg font-semibold text-strongText mb-2 block">
                    צבע משני (Secondary)
                  </span>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={themes[selectedCategory]?.secondary || "#EAC4C7"}
                      onChange={(e) =>
                        handleColorChange(
                          selectedCategory,
                          "secondary",
                          e.target.value
                        )
                      }
                      className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={themes[selectedCategory]?.secondary || "#EAC4C7"}
                        onChange={(e) =>
                          handleColorChange(
                            selectedCategory,
                            "secondary",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="#EAC4C7"
                      />
                      <p className="text-xs text-mutedText mt-1">
                        רקע וצבעי משנה
                      </p>
                    </div>
                  </div>
                </label>

                {/* Preview Box */}
                <div
                  className="p-4 rounded-lg border-2 border-gray-300"
                  style={{
                    backgroundColor: themes[selectedCategory]?.secondary,
                  }}
                >
                  <p className="text-strongText font-bold text-center">
                    רקע משני
                  </p>
                </div>
              </div>

              {/* Highlight Color */}
              <div className="space-y-4">
                <label className="block">
                  <span className="text-lg font-semibold text-strongText mb-2 block">
                    צבע הדגשה (Highlight)
                  </span>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={themes[selectedCategory]?.highlight || "#8C5A5F"}
                      onChange={(e) =>
                        handleColorChange(
                          selectedCategory,
                          "highlight",
                          e.target.value
                        )
                      }
                      className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={themes[selectedCategory]?.highlight || "#8C5A5F"}
                        onChange={(e) =>
                          handleColorChange(
                            selectedCategory,
                            "highlight",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="#8C5A5F"
                      />
                      <p className="text-xs text-mutedText mt-1">
                        מצבי Hover והדגשה
                      </p>
                    </div>
                  </div>
                </label>

                {/* Preview Box */}
                <div
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: themes[selectedCategory]?.highlight,
                    borderColor: themes[selectedCategory]?.highlight,
                  }}
                >
                  <p className="text-white font-bold text-center">הדגשה</p>
                </div>
              </div>
            </div>

            {/* Combined Preview */}
            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <h3 className="text-lg font-bold text-strongText mb-4">
                תצוגה משולבת
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-6 rounded-lg"
                  style={{
                    backgroundColor: themes[selectedCategory]?.secondary,
                  }}
                >
                  <button
                    className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all hover:scale-105"
                    style={{
                      backgroundColor: themes[selectedCategory]?.primary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        themes[selectedCategory]?.highlight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        themes[selectedCategory]?.primary;
                    }}
                  >
                    כפתור דוגמה
                  </button>
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-24 rounded-lg"
                    style={{
                      backgroundColor: themes[selectedCategory]?.primary,
                    }}
                  ></div>
                  <div
                    className="flex-1 h-24 rounded-lg"
                    style={{
                      backgroundColor: themes[selectedCategory]?.secondary,
                    }}
                  ></div>
                  <div
                    className="flex-1 h-24 rounded-lg"
                    style={{
                      backgroundColor: themes[selectedCategory]?.highlight,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              💡 מידע חשוב
            </h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>השינויים ישמרו ב-Firebase ויחולו על כל המשתמשים</li>
              <li>השתמש ב"תצוגה מקדימה" כדי לראות את הצבעים בפעולה</li>
              <li>צבעים בפורמט HEX (לדוגמה: #B54653)</li>
              <li>לחץ "אפס לברירת מחדל" כדי לחזור לצבעים המקוריים</li>
              <li>מומלץ לשמור גיבוי לפני שינויים משמעותיים</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </AdminProtection>
  );
}
