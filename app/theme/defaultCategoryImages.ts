/**
 * Default category images configuration
 * These images are used when no custom image is uploaded for an event
 */

export interface DefaultCategoryImage {
  category: string;
  imageData: string; // Base64 or URL
  updatedAt?: Date;
}

// Default placeholder images for each category
// These will be stored in Firestore and can be updated by admins
export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  מוזיקה: "", // Will be loaded from Firestore or use fallback
  תיאטרון: "",
  סטנדאפ: "",
  ילדים: "",
  ספורט: "",
};

// Helper function to encode Unicode strings to base64
const encodeBase64 = (str: string): string => {
  // Convert Unicode string to UTF-8 byte array, then to base64
  const utf8Bytes = new TextEncoder().encode(str);
  let binaryString = '';
  utf8Bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });
  return btoa(binaryString);
};

// Fallback SVG placeholder if no image is set
export const FALLBACK_IMAGE_SVG = (category: string) => {
  const colors: Record<string, { primary: string; secondary: string }> = {
    מוזיקה: { primary: "#B54653", secondary: "#EAC4C7" },
    תיאטרון: { primary: "#6F4B3E", secondary: "#D9C7BB" },
    סטנדאפ: { primary: "#355C88", secondary: "#CEDBF2" },
    ילדים: { primary: "#B18FCF", secondary: "#E1DAF5" },
    ספורט: { primary: "#4B9762", secondary: "#C7E3CF" },
  };

  const color = colors[category] || colors["מוזיקה"];

  const svgContent = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="${color.secondary}"/>
      <rect x="150" y="100" width="100" height="100" rx="10" fill="${color.primary}"/>
      <text x="200" y="230" font-family="Arial" font-size="20" fill="${color.primary}" text-anchor="middle">${category}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${encodeBase64(svgContent)}`;
};

/**
 * Get default image for a category
 * First checks Firestore, then falls back to SVG placeholder
 */
export const getDefaultCategoryImage = async (
  category: string
): Promise<string> => {
  try {
    // Try to get from Firestore
    const { db, collection, getDocs, query, where } = await import(
      "../../firebase"
    );

    if (!db) {
      return FALLBACK_IMAGE_SVG(category);
    }

    const defaultImagesQuery = query(
      collection(db as any, "defaultCategoryImages"),
      where("category", "==", category)
    );

    const snapshot = await getDocs(defaultImagesQuery);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data() as DefaultCategoryImage;
      return data.imageData || FALLBACK_IMAGE_SVG(category);
    }

    return FALLBACK_IMAGE_SVG(category);
  } catch (error) {
    console.error("Error fetching default category image:", error);
    return FALLBACK_IMAGE_SVG(category);
  }
};

/**
 * Update default image for a category in Firestore
 */
export const updateDefaultCategoryImage = async (
  category: string,
  imageData: string
): Promise<void> => {
  const {
    db,
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    addDoc,
    doc,
  } = await import("../../firebase");
  
  const { serverTimestamp } = await import("firebase/firestore");

  if (!db) {
    throw new Error("Firebase not initialized");
  }

  const defaultImagesQuery = query(
    collection(db as any, "defaultCategoryImages"),
    where("category", "==", category)
  );

  const snapshot = await getDocs(defaultImagesQuery);

  if (!snapshot.empty) {
    // Update existing
    const docRef = doc(db as any, "defaultCategoryImages", snapshot.docs[0].id);
    await updateDoc(docRef, {
      imageData,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new
    await addDoc(collection(db as any, "defaultCategoryImages"), {
      category,
      imageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};
