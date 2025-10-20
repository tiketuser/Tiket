# 🎤 Artist Matching System

## Overview

The artist matching system provides intelligent Hebrew ↔ English artist name matching for ticket-to-concert linking. It handles variations in spelling, language, and formatting to ensure accurate concert matching even when artist names differ between the ticket and concert.

## Features

### 1. **Multi-Language Support**

- ✅ Hebrew names: "עומר אדם", "סטטיק ובן אל תבורי"
- ✅ English names: "Omer Adam", "Static and Ben El Tavori"
- ✅ Mixed variations: "Static & Ben El", "סטטיק בן אל"

### 2. **Normalization**

- Lowercase conversion
- Whitespace trimming and normalization
- Removal of punctuation (quotes, periods, commas)
- Hebrew quote marks (״׳) removal

### 3. **Artist Aliases**

Pre-defined mappings for common Israeli artists:

- עומר אדם ↔ Omer Adam
- סטטיק ובן אל תבורי ↔ Static and Ben El Tavori
- נטע ברזילי ↔ Netta Barzilai
- אייל גולן ↔ Eyal Golan
- שרית חדד ↔ Sarit Hadad
- עידן רייכל ↔ Idan Raichel
- משינה ↔ Mashina
- ברי סחרוף ↔ Berry Sakharof
- And many more...

### 4. **Fuzzy Matching**

- Levenshtein distance algorithm
- 85% similarity threshold (configurable)
- Handles typos and minor variations

### 5. **Smart Suggestions**

When no exact match is found, the system suggests potentially matching concerts based on artist similarity.

## Usage

### In Ticket Upload (UploadTicketDialog.tsx)

```typescript
import { artistNamesMatch } from "../../../../utils/artistMatcher";

// Compare ticket artist with concert artist
const artistMatch = artistNamesMatch(ticketArtist, concertArtist);
```

### In Approval Page (approve-tickets/page.tsx)

```typescript
import {
  findBestArtistMatch,
  artistNamesMatch,
} from "../../utils/artistMatcher";

// Get suggested concerts
const getSuggestedConcerts = (ticket: Ticket): Concert[] => {
  const artistList = concerts.map((c) => c.artist);
  const { match } = findBestArtistMatch(ticket.artist, artistList, 0.7);

  return concerts.filter((c) => artistNamesMatch(ticket.artist, c.artist, 0.7));
};
```

### Testing Matches (manage-artists page)

Navigate to `/manage-artists` to:

- Test if two artist names match
- See normalized versions
- Check similarity scores
- View all pre-configured aliases

## API Reference

### `artistNamesMatch(name1: string, name2: string, threshold?: number): boolean`

Check if two artist names match.

**Parameters:**

- `name1` - First artist name (Hebrew or English)
- `name2` - Second artist name (Hebrew or English)
- `threshold` - Similarity threshold (0-1, default: 0.85)

**Returns:** `true` if artists match, `false` otherwise

**Example:**

```typescript
artistNamesMatch("עומר אדם", "Omer Adam"); // true
artistNamesMatch("Omer Adam", "omer adam"); // true
artistNamesMatch("Netta", "נטע ברזילי"); // true
artistNamesMatch("Random Artist", "Other Artist"); // false
```

### `getCanonicalArtistName(artistName: string): string`

Get the canonical (normalized) version of an artist name.

**Parameters:**

- `artistName` - Artist name to normalize

**Returns:** Canonical name if in alias list, otherwise normalized version

**Example:**

```typescript
getCanonicalArtistName("OMER ADAM"); // "omer adam"
getCanonicalArtistName("עומר אדם"); // "omer adam"
```

### `findBestArtistMatch(searchName: string, artistList: string[], threshold?: number)`

Find the best matching artist from a list.

**Parameters:**

- `searchName` - Artist name to search for
- `artistList` - Array of artist names to search in
- `threshold` - Minimum similarity threshold (default: 0.8)

**Returns:** Object with `{ match: string | null, score: number }`

**Example:**

```typescript
const artists = ["Omer Adam", "Eyal Golan", "Netta"];
findBestArtistMatch("עומר אדם", artists);
// { match: "Omer Adam", score: 1.0 }
```

