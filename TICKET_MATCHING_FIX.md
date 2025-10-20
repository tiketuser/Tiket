# Ticket Upload Matching Fix

## Problem

When uploading a new ticket, it was creating a new concert instead of attaching it to an existing concert.

## Root Cause

The ticket matching logic in `UploadTicketDialog.tsx` was using **exact string comparison** for three fields:

1. `artist` - Artist name
2. `date` - Event date
3. `venue` - Venue/location name

This caused failures when:

- **Date formats differed**: OCR might extract "06 DEC 2025" but Admin creates "06/12/2025"
- **Case sensitivity**: "Omer Adam" vs "omer adam"
- **Extra whitespace**: "Park Hayarkon " vs "Park Hayarkon"
- **Hebrew months**: "6 בדצמבר 2025" vs "06/12/2025"

## Solution Implemented

### 1. Flexible String Matching

Added `normalizeString()` function that:

- Converts to lowercase
- Trims whitespace
- Normalizes multiple spaces to single space

### 2. Date Format Normalization

Added `normalizeDate()` function that converts various date formats to standard `dd/mm/yyyy`:

- **Hebrew months**: "6 בדצמבר" → "06/12/2025"
- **English months**: "06 DEC" → "06/12/2025"
- **Already formatted**: "06/12/2025" → "06/12/2025" (unchanged)
- **Partial dates**: "06 DEC" → "06/12/2025" (adds current year)

Supports both Hebrew and English month names:

- Hebrew: ינואר, פברואר, מרץ, אפריל, מאי, יוני, יולי, אוגוסט, ספטמבר, אוקטובר, נובמבר, דצמבר
- English: JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC

### 3. Two-Stage Matching Process

**Stage 1: Exact Match (Fast)**

```typescript
where("artist", "==", artist);
where("date", "==", normalizedDate);
where("venue", "==", venue);
```

**Stage 2: Flexible Search (Fallback)**
If exact match fails:

1. Fetch all concerts
2. Normalize all fields
3. Compare normalized values
4. Match on all three fields

### 4. Enhanced Logging

Added detailed console logs showing:

- Original values
- Normalized values
- Which concerts are being compared
- Match results for each field

## Files Modified

### `app/components/Dialogs/UploadTicketDialog/UploadTicketDialog.tsx`

- Added `normalizeString()` function
- Added `normalizeDate()` function with Hebrew/English month support
- Implemented two-stage matching (exact → flexible)
- Updated ticket and concert docs to use normalized dates
- Added comprehensive logging

### `app/diagnostic/page.tsx`

- Added "Matching Fields" section to each concert
- Shows exact field values used for matching
- Added matching field display for tickets
- Color-coded sections (blue for concerts, purple for tickets)

## How to Test

### 1. Check Current Database State

Visit `/diagnostic` to see:

- All concerts with their exact field values
- All tickets with their field values
- Which fields are used for matching

### 2. Create a Test Concert

Go to `/Admin` and create a concert with:

- Artist: "עומר אדם"
- Title: "קונצרט חג"
- Date: "06/12/2026" (dd/mm/yyyy format)
- Time: "21:00"
- Venue: "פארק הירקון - תל אביב"

### 3. Upload a Ticket

Use the "העלאת כרטיס" button and upload a ticket image.

The OCR might extract:

- Artist: "עומר אדם" or "Omer Adam"
- Date: "6 בדצמבר 2026" or "06 DEC 2026"
- Venue: "פארק הירקון תל אביב"

**Result**: Should now match the existing concert due to normalization!

### 4. Check Browser Console

Open DevTools (F12) and check console for matching logs:

```
Processing concert: עומר אדם on 6 בדצמבר 2026 at פארק הירקון
Normalized search criteria: {
  artist: "עומר אדם",
  date: "06/12/2026",
  venue: "פארק הירקון תל אביב"
}
Found existing concert with ID: abc123
```

## Common Matching Scenarios

### ✅ Will Match Now:

| Admin Input            | OCR Extract            | Match? |
| ---------------------- | ---------------------- | ------ |
| Artist: "עומר אדם"     | Artist: "עומר אדם"     | ✅ Yes |
| Date: "06/12/2026"     | Date: "6 בדצמבר 2026"  | ✅ Yes |
| Venue: "Park Hayarkon" | Venue: "park hayarkon" | ✅ Yes |
| Date: "06/12/2026"     | Date: "06 DEC 2026"    | ✅ Yes |

### ❌ Will Still Create New Concert:

| Scenario                                | Reason                                |
| --------------------------------------- | ------------------------------------- |
| Artist: "עומר אדם" vs "Omer Adam"       | Different scripts (Hebrew vs English) |
| Venue: "פארק הירקון" vs "Park Hayarkon" | Translation mismatch                  |
| Date: "06/12/2026" vs "07/12/2026"      | Actually different dates              |

## Future Improvements

1. **Fuzzy Artist Matching**: Use Levenshtein distance for artist names
2. **Venue Aliases**: Create mapping of Hebrew ↔ English venue names
3. **Artist Aliases**: Map stage names to real names ("עומר אדם" ↔ "Omer Adam")
4. **Manual Concert Selection**: Let users choose which concert to attach ticket to
5. **Similarity Score UI**: Show user which concerts are closest matches

## Debugging Tips

If tickets still create new concerts:

1. **Check the diagnostic page**: `/diagnostic`

   - Compare exact field values
   - Look for subtle differences (extra spaces, different characters)

2. **Check browser console**:

   - Look for "Normalized search criteria" log
   - Check "Comparing with concert" logs
   - See which fields don't match

3. **Common issues**:

   - Artist name in different language (Hebrew vs English)
   - Venue name translated differently
   - OCR extracted wrong date
   - Extra characters in venue name (e.g., "- תל אביב")

4. **Quick fix**:
   - Go to Admin panel
   - Edit concert to match OCR extraction format
   - Or manually specify concert ID in upload flow

## Testing Checklist

- [ ] Hebrew date formats work (בדצמבר)
- [ ] English date formats work (DEC)
- [ ] Case insensitive matching works
- [ ] Extra whitespace is ignored
- [ ] Diagnostic page shows matching fields
- [ ] Console logs help debug mismatches
- [ ] Normalized dates saved to database
- [ ] Tickets properly linked to concerts
