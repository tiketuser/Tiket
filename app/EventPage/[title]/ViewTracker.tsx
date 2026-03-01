"use client";

import { useEffect } from "react";
import { doc, updateDoc, increment, setDoc, arrayRemove, arrayUnion, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../firebase";

const MAX_RECENTLY_VIEWED = 20;

export function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    if (!db) return;

    // Increment global view count
    const eventRef = doc(db as any, "events", eventId);
    updateDoc(eventRef, { views: increment(1) }).catch(() => {});

    // Save to user's recently viewed (auth optional — only for logged-in users)
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const userRef = doc(db as any, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const existing: string[] = userSnap.exists()
          ? userSnap.data().recentlyViewed ?? []
          : [];

        // Remove if already present (to re-insert at front), then cap at max
        const updated = [eventId, ...existing.filter((id) => id !== eventId)].slice(
          0,
          MAX_RECENTLY_VIEWED,
        );

        await setDoc(userRef, { recentlyViewed: updated }, { merge: true });
      } catch {
        // Non-critical — silently ignore
      }
    });

    return () => unsubscribe();
  }, [eventId]);

  return null;
}
