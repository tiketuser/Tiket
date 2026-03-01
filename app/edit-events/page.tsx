"use client";

import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import AdminProtection from "../components/AdminProtection/AdminProtection";
import { db, storage } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

// Force dynamic rendering for admin pages
export const dynamic = "force-dynamic";

interface Concert {
  id: string;
  artist: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageData: string | null;
  status: string;
  views?: number;
}

export default function EditConcertsPage() {
  const [events, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [editForm, setEditForm] = useState<Concert | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadConcerts();
  }, []);

  const loadConcerts = async () => {
    if (!db) {
      alert("מסד הנתונים לא מחובר");
      return;
    }

    try {
      setLoading(true);
      const eventsQuery = query(
        collection(db, "events"),
        orderBy("date", "desc"),
      );
      const snapshot = await getDocs(eventsQuery);
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Concert[];
      setConcerts(eventsData);
    } catch (error) {
      console.error("Error loading events:", error);
      alert("שגיאה בטעינת אירועים");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Concert) => {
    setSelectedConcert(event);
    setEditForm({ ...event });
  };

  const handleCancel = () => {
    setSelectedConcert(null);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm || !selectedConcert) return;

    if (!db) {
      alert("מסד הנתונים לא מחובר");
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך לעדכן את האירוע ${editForm.artist}?`)) {
      return;
    }

    if (!db) {
      alert("Database not initialized");
      return;
    }

    try {
      setSaving(true);

      // Normalize date to use / separator
      const normalizedDate = editForm.date.replace(/\./g, "/");

      const eventRef = doc(db, "events", selectedConcert.id);
      await updateDoc(eventRef, {
        artist: editForm.artist,
        title: editForm.artist, // Set title same as artist for backwards compatibility
        date: normalizedDate,
        time: editForm.time,
        venue: editForm.venue,
        status: editForm.status,
        imageData: editForm.imageData,
      });

      // Update local state with normalized date
      const updatedForm = { ...editForm, date: normalizedDate };
      setConcerts(
        events.map((c) => (c.id === selectedConcert.id ? updatedForm : c)),
      );

      alert("האירוע עודכן בהצלחה!");
      handleCancel();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("שגיאה בעדכון האירוע");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string, artistName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את האירוע של ${artistName}?`)) {
      return;
    }

    if (!db) {
      alert("מסד הנתונים לא מחובר");
      return;
    }

    try {
      await deleteDoc(doc(db, "events", eventId));
      setConcerts(events.filter((c) => c.id !== eventId));
      alert("האירוע נמחק בהצלחה!");

      // If the deleted event was being edited, close the edit form
      if (selectedConcert?.id === eventId) {
        handleCancel();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("שגיאה במחיקת האירוע");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;

    if (!file.type.startsWith("image/")) {
      alert("אנא בחר קובץ תמונה");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("גודל התמונה חייב להיות פחות מ-5MB");
      return;
    }

    try {
      setUploadingImage(true);

      if (storage) {
        const ext = file.name.split(".").pop() || "jpg";
        const imageRef = ref(storage, `event-images/${editForm.id}.${ext}`);
        const snapshot = await uploadBytes(imageRef, file, {
          contentType: file.type,
        });
        const downloadUrl = await getDownloadURL(snapshot.ref);
        setEditForm({ ...editForm, imageData: downloadUrl });
      } else {
        // Fallback to base64 if storage is not available
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setEditForm({ ...editForm, imageData: base64String });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (!editForm) return;
    if (confirm("האם אתה בטוח שברצונך להסיר את התמונה?")) {
      setEditForm({ ...editForm, imageData: null });
    }
  };

  const filteredConcerts = events.filter((event) => {
    const matchesSearch =
      event.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminProtection>
      <NavBar />
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-heading-2-desktop font-bold text-primary mb-2">
              עריכת אירועים
            </h1>
            <p className="text-text-large text-mutedText">
              עדכון פרטי אירועים, תמונות וסטטוס
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-mutedText mt-4">טוען אירועים...</p>
            </div>
          ) : (
            <>
              {/* Search and Filter Bar */}
              <div className="bg-secondary border border-primary rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-strongText font-bold mb-2 text-right">
                      חיפוש
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="חפש לפי אמן או מקום..."
                      className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-strongText font-bold mb-2 text-right">
                      סינון לפי סטטוס
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                    >
                      <option value="all">הכל</option>
                      <option value="active">פעיל</option>
                      <option value="past">עבר</option>
                      <option value="cancelled">בוטל</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 text-center text-mutedText">
                  מציג {filteredConcerts.length} מתוך {events.length} אירועים
                </div>
              </div>

              {/* Concerts List */}
              {!selectedConcert ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConcerts.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white border border-secondary rounded-lg overflow-hidden shadow-large hover:shadow-xl transition-shadow"
                    >
                      {/* Concert Image */}
                      <div className="relative h-48 bg-secondary">
                        {event.imageData ? (
                          <Image
                            src={event.imageData}
                            alt={event.artist}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-6xl text-mutedText">♪</span>
                          </div>
                        )}
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-3 py-1 rounded-full text-white text-text-small font-bold ${
                              event.status === "active"
                                ? "bg-green-500"
                                : event.status === "past"
                                  ? "bg-gray-500"
                                  : "bg-red-500"
                            }`}
                          >
                            {event.status === "active"
                              ? "פעיל"
                              : event.status === "past"
                                ? "עבר"
                                : "בוטל"}
                          </span>
                        </div>
                      </div>

                      {/* Concert Info */}
                      <div className="p-4 text-right">
                        <h3 className="text-text-large font-bold text-primary mb-2">
                          {event.artist}
                        </h3>
                        <div className="space-y-1 text-text-medium text-strongText">
                          <p>{event.date}</p>
                          <p>{event.time}</p>
                          <p>{event.venue}</p>
                          {event.views !== undefined && (
                            <p>{event.views} צפיות</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEdit(event)}
                            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-highlight transition-colors font-bold"
                          >
                            ערוך אירוע
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(event.id, event.artist)
                            }
                            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-bold"
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
                    </div>
                  ))}

                  {filteredConcerts.length === 0 && (
                    <div className="col-span-full text-center py-20">
                      <p className="text-mutedText text-text-large">
                        לא נמצאו אירועים תואמים
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Form */
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white border border-secondary rounded-lg shadow-large p-8">
                    <div className="flex justify-between items-center mb-6">
                      <button
                        onClick={handleCancel}
                        className="text-mutedText hover:text-strongText"
                      >
                        ← חזרה
                      </button>
                      <h2 className="text-heading-3-desktop font-bold text-primary">
                        עריכת אירוע
                      </h2>
                    </div>

                    {editForm && (
                      <div className="space-y-6">
                        {/* Image Upload Section */}
                        <div>
                          <label className="block text-strongText font-bold mb-2 text-right">
                            תמונה
                          </label>
                          <div className="border-2 border-dashed border-secondary rounded-lg p-6">
                            {editForm.imageData ? (
                              <div className="space-y-4">
                                <div className="relative h-64 rounded-lg overflow-hidden">
                                  <Image
                                    src={editForm.imageData}
                                    alt={editForm.artist}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <label className="flex-1 cursor-pointer bg-secondary text-strongText py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-colors text-center font-bold">
                                    החלף תמונה
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="hidden"
                                      disabled={uploadingImage}
                                    />
                                  </label>
                                  <button
                                    onClick={handleRemoveImage}
                                    className="flex-1 bg-red-100 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors font-bold"
                                  >
                                    הסר תמונה
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="cursor-pointer block text-center">
                                <div className="py-8">
                                  <p className="text-mutedText mb-2">
                                    לחץ להעלאת תמונה
                                  </p>
                                  <p className="text-text-small text-weakText">
                                    גודל מקסימלי: 5MB
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  disabled={uploadingImage}
                                />
                              </label>
                            )}
                            {uploadingImage && (
                              <p className="text-center text-primary mt-2">
                                מעלה תמונה...
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Event Name */}
                        <div>
                          <label className="block text-strongText font-bold mb-2 text-right">
                            שם האירוע
                          </label>
                          <input
                            type="text"
                            value={editForm.artist}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                artist: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                            placeholder="שם האירוע"
                          />
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-strongText font-bold mb-2 text-right">
                              תאריך
                            </label>
                            <input
                              type="text"
                              value={editForm.date}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  date: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                              placeholder="DD/MM/YYYY או DD.MM.YYYY"
                            />
                          </div>
                          <div>
                            <label className="block text-strongText font-bold mb-2 text-right">
                              שעה
                            </label>
                            <input
                              type="text"
                              value={editForm.time}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  time: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                              placeholder="HH:MM"
                            />
                          </div>
                        </div>

                        {/* Venue */}
                        <div>
                          <label className="block text-strongText font-bold mb-2 text-right">
                            מיקום
                          </label>
                          <input
                            type="text"
                            value={editForm.venue}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                venue: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                            placeholder="מקום האירוע"
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-strongText font-bold mb-2 text-right">
                            סטטוס
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                status: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-secondary rounded-lg text-right focus:outline-none focus:border-primary"
                          >
                            <option value="active">פעיל</option>
                            <option value="past">עבר</option>
                            <option value="cancelled">בוטל</option>
                          </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                          <button
                            onClick={handleCancel}
                            className="flex-1 py-3 px-6 border border-secondary rounded-lg text-strongText hover:bg-secondary transition-colors font-bold"
                            disabled={saving}
                          >
                            ביטול
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex-1 py-3 px-6 rounded-lg text-white font-bold transition-all ${
                              saving
                                ? "bg-weakText cursor-not-allowed"
                                : "bg-primary hover:bg-highlight"
                            }`}
                          >
                            {saving ? "שומר..." : "שמור שינויים"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </AdminProtection>
  );
}
