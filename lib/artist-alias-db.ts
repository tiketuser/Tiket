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

export interface DbResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: "NOT_FOUND" | "ALREADY_EXISTS" | "UNAVAILABLE" | "UNKNOWN";
  };
}

/**
 * Add a new artist alias to Firestore
 */
export async function addArtistAliasToFirestore(
  canonical: string,
  variations: string[]
): Promise<DbResult> {
  try {
    const db = getAdminDb();
    if (!db) {
      return {
        success: false,
        error: {
          message: "Firestore not available",
          code: "UNAVAILABLE",
        },
      };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();

    // Check if alias already exists
    const docRef = db.collection("artist_aliases").doc(normalizedCanonical);
    const doc = await docRef.get();

    if (doc.exists) {
      return {
        success: false,
        error: {
          message: `Alias for "${normalizedCanonical}" already exists`,
          code: "ALREADY_EXISTS",
        },
      };
    }

    // Create the new alias
    const aliasData: ArtistAlias = {
      canonical: normalizedCanonical,
      variations: Array.from(new Set(variations)), // Remove duplicates efficiently
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(aliasData);

    return { success: true };
  } catch (error) {
    console.error("Error adding artist alias:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "UNKNOWN",
      },
    };
  }
}

/**
 * Get all artist aliases from Firestore
 */
export async function getAllArtistAliases(): Promise<
  DbResult<Record<string, string[]>>
> {
  try {
    const db = getAdminDb();
    if (!db) {
      return {
        success: false,
        error: {
          message: "Firestore not available",
          code: "UNAVAILABLE",
        },
      };
    }

    const snapshot = await db.collection("artist_aliases").get();

    const aliases: Record<string, string[]> = {};
    snapshot.forEach((doc) => {
      const data = doc.data() as ArtistAlias;
      aliases[data.canonical] = data.variations;
    });

    return { success: true, data: aliases };
  } catch (error) {
    console.error("Error getting artist aliases:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "UNKNOWN",
      },
    };
  }
}

/**
 * Update an existing artist alias
 */
export async function updateArtistAlias(
  canonical: string,
  variations: string[]
): Promise<DbResult> {
  try {
    const db = getAdminDb();
    if (!db) {
      return {
        success: false,
        error: {
          message: "Firestore not available",
          code: "UNAVAILABLE",
        },
      };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();
    const docRef = db.collection("artist_aliases").doc(normalizedCanonical);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: {
          message: `Alias for "${normalizedCanonical}" not found`,
          code: "NOT_FOUND",
        },
      };
    }

    await docRef.update({
      variations: Array.from(new Set(variations)), // Remove duplicates efficiently
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating artist alias:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "UNKNOWN",
      },
    };
  }
}

/**
 * Delete an artist alias
 */
export async function deleteArtistAlias(
  canonical: string
): Promise<DbResult> {
  try {
    const db = getAdminDb();
    if (!db) {
      return {
        success: false,
        error: {
          message: "Firestore not available",
          code: "UNAVAILABLE",
        },
      };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();
    await db.collection("artist_aliases").doc(normalizedCanonical).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting artist alias:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "UNKNOWN",
      },
    };
  }
}

/**
 * Get a specific artist alias
 */
export async function getArtistAlias(
  canonical: string
): Promise<DbResult<ArtistAlias>> {
  try {
    const db = getAdminDb();
    if (!db) {
      return {
        success: false,
        error: {
          message: "Firestore not available",
          code: "UNAVAILABLE",
        },
      };
    }

    const normalizedCanonical = canonical.toLowerCase().trim();
    const doc = await db
      .collection("artist_aliases")
      .doc(normalizedCanonical)
      .get();

    if (!doc.exists) {
      return {
        success: false,
        error: {
          message: `Alias for "${normalizedCanonical}" not found`,
          code: "NOT_FOUND",
        },
      };
    }

    return { success: true, data: doc.data() as ArtistAlias };
  } catch (error) {
    console.error("Error getting artist alias:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "UNKNOWN",
      },
    };
  }
}
