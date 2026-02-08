"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import {
  getDefaultCategoryImage,
  updateDefaultCategoryImage,
  FALLBACK_IMAGE_SVG,
} from "../theme/defaultCategoryImages";
import { db, collection, getDocs, query, where } from "../../firebase";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface CategoryImageData {
  category: string;
  label: string;
  imageData: string;
  loading: boolean;
}

export default function ManageDefaultImagesPage() {
  const [categories, setCategories] = useState<CategoryImageData[]>([
    { category: "מוזיקה", label: "מוזיקה", imageData: "", loading: true },
    { category: "תיאטרון", label: "תיאטרון", imageData: "", loading: true },
    { category: "סטנדאפ", label: "סטנדאפ", imageData: "", loading: true },
    { category: "ילדים", label: "ילדים", imageData: "", loading: true },
    { category: "ספורט", label: "ספורט", imageData: "", loading: true },
  ]);

  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load default images on mount
  useEffect(() => {
    const loadImages = async () => {
      const updatedCategories = await Promise.all(
        categories.map(async (cat) => {
          try {
            const imageData = await getDefaultCategoryImage(cat.category);
            return { ...cat, imageData, loading: false };
          } catch (error) {
            console.error(`Error loading ${cat.category}:`, error);
            return {
              ...cat,
              imageData: FALLBACK_IMAGE_SVG(cat.category),
              loading: false,
            };
          }
        })
      );
      setCategories(updatedCategories);
    };

    loadImages();
  }, []);

  const handleImageUpload = async (category: string, file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "נא להעלות קובץ תמונה בפורמט JPG, PNG או WEBP",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "גודל הקובץ חורג מ-5MB",
      });
      return;
    }

    setUploading(category);
    setMessage(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        // Update in Firestore
        await updateDefaultCategoryImage(category, base64Data);

        // Update local state
        setCategories((prev) =>
          prev.map((cat) =>
            cat.category === category ? { ...cat, imageData: base64Data } : cat
          )
        );

        setMessage({
          type: "success",
          text: `✅ תמונת ברירת מחדל עבור ${category} עודכנה בהצלחה`,
        });
      };

      reader.onerror = () => {
        setMessage({
          type: "error",
          text: "שגיאה בקריאת הקובץ",
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error updating default image:", error);
      setMessage({
        type: "error",
        text: "שגיאה בעדכון התמונה. נא לנסות שוב.",
      });
    } finally {
      setUploading(null);
    }
  };

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-heading-2-desktop md:text-heading-1-desktop font-bold text-primary mb-2">
              ניהול תמונות ברירת מחדל
            </h1>
            <p className="text-text-large text-mutedText">
              קבע תמונות ברירת מחדל לכל קטגוריה שישמשו כאשר לא נבחרה תמונה
              לאירוע
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg text-center ${
                message.type === "success"
                  ? "bg-secondary text-primary border border-primary"
                  : "bg-red-100 text-red-600 border border-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="bg-white rounded-2xl shadow-large border border-secondary overflow-hidden hover:shadow-xlarge transition-shadow"
              >
                {/* Category Header */}
                <div className="bg-primary text-white p-4 text-center">
                  <h3 className="text-heading-4-desktop font-bold">
                    {cat.label}
                  </h3>
                </div>

                {/* Image Preview */}
                <div className="relative w-full h-64 bg-secondary">
                  {cat.loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <img
                      src={cat.imageData}
                      alt={`${cat.label} ברירת מחדל`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {uploading === cat.category && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="p-4">
                  <label
                    htmlFor={`upload-${cat.category}`}
                    className={`block w-full px-4 py-3 text-center rounded-lg font-semibold transition-all cursor-pointer ${
                      uploading === cat.category
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-highlight"
                    }`}
                  >
                    {uploading === cat.category ? "מעלה..." : "העלה תמונה חדשה"}
                  </label>
                  <input
                    type="file"
                    id={`upload-${cat.category}`}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) =>
                      handleImageUpload(
                        cat.category,
                        e.target.files?.[0] || null
                      )
                    }
                    className="hidden"
                    disabled={uploading === cat.category}
                  />
                  <p className="text-text-extra-small text-mutedText text-center mt-2">
                    JPG, PNG או WEBP (מקס 5MB)
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-8 max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
            <ul className="text-text-medium text-blue-800 space-y-2 text-right list-disc list-inside">
              <li>תמונות אלו ישמשו כברירת מחדל כאשר לא תועלה תמונה לאירוע</li>
              <li>
                מומלץ להשתמש בתמונות איכותיות בגודל מינימלי של 800x600 פיקסלים
              </li>
              <li>
                התמונות ישמרו במסד הנתונים ויהיו זמינות לכל האירועים החדשים
              </li>
              <li>ניתן לעדכן את התמונות בכל עת</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
