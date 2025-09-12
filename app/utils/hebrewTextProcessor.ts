/**
 * Advanced Hebrew text processing utilities for ticket extraction
 */

export interface HebrewProcessorResult {
  normalizedText: string;
  confidence: number;
  language: 'hebrew' | 'english' | 'mixed';
}

export class HebrewTextProcessor {
  private static readonly HEBREW_REGEX = /[\u0590-\u05FF]/;
  private static readonly ENGLISH_REGEX = /[a-zA-Z]/;
  private static readonly NUMBERS_REGEX = /\d/;

  /**
   * Normalize Hebrew text by removing niqqud, RTL markers, and cleaning OCR artifacts
   */
  static normalizeHebrew(text: string): HebrewProcessorResult {
    let normalized = text;
    let confidence = 1.0;

    // Remove RTL/LTR markers and formatting characters
    normalized = normalized.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
    
    // Remove niqqud (Hebrew vowel marks)
    normalized = normalized.replace(/[\u0591-\u05C7]/g, '');
    
    // Clean common OCR artifacts
    normalized = normalized.replace(/[`'"״׳]/g, '"');
    normalized = normalized.replace(/\s+/g, ' ');
    normalized = normalized.trim();

    // Detect language composition
    const hebrewChars = (normalized.match(this.HEBREW_REGEX) || []).length;
    const englishChars = (normalized.match(this.ENGLISH_REGEX) || []).length;
    const totalChars = hebrewChars + englishChars;

    let language: 'hebrew' | 'english' | 'mixed';
    if (hebrewChars > englishChars * 2) {
      language = 'hebrew';
    } else if (englishChars > hebrewChars * 2) {
      language = 'english';
    } else {
      language = 'mixed';
    }

    // Adjust confidence based on text quality indicators
    if (normalized.length < 3) confidence *= 0.3;
    if (normalized.includes('�') || normalized.includes('□')) confidence *= 0.5;
    
    return {
      normalizedText: normalized,
      confidence,
      language
    };
  }

  /**
   * Extract and normalize prices from Hebrew/English text
   */
  static extractPrices(text: string): Array<{
    price: number;
    currency: string;
    context: string;
    confidence: number;
    position: number;
  }> {
    const results = [];
    
    // Hebrew currency patterns with enhanced detection
    const hebrewPatterns = [
      /(?:מחיר|סכום|עלות|תשלום|כרטיס)[\s\w]*?[:=]?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:₪|שח|ש"ח|שקל)/gi,
      /(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:₪|שח|ש"ח|שקלים?)/gi,
      /₪\s*(\d{1,4}(?:[.,]\d{1,2})?)/gi
    ];

    // English currency patterns
    const englishPatterns = [
      /(?:Price|Total|Amount|Cost|Ticket)[\s\w]*?[:=]?\s*\$?(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:\$|USD|NIS|₪)/gi,
      /\$\s*(\d{1,4}(?:[.,]\d{1,2})?)/gi
    ];

    // Process Hebrew patterns
    hebrewPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1].replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (price > 0 && price < 10000) { // Reasonable price range
          const context = text.substring(Math.max(0, match.index - 30), match.index + 30);
          let confidence = 0.8;
          
          // Boost confidence for clear price indicators
          if (context.includes('מחיר') || context.includes('סכום')) confidence += 0.15;
          if (context.includes('₪')) confidence += 0.1;
          
          results.push({
            price,
            currency: '₪',
            context: context.trim(),
            confidence: Math.min(confidence, 1.0),
            position: match.index
          });
        }
      }
    });

    // Process English patterns
    englishPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1].replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (price > 0 && price < 10000) {
          const context = text.substring(Math.max(0, match.index - 30), match.index + 30);
          let confidence = 0.7;
          
          if (context.toLowerCase().includes('price') || context.toLowerCase().includes('total')) confidence += 0.15;
          
          results.push({
            price,
            currency: context.includes('₪') ? '₪' : '$',
            context: context.trim(),
            confidence: Math.min(confidence, 1.0),
            position: match.index
          });
        }
      }
    });

    // Sort by confidence and position
    return results.sort((a, b) => b.confidence - a.confidence || a.position - b.position);
  }

  /**
   * Extract dates from Hebrew/English text with intelligent parsing
   */
  static extractDates(text: string): Array<{
    date: string;
    format: string;
    confidence: number;
    context: string;
  }> {
    const results = [];
    
    const hebrewMonths = {
      'ינואר': '01', 'פברואר': '02', 'מרץ': '03', 'אפריל': '04',
      'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
      'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12'
    };

    // Hebrew date patterns
    const hebrewDatePatterns = [
      /(\d{1,2})\s*ב([א-ת]+)\s*(\d{4})/g,
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
    ];

    // English date patterns
    const englishDatePatterns = [
      /(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})/g,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{1,2}),?\s*(\d{4})/gi
    ];

    // Process patterns and extract dates
    [...hebrewDatePatterns, ...englishDatePatterns].forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const context = text.substring(Math.max(0, match.index - 20), match.index + 20);
        let confidence = 0.7;
        
        // Convert to standard format and validate
        let dateStr = '';
        try {
          if (match[0].includes('ב') && hebrewMonths[match[2]]) {
            // Hebrew month format
            dateStr = `${match[1].padStart(2, '0')}/${hebrewMonths[match[2]]}/${match[3]}`;
            confidence += 0.2;
          } else {
            // Numeric format
            dateStr = `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
          }

          const date = new Date(dateStr.split('/').reverse().join('-'));
          if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030) {
            results.push({
              date: dateStr,
              format: 'DD/MM/YYYY',
              confidence: Math.min(confidence, 1.0),
              context: context.trim()
            });
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract seating information from Hebrew/English text
   */
  static extractSeating(text: string): {
    row?: string;
    seat?: string;
    section?: string;
    gate?: string;
    confidence: number;
  } {
    const seating: any = {};
    let confidence = 0;

    // Hebrew seating patterns
    const hebrewPatterns = {
      row: /(?:שורה|Row)[:=\s]*([A-Za-z0-9]+)/gi,
      seat: /(?:מקום|מושב|Seat)[:=\s]*([A-Za-z0-9]+)/gi,
      section: /(?:יציע|גוש|סקטור|אזור|Section|Block)[:=\s]*([A-Za-z0-9]+)/gi,
      gate: /(?:שער|Gate)[:=\s]*([A-Za-z0-9]+)/gi
    };

    Object.entries(hebrewPatterns).forEach(([key, pattern]) => {
      const match = pattern.exec(text);
      if (match && match[1]) {
        seating[key] = match[1].trim();
        confidence += 0.25;
      }
    });

    return {
      ...seating,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Fuzzy match text against a list of known values
   */
  static fuzzyMatch(text: string, candidates: string[], threshold: number = 0.6): Array<{
    match: string;
    score: number;
    confidence: number;
  }> {
    const results = [];
    const normalizedText = this.normalizeHebrew(text).normalizedText.toLowerCase();

    candidates.forEach(candidate => {
      const normalizedCandidate = this.normalizeHebrew(candidate).normalizedText.toLowerCase();
      
      // Simple similarity score
      let score = 0;
      if (normalizedText.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedText)) {
        score = Math.max(normalizedText.length, normalizedCandidate.length) / 
                Math.min(normalizedText.length, normalizedCandidate.length);
        score = 1 / score; // Invert so higher is better
      } else {
        // Levenshtein-like scoring
        const maxLen = Math.max(normalizedText.length, normalizedCandidate.length);
        const distance = this.levenshteinDistance(normalizedText, normalizedCandidate);
        score = 1 - (distance / maxLen);
      }

      if (score >= threshold) {
        results.push({
          match: candidate,
          score,
          confidence: score * 0.8 // Adjust for fuzzy matching uncertainty
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }
}