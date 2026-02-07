/**
 * Server-side utilities for managing artist aliases in Firestore
 */

import { getAdminDb } from "./firebase-admin";

export interface ArtistAlias {
  canonical: string;
  variations: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Add a new artist alias to Firestore
 */
export async function addArtistAliasToFirestore(
  canonical: string,
  variations: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Firestore not available" };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();

    // Check if alias already exists
    const docRef = db.collection("artist_aliases").doc(normalizedCanonical);
    const doc = await docRef.get();

    if (doc.exists) {
      return {
        success: false,
        error: `Alias for "${normalizedCanonical}" already exists`,
      };
    }

    // Create the new alias
    const aliasData: ArtistAlias = {
      canonical: normalizedCanonical,
      variations: variations.filter(
        (v, i, arr) => arr.indexOf(v) === i // Remove duplicates
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(aliasData);

    return { success: true };
  } catch (error) {
    console.error("Error adding artist alias:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all artist aliases from Firestore
 */
export async function getAllArtistAliases(): Promise<{
  success: boolean;
  aliases?: Record<string, string[]>;
  error?: string;
}> {
  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Firestore not available" };
    }

    const snapshot = await db.collection("artist_aliases").get();

    const aliases: Record<string, string[]> = {};
    snapshot.forEach((doc) => {
      const data = doc.data() as ArtistAlias;
      aliases[data.canonical] = data.variations;
    });

    return { success: true, aliases };
  } catch (error) {
    console.error("Error getting artist aliases:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an existing artist alias
 */
export async function updateArtistAlias(
  canonical: string,
  variations: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Firestore not available" };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();
    const docRef = db.collection("artist_aliases").doc(normalizedCanonical);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: `Alias for "${normalizedCanonical}" not found`,
      };
    }

    await docRef.update({
      variations: variations.filter((v, i, arr) => arr.indexOf(v) === i),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating artist alias:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete an artist alias
 */
export async function deleteArtistAlias(
  canonical: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Firestore not available" };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();
    await db.collection("artist_aliases").doc(normalizedCanonical).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting artist alias:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a specific artist alias
 */
export async function getArtistAlias(
  canonical: string
): Promise<{ success: boolean; alias?: ArtistAlias; error?: string }> {
  try {
    const db = getAdminDb();
    if (!db) {
      return { success: false, error: "Firestore not available" };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();
    const doc = await db
      .collection("artist_aliases")
      .doc(normalizedCanonical)
      .get();

    if (!doc.exists) {
      return {
        success: false,
        error: `Alias for "${normalizedCanonical}" not found`,
      };
    }

    return { success: true, alias: doc.data() as ArtistAlias };
  } catch (error) {
    console.error("Error getting artist alias:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
