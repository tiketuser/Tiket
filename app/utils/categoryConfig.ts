export type CategoryName = "מוזיקה" | "תיאטרון" | "סטנדאפ" | "ילדים" | "ספורט";

export interface CategorySeatConfig {
  showSection: boolean;
  showBlock: boolean;
  showRow: boolean;
  allowStanding: boolean;
  sectionLabel: string;
  sectionPlaceholder: string;
  sectionFormatPrefix: string;
}

export const CATEGORY_SEAT_CONFIG: Record<CategoryName, CategorySeatConfig> = {
  "ספורט": {
    showSection: true,
    showBlock: true,
    showRow: true,
    allowStanding: true,
    sectionLabel: "יציע / גזרה",
    sectionPlaceholder: "יציע מזרח, 301",
    sectionFormatPrefix: "",
  },
  "מוזיקה": {
    showSection: true,
    showBlock: false,
    showRow: true,
    allowStanding: true,
    sectionLabel: "אזור",
    sectionPlaceholder: "Floor, VIP, אזור B",
    sectionFormatPrefix: "אזור",
  },
  "תיאטרון": {
    showSection: true,
    showBlock: false,
    showRow: true,
    allowStanding: false,
    sectionLabel: "אולם / קומה",
    sectionPlaceholder: "קומה ראשונה, גלריה",
    sectionFormatPrefix: "",
  },
  "סטנדאפ": {
    showSection: false,
    showBlock: false,
    showRow: true,
    allowStanding: false,
    sectionLabel: "",
    sectionPlaceholder: "",
    sectionFormatPrefix: "",
  },
  "ילדים": {
    showSection: true,
    showBlock: false,
    showRow: true,
    allowStanding: false,
    sectionLabel: "אולם / קומה",
    sectionPlaceholder: "קומה ראשונה, אולם ראשי",
    sectionFormatPrefix: "",
  },
};

export function getCategoryConfig(category: string): CategorySeatConfig {
  return CATEGORY_SEAT_CONFIG[category as CategoryName] ?? CATEGORY_SEAT_CONFIG["מוזיקה"];
}

export function formatSeatLocation(params: {
  category?: string | null;
  section?: string | number | null;
  block?: string | number | null;
  row?: string | number | null;
  seat?: string | number | null;
  isStanding?: boolean;
}): string {
  const { category, section, block, row, seat, isStanding } = params;

  if (isStanding) {
    const sec = section ? String(section).trim() : "";
    return sec ? `עמידה | ${sec}` : "עמידה";
  }

  const config = getCategoryConfig(category ?? "מוזיקה");
  const parts: string[] = [];

  if (config.showSection && section && String(section).trim()) {
    const sec = String(section).trim();
    parts.push(config.sectionFormatPrefix ? `${config.sectionFormatPrefix} ${sec}` : sec);
  }
  if (config.showBlock && block && String(block).trim()) {
    parts.push(`גוש ${String(block).trim()}`);
  }
  if (config.showRow && row && String(row).trim()) {
    parts.push(`שורה ${String(row).trim()}`);
  }
  if (seat && String(seat).trim()) {
    parts.push(`מושב ${String(seat).trim()}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "מיקום לא צוין";
}