## Adding New Artist Aliases

Edit `utils/artistMatcher.ts` and add to the `ARTIST_ALIASES` object:

```typescript
const ARTIST_ALIASES: { [key: string]: string[] } = {
  // ... existing aliases ...

  "new artist": ["שם חדש", "new artist", "variation"],
};
```

**Format:**

- Key: lowercase canonical name
- Value: array of all variations (Hebrew, English, common misspellings)

## How It Works

### Step 1: Normalization

```
Input: "Omer Adam"     → "omer adam"
Input: "  OMER  ADAM " → "omer adam"
Input: "עומר אדם"      → "עומר אדם" (Hebrew preserved)
```

### Step 2: Exact Match Check

```
"omer adam" === "omer adam" ✅
```

### Step 3: Alias Lookup

```
ARTIST_ALIASES["omer adam"] = ["עומר אדם", "omer adam", ...]
"עומר אדם" found in aliases ✅
```

### Step 4: Fuzzy Matching (if needed)

```
Levenshtein("omer adam", "omar adam") → similarity: 0.91 ✅
Levenshtein("omer adam", "different") → similarity: 0.30 ❌
```

## Integration Points

### 1. **Ticket Upload Flow**

- User uploads ticket image
- OCR extracts artist name (could be Hebrew or English)
- System searches all concerts
- Uses `artistNamesMatch()` to find matching concert
- If match found → links ticket to concert
- If no match → ticket marked as "pending_approval"

### 2. **Approval Flow**

- Admin reviews pending tickets
- System suggests concerts with similar artist names
- Admin can manually link ticket to suggested concert
- Uses `getSuggestedConcerts()` to find candidates

### 3. **Testing Interface**

- Admin navigates to `/manage-artists`
- Tests any two artist names for matching
- Sees normalized versions and similarity scores
- Helps debug matching issues

## Benefits

✅ **Automatic Matching** - Tickets automatically find concerts regardless of language  
✅ **Typo Tolerance** - Minor spelling errors don't break matching  
✅ **Bilingual Support** - Works with Hebrew and English seamlessly  
✅ **Manual Override** - Admin can link tickets manually when needed  
✅ **Extensible** - Easy to add new artist aliases  
✅ **Transparent** - Console logging shows matching decisions

## Console Logs

The system provides detailed console output:

```
✅ Exact match: "omer adam" === "omer adam"
✅ Alias match: "עומר אדם" and "omer adam" both map to "omer adam"
✅ Fuzzy match: "omar adam" and "omer adam" (similarity: 0.91)
❌ No match: "different artist" vs "omer adam" (similarity: 0.30)
```

## Troubleshooting

### Ticket not matching concert?

1. **Check artist spelling** - Go to `/manage-artists` and test both names
2. **Check console logs** - Look for matching decisions in browser console
3. **Add alias if needed** - Edit `ARTIST_ALIASES` in `utils/artistMatcher.ts`
4. **Manual linking** - Use "קשר לקונצרט זה" button in `/approve-tickets`

### False positives?

- Increase similarity threshold (default: 0.85)
- Make alias mappings more specific
- Check normalization is working correctly

### False negatives?

- Decrease similarity threshold (try 0.75-0.80)
- Add more alias variations
- Check for special characters being removed incorrectly

## Future Enhancements

- 🔮 Admin UI to add aliases without code editing
- 🔮 Machine learning for automatic alias discovery
- 🔮 Support for artist nicknames/stage names
- 🔮 Integration with external artist databases
- 🔮 Transliteration engine for Hebrew ↔ English conversion

## Files

- **`utils/artistMatcher.ts`** - Core matching logic and aliases
- **`app/manage-artists/page.tsx`** - Testing interface
- **`app/components/Dialogs/UploadTicketDialog/UploadTicketDialog.tsx`** - Ticket upload integration
- **`app/approve-tickets/page.tsx`** - Approval page with suggestions

---

**Created:** January 2025  
**Last Updated:** January 2025  
**Maintained By:** Admin Team
