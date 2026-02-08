# Database Structure Documentation

## Overview

The Tiket marketplace uses separate collections for **concerts** and **tickets** to properly model the one-to-many relationship.

## Collections

### 1. **concerts** Collection

Stores information about concert events.

```typescript
{
  artist: string; // "שלמה ארצי"
  title: string; // Concert title (defaults to artist name)
  date: string; // "DD/MM/YYYY"
  time: string; // "HH:MM"
  venue: string; // "היכל מנורה מבטחים"
  imageData: string | null; // Base64 encoded image
  status: string; // "active" | "past" | "cancelled"
  createdAt: Timestamp; // Server timestamp
  views: number; // View counter
}
```

**Purpose**: Represents a unique concert event. Used in the gallery to display concert cards.

### 2. **tickets** Collection

Stores individual tickets for sale, linked to concerts.

```typescript
{
  concertId: string; // Reference to concert document ID
  artist: string; // "שלמה ארצי" (for matching)
  date: string; // "DD/MM/YYYY" (for matching)
  venue: string; // "היכל מנורה מבטחים" (for matching)
  section: string; // "A"
  row: string; // "5"
  seat: string; // "12"
  isStanding: boolean; // true for standing tickets
  askingPrice: number; // 250
  originalPrice: number | null; // 300
  allowPriceSuggestions: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  extractedText: string | null; // OCR extracted text
  status: string; // "available" | "sold" | "reserved"
  createdAt: Timestamp;
  sellerId: string; // User ID of seller
}
```

**Purpose**: Represents individual tickets for sale. Linked to a concert via `concertId`.

## Upload Flow

When a user uploads tickets:

1. **Group tickets by concert** (artist + date + venue)
2. **Find or create concert**:
   - Query concerts collection for matching artist, date, and venue
   - If found: Use existing concert ID
   - If not found: Create new concert document
3. **Create ticket documents**:
   - Each ticket references the concert via `concertId`
   - Tickets store seating info and pricing

## Gallery Display

To display concerts in the gallery:

1. **Fetch all active concerts** from `concerts` collection
2. **For each concert**, query `tickets` collection where:
   - `concertId == concert.id`
   - `status == "available"`
3. **Calculate price range**:
   - Min price: lowest `askingPrice` among available tickets
   - Max price: highest `askingPrice` among available tickets
4. **Calculate available tickets**: Count of tickets with status "available"

## Example Queries

### Get all concerts with ticket info

```typescript
// 1. Get all concerts
const concertsSnapshot = await getDocs(collection(db, "concerts"));

for (const concertDoc of concertsSnapshot.docs) {
  const concertId = concertDoc.id;
  const concertData = concertDoc.data();

  // 2. Get available tickets for this concert
  const ticketsQuery = query(
    collection(db, "tickets"),
    where("concertId", "==", concertId),
    where("status", "==", "available")
  );

  const ticketsSnapshot = await getDocs(ticketsQuery);
  const tickets = ticketsSnapshot.docs.map((doc) => doc.data());

  // 3. Calculate price range
  const prices = tickets.map((t) => t.askingPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const ticketsLeft = tickets.length;

  // Display in gallery
  console.log({
    ...concertData,
    priceRange: `₪${minPrice} - ₪${maxPrice}`,
    ticketsLeft,
  });
}
```

### Find concert by ticket details

```typescript
const concertsQuery = query(
  collection(db, "concerts"),
  where("artist", "==", "שלמה ארצי"),
  where("date", "==", "15/10/2025"),
  where("venue", "==", "היכל מנורה מבטחים")
);

const snapshot = await getDocs(concertsQuery);
if (!snapshot.empty) {
  const concertId = snapshot.docs[0].id;
  // Use this concert
}
```

## Benefits

1. **No duplicate concerts**: Multiple users can sell tickets to the same concert
2. **Accurate ticket counts**: Query tickets by concertId
3. **Price ranges**: Calculate from actual available tickets
4. **Scalability**: Can have thousands of tickets per concert
5. **Clean data**: Concert info stored once, not duplicated per ticket

## Next Steps

1.  Update upload dialog to create concerts and link tickets
2. ⏭ Update Gallery component to fetch concerts + aggregate ticket data
3. ⏭ Update EventPage to show concert details + available tickets
4. ⏭ Add admin panel to manage concerts (edit details, merge duplicates)
