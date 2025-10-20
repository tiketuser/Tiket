/**
 * Artist name matching utilities
 * Handles Hebrew/English variations and fuzzy matching
 */

// Common artist name mappings (Hebrew ↔ English)
const ARTIST_ALIASES: { [key: string]: string[] } = {
  // Key is normalized name, values are all variations
  "omer adam": ["עומר אדם", "omer adam", "umeradam"],
  "static and ben el tavori": ["סטטיק ובן אל תבורי", "static and ben el", "static & ben el tavori", "סטטיק בן אל"],
  "netta barzilai": ["נטע ברזילי", "netta", "neta barzilai"],
  "eyal golan": ["אייל גולן", "eyal golan", "golan"],
  "sarit hadad": ["שרית חדד", "sarit hadad", "sarit"],
  "idan raichel": ["עידן רייכל", "idan raichel", "idan reichel"],
  "ivri lider": ["עברי לידר", "ivri lider"],
  "mashina": ["משינה", "mashina"],
  "kaveret": ["כוורת", "kaveret", "beehive"],
  "berry sakharof": ["ברי סחרוף", "berry sakharof", "berry saharof"],
  "ethnix": ["אתניקס", "ethnix"],
  "shlomo artzi": ["שלמה ארצי", "shlomo artzi"],
  "yehoram gaon": ["יהורם גאון", "yehoram gaon"],
  "rita": ["ריטה", "rita"],
  "david broza": ["דויד ברוזה", "david broza"],
  "avi bitter": ["אבי ביטר", "avi bitter", "avi biter"],
  "infected mushroom": ["infected mushroom", "אינפקטד מאשרום"],
  "subliminal": ["סאבלימינל", "subliminal"],
  "hatuna meucheret": ["חתונה מאוחרת", "hatuna meucheret"],
  "hadag nahash": ["הדג נחש", "hadag nahash", "the fish snake"],
  "dennis lloyd": ["דניס לויד","Dennis Lloyd"],
};

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // normalize spaces
    .replace(/[״׳]/g, "") // remove Hebrew quotes
    .replace(/['"]/g, "") // remove English quotes
    .replace(/\./g, "") // remove periods
    .replace(/,/g, ""); // remove commas
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is exact match)
 */
function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Check if two artist names match using aliases and fuzzy matching
 */
export function artistNamesMatch(name1: string, name2: string, threshold: number = 0.85): boolean {
  const norm1 = normalizeString(name1);
  const norm2 = normalizeString(name2);

  // Exact match
  if (norm1 === norm2) {
    console.log(`✅ Exact match: "${norm1}" === "${norm2}"`);
    return true;
  }

  // Check aliases
  for (const [canonical, aliases] of Object.entries(ARTIST_ALIASES)) {
    const normalizedAliases = aliases.map(normalizeString);
    
    const match1 = normalizedAliases.includes(norm1);
    const match2 = normalizedAliases.includes(norm2);
    
    if (match1 && match2) {
      console.log(`✅ Alias match: "${norm1}" and "${norm2}" both map to "${canonical}"`);
      return true;
    }
  }

  // Fuzzy matching for typos/variations
  const similarity = similarityScore(norm1, norm2);
  if (similarity >= threshold) {
    console.log(`✅ Fuzzy match: "${norm1}" and "${norm2}" (similarity: ${similarity.toFixed(2)})`);
    return true;
  }

  console.log(`❌ No match: "${norm1}" vs "${norm2}" (similarity: ${similarity.toFixed(2)})`);
  return false;
}

/**
 * Get canonical artist name if exists in aliases
 */
export function getCanonicalArtistName(artistName: string): string {
  const normalized = normalizeString(artistName);
  
  for (const [canonical, aliases] of Object.entries(ARTIST_ALIASES)) {
    if (aliases.map(normalizeString).includes(normalized)) {
      return canonical;
    }
  }
  
  return normalized; // Return normalized version if no alias found
}

/**
 * Suggest matching artist from a list
 */
export function findBestArtistMatch(
  searchName: string,
  artistList: string[],
  threshold: number = 0.8
): { match: string | null; score: number } {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const artist of artistList) {
    if (artistNamesMatch(searchName, artist, threshold)) {
      const score = similarityScore(normalizeString(searchName), normalizeString(artist));
      if (score > bestScore) {
        bestScore = score;
        bestMatch = artist;
      }
    }
  }

  return { match: bestMatch, score: bestScore };
}

/**
 * Add artist alias dynamically (for admin to customize)
 */
export function addArtistAlias(canonical: string, alias: string): void {
  const canonicalNorm = normalizeString(canonical);
  
  if (!ARTIST_ALIASES[canonicalNorm]) {
    ARTIST_ALIASES[canonicalNorm] = [canonical];
  }
  
  if (!ARTIST_ALIASES[canonicalNorm].includes(alias)) {
    ARTIST_ALIASES[canonicalNorm].push(alias);
  }
}
