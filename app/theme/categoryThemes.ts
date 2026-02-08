// Category-based color themes
// Each category has primary, secondary, and highlight colors

import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

export interface CategoryTheme {
  primary: string;
  secondary: string;
  highlight: string;
}

// Default themes (fallback if Firebase is not available)
export const defaultCategoryThemes: Record<string, CategoryTheme> = {
  // Music - original colors
  מוזיקה: {
    primary: "#B54653",
    secondary: "#EAC4C7",
    highlight: "#8C5A5F",
  },
  // Stand-up
  סטנדאפ: {
    primary: "#355C88",
    secondary: "#CEDBF2",
    highlight: "#20344B",
  },
  // Theater
  תיאטרון: {
    primary: "#6F4B3E",
    secondary: "#D9C7BB",
    highlight: "#3C2F28",
  },
  // Sport
  ספורט: {
    primary: "#4B9762",
    secondary: "#C7E3CF",
    highlight: "#306C46",
  },
  // Kids
  ילדים: {
    primary: "#B18FCF",
    secondary: "#E1DAF5",
    highlight: "#6D5198",
  },
};

// Active themes (loaded from Firebase or defaults)
let loadedThemes: Record<string, CategoryTheme> = { ...defaultCategoryThemes };

// Function to load themes from Firebase
export const loadThemesFromFirebase = async (): Promise<void> => {
  try {
    if (!db) {
      console.warn("Firebase not initialized, using default themes");
      return;
    }

    const themesDoc = await getDoc(doc(db as any, "settings", "categoryThemes"));
    
    if (themesDoc.exists()) {
      const data = themesDoc.data();
      if (data.themes) {
        loadedThemes = { ...data.themes };
        console.log("✅ Loaded custom themes from Firebase:", loadedThemes);
      }
    } else {
      console.log("No custom themes found, using defaults");
    }
  } catch (error) {
    console.error("Error loading themes from Firebase:", error);
    // Continue with default themes
  }
};

// Export for backwards compatibility
export const categoryThemes = loadedThemes;

// Default theme (music)
export const defaultTheme: CategoryTheme = defaultCategoryThemes["מוזיקה"];

// Function to apply theme to document
export const applyTheme = (category: string | null) => {
  const theme = category ? loadedThemes[category] || defaultTheme : defaultTheme;
  
  console.log(`Applying theme for category: ${category}`, theme);
  
  // Set CSS variables on the root element
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-highlight", theme.highlight);
};

// Function to get theme for a category
export const getTheme = (category: string | null): CategoryTheme => {
  return category ? loadedThemes[category] || defaultTheme : defaultTheme;
};
