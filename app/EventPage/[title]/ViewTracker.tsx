"use client";

import { useEffect } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../../firebase";

export function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return; // Only run on client

    const incrementView = async () => {
      if (!db) {
        console.warn("Firebase not initialized");
        return;
      }

      try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, { views: increment(1) });
      } catch (error) {
        console.error("Error incrementing view:", error);
      }
    };

    incrementView();
  }, [eventId]);

  return null;
}
