"use client";

import { useEffect } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../../firebase";

export function ViewTracker({ concertId }: { concertId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return; // Only run on client

    const incrementView = async () => {
      if (!db) {
        console.warn("Firebase not initialized");
        return;
      }

      try {
        const concertRef = doc(db, "concerts", concertId);
        await updateDoc(concertRef, { views: increment(1) });
      } catch (error) {
        console.error("Error incrementing view:", error);
      }
    };

    incrementView();
  }, [concertId]);

  return null;
}
