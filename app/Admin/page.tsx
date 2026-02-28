"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  doc,
  where,
  updateDoc,
} from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import { getDefaultCategoryImage } from "../theme/defaultCategoryImages";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface EventFormData {
  artist: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  imageFile: File | null;
  imagePreview: string;
}

interface Event {
  id: string;
  artist: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  imageUrl: string;
  status: string;
  views: number;
  createdAt: any;
  ticketsCount?: number; // Number of available tickets
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [formData, setFormData] = useState<EventFormData>({
    artist: "",
    category: "מוזיקה",
    date: "",
    time: "",
    venue: "",
    imageFile: null,
    imagePreview: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Bulk import state
  const [bulkJson, setBulkJson] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch existing events with ticket counts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(
          collection(db as any, "events"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(eventsQuery);
        const eventsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const eventData = { id: doc.id, ...doc.data() } as Event;

            // Fetch tickets count for this event
            const ticketsQuery = query(
              collection(db as any, "tickets"),
              where("eventId", "==", doc.id),
              where("status", "==", "available")
            );
            const ticketsSnapshot = await getDocs(ticketsQuery);
            eventData.ticketsCount = ticketsSnapshot.size;

            return eventData;
          })
        );
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): string | null => {
    if (!formData.artist.trim()) return "נא למלא שם האירוע";
    if (!formData.date.trim()) return "נא למלא תאריך";
    if (!formData.time.trim()) return "נא למלא שעה";
    if (!formData.venue.trim()) return "נא למלא מיקום";
    // Image is now optional - will use default if not provided

    // Validate date format (dd/mm/yyyy or dd.mm.yyyy)
    const dateRegex = /^\d{2}[\/\.]\d{2}[\/\.]\d{4}$/;
    if (!dateRegex.test(formData.date)) {
      return "פורמט תאריך לא תקין (יש להזין: dd/mm/yyyy או dd.mm.yyyy)";
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(formData.time)) {
      return "פורמט שעה לא תקין (יש להזין: HH:MM)";
    }

    return null;
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    const res = await fetch("/api/upload-event-image", {
      method: "POST",
      body: uploadFormData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Image upload failed");
    }
    const { imageUrl } = await res.json();
    return imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Get image URL: upload to Firebase Storage or use default category image
      let imageUrl: string;
      if (formData.imageFile) {
        imageUrl = await uploadImageToStorage(formData.imageFile);
      } else {
        // Use default category image
        imageUrl = await getDefaultCategoryImage(formData.category);
      }

      // Normalize date to use / separator
      const normalizedDate = formData.date.trim().replace(/\./g, "/");

      // Create event document
      const eventData = {
        artist: formData.artist.trim(),
        title: formData.artist.trim(), // Set title same as artist for backwards compatibility
        category: formData.category,
        date: normalizedDate,
        time: formData.time.trim(),
        venue: formData.venue.trim(),
        imageUrl: imageUrl,
        status: "active",
        views: 0,
        createdAt: serverTimestamp(),
      };

      const newEventRef = await addDoc(
        collection(db as any, "events"),
        eventData
      );

      // Add to local state
      setEvents((prev) => [
        {
          id: newEventRef.id,
          ...eventData,
          createdAt: new Date(),
        } as Event,
        ...prev,
      ]);

      setMessage({ type: "success", text: " האירוע נוצר בהצלחה!" });

      // Reset form
      setFormData({
        artist: "",
        category: "מוזיקה",
        date: "",
        time: "",
        venue: "",
        imageFile: null,
        imagePreview: "",
      });

      // Clear file input
      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error creating event:", error);
      setMessage({
        type: "error",
        text: "שגיאה ביצירת האירוע. נא לנסות שוב.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    setBulkLoading(true);
    setBulkMessage(null);

    try {
      // Parse JSON
      let eventsArray;
      try {
        eventsArray = JSON.parse(bulkJson);
      } catch (error) {
        setBulkMessage({
          type: "error",
          text: "JSON לא תקין. נא לבדוק את הפורמט.",
        });
        setBulkLoading(false);
        return;
      }

      // Ensure it's an array
      if (!Array.isArray(eventsArray)) {
        eventsArray = [eventsArray];
      }

      if (eventsArray.length === 0) {
        setBulkMessage({ type: "error", text: "לא נמצאו אירועים ב-JSON" });
        setBulkLoading(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each event
      for (let i = 0; i < eventsArray.length; i++) {
        const eventJson = eventsArray[i];

        try {
          // Validate required fields
          if (!eventJson.name || !eventJson.name.trim()) {
            errors.push(`אירוע ${i + 1}: חסר שם אירוע`);
            errorCount++;
            continue;
          }
          if (!eventJson.date || !eventJson.date.trim()) {
            errors.push(`אירוע ${i + 1} (${eventJson.name}): חסר תאריך`);
            errorCount++;
            continue;
          }
          if (!eventJson.time || !eventJson.time.trim()) {
            errors.push(`אירוע ${i + 1} (${eventJson.name}): חסרה שעה`);
            errorCount++;
            continue;
          }
          if (!eventJson.location || !eventJson.location.trim()) {
            errors.push(`אירוע ${i + 1} (${eventJson.name}): חסר מיקום`);
            errorCount++;
            continue;
          }

          // Normalize date format
          const normalizedDate = eventJson.date.trim().replace(/\./g, "/");

          // Validate date format
          const dateRegex = /^\d{2}[\/\.]\d{2}[\/\.]\d{4}$/;
          if (!dateRegex.test(normalizedDate)) {
            errors.push(
              `אירוע ${i + 1} (${eventJson.name}): פורמט תאריך לא תקין`
            );
            errorCount++;
            continue;
          }

          // Validate time format
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(eventJson.time.trim())) {
            errors.push(
              `אירוע ${i + 1} (${eventJson.name}): פורמט שעה לא תקין`
            );
            errorCount++;
            continue;
          }

          // Get category (default to מוזיקה if not provided)
          const category = eventJson.category || "מוזיקה";

          // Get default image for category
          const imageUrl = await getDefaultCategoryImage(category);

          // Create event document
          const eventData = {
            artist: eventJson.name.trim(),
            title: eventJson.name.trim(),
            category: category,
            date: normalizedDate,
            time: eventJson.time.trim(),
            venue: eventJson.location.trim(),
            imageUrl: imageUrl,
            status: "active",
            views: 0,
            createdAt: serverTimestamp(),
          };

          const newEventRef = await addDoc(
            collection(db as any, "events"),
            eventData
          );

          // Add to local state
          setEvents((prev) => [
            {
              id: newEventRef.id,
              ...eventData,
              createdAt: new Date(),
            } as Event,
            ...prev,
          ]);

          successCount++;
        } catch (error) {
          console.error(`Error creating event ${i + 1}:`, error);
          errors.push(
            `אירוע ${i + 1} (${eventJson.name || "ללא שם"}): שגיאה ביצירה`
          );
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        setBulkMessage({
          type: "success",
          text: ` ${successCount} אירועים נוצרו בהצלחה!`,
        });
        setBulkJson(""); // Clear the textarea
      } else if (successCount > 0 && errorCount > 0) {
        setBulkMessage({
          type: "error",
          text: ` ${successCount} אירועים נוצרו, ${errorCount} נכשלו:\n${errors.join(
            "\n"
          )}`,
        });
      } else {
        setBulkMessage({
          type: "error",
          text: ` כל האירועים נכשלו:\n${errors.join("\n")}`,
        });
      }
    } catch (error) {
      console.error("Error in bulk import:", error);
      setBulkMessage({
        type: "error",
        text: "שגיאה כללית ביבוא אירועים. נא לנסות שוב.",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-heading-2-desktop md:text-heading-1-desktop font-bold text-primary mb-2">
              ניהול אירועים
            </h1>
            <p className="text-text-large text-mutedText">
              צור אירוע חדש במערכת
            </p>
            {/* Link to manage default images */}
            <div className="mt-4 flex gap-3 justify-center flex-wrap">
              <a
                href="/manage-default-images"
                className="inline-block px-6 py-2 bg-secondary text-primary rounded-lg hover:bg-highlight hover:text-white transition-colors font-semibold"
              >
                ניהול תמונות ברירת מחדל
              </a>
              <a
                href="/manage-themes"
                className="inline-block px-6 py-2 bg-secondary text-primary rounded-lg hover:bg-highlight hover:text-white transition-colors font-semibold"
              >
                ניהול צבעי קטגוריות
              </a>
              <a
                href="/Admin/pnl-calculator"
                className="inline-block px-6 py-2 bg-secondary text-primary rounded-lg hover:bg-highlight hover:text-white transition-colors font-semibold"
              >
                מחשבון P&L
              </a>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-large p-8 border border-secondary">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <label
                  htmlFor="artist"
                  className="block text-right text-text-medium font-semibold text-strongText mb-2"
                >
                  שם האירוע *
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  value={formData.artist}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right"
                  placeholder="לדוגמה: עומר אדם, מכבי תל אביב נגד הפועל"
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-right text-text-medium font-semibold text-strongText mb-2"
                >
                  קטגוריה *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right bg-white"
                  disabled={loading}
                >
                  <option value="מוזיקה">מוזיקה</option>
                  <option value="תיאטרון">תיאטרון</option>
                  <option value="סטנדאפ">סטנדאפ</option>
                  <option value="ילדים">ילדים</option>
                  <option value="ספורט">ספורט</option>
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="time"
                    className="block text-right text-text-medium font-semibold text-strongText mb-2"
                  >
                    שעה *
                  </label>
                  <input
                    type="text"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right"
                    placeholder="20:00"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="date"
                    className="block text-right text-text-medium font-semibold text-strongText mb-2"
                  >
                    תאריך *
                  </label>
                  <input
                    type="text"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right"
                    placeholder="25/12/2025"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label
                  htmlFor="venue"
                  className="block text-right text-text-medium font-semibold text-strongText mb-2"
                >
                  מיקום *
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right"
                  placeholder="לדוגמה: פארק הירקון, תל אביב"
                  disabled={loading}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label
                  htmlFor="image-upload"
                  className="block text-right text-text-medium font-semibold text-strongText mb-2"
                >
                  תמונת האירוע (אופציונלי)
                </label>
                <p className="text-sm text-gray-600 mb-2 text-right">
                  אם לא תועלה תמונה, תשתמש תמונת ברירת מחדל של הקטגוריה
                </p>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-primary hover:file:bg-highlight hover:file:text-white"
                  disabled={loading}
                />

                {/* Image Preview */}
                {formData.imagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          imageFile: null,
                          imagePreview: "",
                        }));
                        const fileInput = document.getElementById(
                          "image-upload"
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      disabled={loading}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg text-right ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-bold text-white text-text-large transition-all transform hover:scale-105 shadow-large ${
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
                    יוצר אירוע...
                  </span>
                ) : (
                  "צור אירוע חדש"
                )}
              </button>
            </form>
          </div>

          {/* Bulk Import Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-large p-8 border border-secondary">
            <h2 className="text-heading-3-desktop font-bold text-primary mb-4 text-right">
              יבוא מרובה של אירועים (JSON)
            </h2>
            <p className="text-text-medium text-mutedText mb-6 text-right">
              הדבק JSON עם מערך אירועים ליצירה מרובה
            </p>

            {/* JSON Input */}
            <div className="mb-6">
              <label
                htmlFor="bulkJson"
                className="block text-right text-text-medium font-semibold text-strongText mb-2"
              >
                JSON של אירועים
              </label>
              <textarea
                id="bulkJson"
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-right font-mono text-sm"
                rows={12}
                placeholder={`[
  {
    "name": "עומר אדם",
    "category": "מוזיקה",
    "time": "21:30",
    "date": "05/11/2025",
    "location": "היכל מנורה, תל אביב"
  },
  {
    "name": "נועה קירל",
    "category": "מוזיקה",
    "time": "20:00",
    "date": "12.11.2025",
    "location": "Live Park, ראשון לציון"
  }
]`}
                disabled={bulkLoading}
              />
            </div>

            {/* Bulk Message */}
            {bulkMessage && (
              <div
                className={`p-4 rounded-lg text-right mb-6 whitespace-pre-line ${
                  bulkMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {bulkMessage.text}
              </div>
            )}

            {/* Bulk Import Button */}
            <button
              onClick={handleBulkImport}
              disabled={bulkLoading || !bulkJson.trim()}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-text-large transition-all transform hover:scale-105 shadow-large ${
                bulkLoading || !bulkJson.trim()
                  ? "bg-weakText cursor-not-allowed"
                  : "bg-highlight hover:bg-primary"
              }`}
            >
              {bulkLoading ? (
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
                  מייבא אירועים...
                </span>
              ) : (
                "יבא אירועים"
              )}
            </button>

            {/* Format Help */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-right">
              <h4 className="font-bold text-blue-800 text-text-medium mb-2">
                פורמט JSON נדרש:
              </h4>
              <ul className="space-y-1 text-blue-700 text-text-small">
                <li>
                  • <code className="bg-blue-100 px-1 rounded">name</code> - שם
                  האירוע (חובה)
                </li>
                <li>
                  • <code className="bg-blue-100 px-1 rounded">category</code> -
                  קטגוריה (אופציונלי, ברירת מחדל: מוזיקה)
                </li>
                <li>
                  • <code className="bg-blue-100 px-1 rounded">time</code> - שעה
                  בפורמט HH:MM (חובה)
                </li>
                <li>
                  • <code className="bg-blue-100 px-1 rounded">date</code> -
                  תאריך בפורמט dd/mm/yyyy או dd.mm.yyyy (חובה)
                </li>
                <li>
                  • <code className="bg-blue-100 px-1 rounded">location</code> -
                  מיקום האירוע (חובה)
                </li>
              </ul>
              <p className="text-blue-600 text-text-small mt-2">
                הקטגוריות הזמינות: מוזיקה, תיאטרון, סטנדאפ, ילדים, ספורט
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-secondary border border-primary rounded-lg p-6 text-right">
            <h3 className="font-bold text-primary text-text-large mb-3">
              הוראות שימוש
            </h3>
            <ul className="space-y-2 text-strongText text-text-medium">
              <li>• מלא את כל השדות המסומנים בכוכבית (*)</li>
              <li>
                • תאריך בפורמט: dd/mm/yyyy או dd.mm.yyyy (לדוגמה: 25/12/2025 או
                25.12.2025)
              </li>
              <li>• שעה בפורמט: HH:MM (לדוגמה: 20:00)</li>
              <li>• העלה תמונה איכותית לאירוע (JPG, PNG, WEBP)</li>
              <li>
                • לאחר יצירת האירוע, ניתן להוסיף כרטיסים דרך "העלאת כרטיס"
              </li>
            </ul>
          </div>

          {/* Existing Events List */}
          <div className="mt-12">
            <h2 className="text-heading-3-desktop font-bold text-primary mb-6 text-right">
              אירועים קיימים
            </h2>

            {loadingEvents ? (
              <div className="flex justify-center items-center py-12">
                <svg
                  className="animate-spin h-10 w-10 text-primary"
                  viewBox="0 0 24 24"
                >
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
              </div>
            ) : events.length === 0 ? (
              <div className="bg-secondary rounded-lg p-8 text-center text-mutedText text-text-large">
                אין אירועים במערכת. צור את האירוע הראשון שלך! �
              </div>
            ) : (
              <div className="grid gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-large border border-secondary overflow-hidden hover:shadow-xlarge transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-48 h-48 bg-secondary relative flex-shrink-0">
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-right flex-1">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <h3 className="text-heading-4-desktop font-bold text-primary">
                                {event.artist}
                              </h3>
                              {event.ticketsCount === 0 && (
                                <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-text-small font-semibold">
                                  אין כרטיסים
                                </span>
                              )}
                            </div>
                            {event.category && (
                              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-text-small font-semibold mb-2">
                                {event.category}
                              </span>
                            )}
                            <div className="flex gap-4 text-text-small text-mutedText flex-wrap justify-end mt-2">
                              <span> {event.date}</span>
                              <span> {event.time}</span>
                              <span> {event.venue}</span>
                              <span>👁️ {event.views || 0} צפיות</span>
                              {event.ticketsCount !== undefined && (
                                <span
                                  className={
                                    event.ticketsCount > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {event.ticketsCount} כרטיסים
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <span
                              className={`px-3 py-1 rounded-full text-text-extra-small font-semibold ${
                                event.status === "active"
                                  ? "bg-secondary text-primary border border-primary"
                                  : "bg-weakText text-white"
                              }`}
                            >
                              {event.status === "active" ? " פעיל" : " לא פעיל"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
