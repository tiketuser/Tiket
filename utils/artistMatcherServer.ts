/**
 * Artist name matching utilities (SERVER-ONLY)
 * Handles loading artist aliases from Firestore using Firebase Admin SDK
 * 
 * DO NOT import this file in client components.
 * For client-safe matching functions, use artistMatcher.ts instead.
 */
import "server-only";

import { adminDb } from "@/lib/firebaseAdmin";
import { ARTIST_ALIASES, DEFAULT_ARTIST_ALIASES, setFirestoreAliases } from "./artistMatcher";

// Cache for Firestore aliases with thread-safety
let firestoreAliasesLoaded = false;
let firestoreAliasesCache: { [key: string]: string[] } | null = null;
let firestoreLoadPromise: Promise<void> | null = null;

/**
 * Load artist aliases from Firestore (server-side only)
 * This should be called on server-side to populate dynamic aliases
 * Uses promise-based locking to prevent concurrent loads
 */
export async function loadArtistAliasesFromFirestore(): Promise<void> {
  // Return cached if already loaded
  if (firestoreAliasesLoaded && firestoreAliasesCache) {
    setFirestoreAliases(firestoreAliasesCache);
    return;
  }

  // If a load is already in progress, wait for it
  if (firestoreLoadPromise) {
    return firestoreLoadPromise;
  }

  // Start new load and store the promise
  firestoreLoadPromise = (async () => {
    try {
      if (!adminDb) {
        console.warn('Firestore not available, using default aliases only');
        return;
      }

      const aliasesSnapshot = await adminDb.collection('artist_aliases').get();
      const firestoreAliases: { [key: string]: string[] } = {};

      aliasesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.canonical && data.variations) {
          firestoreAliases[data.canonical] = data.variations;
        }
      });

      // Merge with defaults (Firestore takes precedence)
      firestoreAliasesCache = firestoreAliases;
      setFirestoreAliases(firestoreAliases);
      firestoreAliasesLoaded = true;

      console.log(`✅ Loaded ${Object.keys(firestoreAliases).length} artist aliases from Firestore`);
    } catch (error) {
      console.error('Error loading artist aliases from Firestore:', error);
      // Continue with default aliases on error
    } finally {
      // Clear the promise after completion
      firestoreLoadPromise = null;
    }
  })();

  return firestoreLoadPromise;
}
