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
  deleteDoc,
  doc,
  where,
  updateDoc,
} from "firebase/firestore";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";

interface ConcertFormData {
  artist: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  imageFile: File | null;
  imagePreview: string;
}

interface Concert {
  id: string;
  artist: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  imageData: string;
  status: string;
  views: number;
  createdAt: any;
}

export default function AdminPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loadingConcerts, setLoadingConcerts] = useState(true);
  const [formData, setFormData] = useState<ConcertFormData>({
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

  // Fetch existing concerts
  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const concertsQuery = query(
          collection(db as any, "concerts"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(concertsQuery);
        const concertsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Concert[];
        setConcerts(concertsData);
      } catch (error) {
        console.error("Error fetching concerts:", error);
      } finally {
        setLoadingConcerts(false);
      }
    };

    fetchConcerts();
  }, []);

  const handleDeleteConcert = async (concertId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הקונצרט?")) return;

    try {
      await deleteDoc(doc(db as any, "concerts", concertId));
      setConcerts((prev) => prev.filter((c) => c.id !== concertId));
      setMessage({ type: "success", text: "✅ הקונצרט נמחק בהצלחה" });
    } catch (error) {
      console.error("Error deleting concert:", error);
      setMessage({ type: "error", text: "שגיאה במחיקת הקונצרט" });
    }
  };

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
    if (!formData.imageFile) return "נא להעלות תמונה";

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

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
      // Convert image to base64
      const imageData = await convertImageToBase64(formData.imageFile!);

      // Normalize date to use / separator
      const normalizedDate = formData.date.trim().replace(/\./g, "/");

      // Create event document
      const concertData = {
        artist: formData.artist.trim(),
        title: formData.artist.trim(), // Set title same as artist for backwards compatibility
        category: formData.category,
        date: normalizedDate,
        time: formData.time.trim(),
        venue: formData.venue.trim(),
        imageData: imageData,
        status: "active",
        views: 0,
        createdAt: serverTimestamp(),
      };

      const newConcertRef = await addDoc(
        collection(db as any, "concerts"),
        concertData
      );

      // Add to local state
      setConcerts((prev) => [
        {
          id: newConcertRef.id,
          ...concertData,
          createdAt: new Date(),
        } as Concert,
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
      console.error("Error creating concert:", error);
      setMessage({
        type: "error",
        text: "שגיאה ביצירת הקונצרט. נא לנסות שוב.",
      });
    } finally {
      setLoading(false);
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
                  תמונת האירוע *
                </label>
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
              📋 אירועים קיימים
            </h2>

            {loadingConcerts ? (
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
            ) : concerts.length === 0 ? (
              <div className="bg-secondary rounded-lg p-8 text-center text-mutedText text-text-large">
                אין אירועים במערכת. צור את האירוע הראשון שלך! �
              </div>
            ) : (
              <div className="grid gap-6">
                {concerts.map((concert) => (
                  <div
                    key={concert.id}
                    className="bg-white rounded-xl shadow-large border border-secondary overflow-hidden hover:shadow-xlarge transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-48 h-48 bg-secondary relative flex-shrink-0">
                        {concert.imageData && (
                          <img
                            src={concert.imageData}
                            alt={concert.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-right flex-1">
                            <h3 className="text-heading-4-desktop font-bold text-primary mb-1">
                              {concert.artist}
                            </h3>
                            {concert.category && (
                              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-text-small font-semibold mb-2">
                                {concert.category}
                              </span>
                            )}
                            <div className="flex gap-4 text-text-small text-mutedText flex-wrap justify-end mt-2">
                              <span>📅 {concert.date}</span>
                              <span>🕐 {concert.time}</span>
                              <span>📍 {concert.venue}</span>
                              <span>👁️ {concert.views || 0} צפיות</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mr-4">
                            <button
                              onClick={() => handleDeleteConcert(concert.id)}
                              className="p-2 bg-secondary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                              title="מחק אירוע"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <span
                            className={`px-3 py-1 rounded-full text-text-extra-small font-semibold ${
                              concert.status === "active"
                                ? "bg-secondary text-primary border border-primary"
                                : "bg-weakText text-white"
                            }`}
                          >
                            {concert.status === "active"
                              ? "✅ פעיל"
                              : "⏸️ לא פעיל"}
                          </span>
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
