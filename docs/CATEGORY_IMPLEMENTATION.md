# Category Implementation Guide

## Overview

Added event category system with LLM auto-detection throughout the platform.

## Categories

- **מוזיקה** (Music) - Default
- **תיאטרון** (Theater/Plays)
- **סטנדאפ** (Stand-up Comedy)
- **ילדים** (Kids Shows)
- **ספורט** (Sports Events)

## Implementation

### 1. Admin Event Creation (`app/Admin/page.tsx`)

- Added category dropdown to event creation form
- Category saved to Firebase `concerts` collection
- Category badge displayed in events list

### 2. OCR Extraction (`app/api/ocr-extract/route.ts`)

**Changes:**

- Updated `TicketData` interface with `category: string | null`
- Modified Gemini prompt to detect event category:
  ```
  - category: classify the event type. Must be one of: "מוזיקה" (music concerts),
    "תיאטרון" (theater/plays), "סטנדאפ" (stand-up comedy), "ילדים" (kids shows),
    "ספורט" (sports events). Default to "מוזיקה" if unsure.
  ```
- Returns detected category with other extracted data
- Defaults to "מוזיקה" if parsing fails

### 3. Step 3 Upload UI (`StepThreeUploadTicket.tsx`)

**Changes:**

- Added `category` to `ExtendedTicketDetails` interface
- Pre-fills category dropdown with LLM-detected value
- User can override category selection before publishing
- Category dropdown positioned after artist field

**UI Code:**

```tsx
<div>
  <label className="block text-sm font-medium mb-1 text-gray-700">
    קטגוריה *
  </label>
  <select
    id="category"
    name="category"
    value={editableDetails.category}
    onChange={(e) => handleDetailChange("category", e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg..."
  >
    <option value="מוזיקה">מוזיקה</option>
    <option value="תיאטרון">תיאטרון</option>
    <option value="סטנדאפ">סטנדאפ</option>
    <option value="ילדים">ילדים</option>
    <option value="ספורט">ספורט</option>
  </select>
</div>
```

### 4. Upload Dialog (`UploadTicketDialog.tsx`)

**Changes:**

- Added `category: ticket.ticketDetails?.category || "מוזיקה"` to ticketDoc
- Category saved to Firebase `tickets` collection
- Defaults to "מוזיקה" if not detected

### 5. Type Definitions (`UploadTicketInterface.types.ts`)

**Changes:**

- Added `category?: string` to `ticketDetails` interface
- Includes comment explaining the 5 category options

## Data Flow

```
1. User uploads ticket image
   ↓
2. OCR API extracts text via Google Vision
   ↓
3. Gemini analyzes text and detects category
   ↓
4. Step 3 displays category dropdown (pre-filled)
   ↓
5. User reviews/changes category
   ↓
6. Ticket published to Firebase with category field
```

## LLM Detection Logic

Gemini analyzes ticket text and classifies based on:

- **מוזיקה**: Concert tickets, band/singer names, music venues
- **תיאטרון**: Theater shows, plays, musicals
- **סטנדאפ**: Comedy shows, stand-up performances
- **ילדים**: Kids shows, children's entertainment
- **ספורט**: Sports events, team names, stadiums

Default fallback: "מוזיקה"

## Database Schema

### `concerts` Collection

```typescript
{
  artist: string,
  category: string,  // NEW
  date: string,
  time: string,
  venue: string,
  imageUrl: string,
  createdAt: Timestamp
}
```

### `tickets` Collection

```typescript
{
  artist: string,
  category: string,  // NEW
  venue: string,
  date: string,
  time: string,
  // ... other fields
}
```

## Testing

To test category detection:

1. Upload a concert ticket → Should detect "מוזיקה"
2. Upload a theater ticket → Should detect "תיאטרון"
3. Upload a sports ticket → Should detect "ספורט"
4. In Step 3, verify dropdown shows detected category
5. Change category and verify it saves correctly

## Future Enhancements

- **Category filters** in search/browse pages
- **Category badges** on ticket cards
- **Analytics** by category in admin dashboard
- **Category-specific pricing suggestions**
