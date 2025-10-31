# Database Migration Guide

## Overview

This migration converts your existing flat tickets structure into a proper concerts + tickets relational model.

## Before Migration

```
tickets/
 ticket1 (artist: "שלמה ארצי", date: "15/10/2025", venue: "היכל", price: 250)
 ticket2 (artist: "שלמה ארצי", date: "15/10/2025", venue: "היכל", price: 300)
 ticket3 (artist: "עלמה גוב", date: "20/10/2025", venue: "פארק", price: 200)
 ...
```

## After Migration

```
concerts/
 concert1 (artist: "שלמה ארצי", date: "15/10/2025", venue: "היכל")
 concert2 (artist: "עלמה גוב", date: "20/10/2025", venue: "פארק")

tickets/
 ticket1 (concertId: concert1, section: "A", row: "5", seat: "12", price: 250)
 ticket2 (concertId: concert1, section: "B", row: "10", seat: "8", price: 180)
 ticket3 (concertId: concert1, section: "VIP", row: "1", seat: "5", price: 450)
 ticket4 (concertId: concert2, isStanding: true, price: 200)
 ...
```

## How to Run

### Option 1: Web UI (Recommended)

1. Start your development server: `npm run dev`
2. Go to: http://localhost:3000/migrate
3. Click "Run Migration" button
4. Wait for completion (may take 30-60 seconds)
5. Check the success message with stats

### Option 2: Node.js Script

1. Install dependencies: `npm install firebase-admin`
2. Ensure `creds.json` exists in root
3. Run: `node migrate-to-concerts.js`
4. Check console output for progress

## What Happens

### 1. Backup (Safety First!)

- All existing tickets copied to `tickets_backup` collection
- Original data preserved for rollback if needed

### 2. Concert Creation

- Groups existing tickets by: `artist + date + venue`
- Creates one concert per unique combination
- Uses first ticket's image for concert image

### 3. Ticket Generation

- Generates 3-10 random tickets per concert
- Mix of seated (70%) and standing (30%) tickets
- Random sections: A, B, C, D, VIP
- Random rows: 1-30
- Random seats: 1-40
- Price range: 150-450 ILS with random discounts

### 4. New Tickets Collection

- Each ticket linked to concert via `concertId`
- Includes seating info (section, row, seat)
- Includes pricing (askingPrice, originalPrice)
- Status: "available"

## After Migration

### Verify Success

1. Go to Firebase Console
2. Check `concerts` collection - should have your concerts
3. Check `tickets` collection - should have multiple tickets per concert
4. Check `tickets_backup` - should have your old data

### Update Your Code

Update these components to use new structure:

- [ ] `Gallery.tsx` - Fetch concerts, aggregate ticket data
- [ ] `EventPage/[title]/page.tsx` - Show concert + available tickets
- [ ] `SearchResults/[query]/page.tsx` - Search concerts
- [ ] `Card.tsx` - Display concert with price range

### Clean Up (Optional)

Once verified everything works:

```typescript
// Delete backup collection (in Firebase Console or via script)
await db
  .collection("tickets_backup")
  .get()
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => doc.ref.delete());
  });
```

## Example Queries After Migration

### Get all concerts with ticket info

```typescript
const concertsSnapshot = await getDocs(collection(db, "concerts"));

for (const concertDoc of concertsSnapshot.docs) {
  const concert = { id: concertDoc.id, ...concertDoc.data() };

  // Get available tickets
  const ticketsQuery = query(
    collection(db, "tickets"),
    where("concertId", "==", concert.id),
    where("status", "==", "available")
  );

  const ticketsSnapshot = await getDocs(ticketsQuery);
  const tickets = ticketsSnapshot.docs.map((doc) => doc.data());

  // Calculate price range
  const prices = tickets.map((t) => t.askingPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  console.log({
    ...concert,
    priceRange: `₪${minPrice} - ₪${maxPrice}`,
    ticketsAvailable: tickets.length,
  });
}
```

## Rollback (If Needed)

If something goes wrong:

1. **Delete new collections**:

   - Delete `concerts` collection
   - Delete `tickets` collection

2. **Restore from backup**:
   ```typescript
   // Copy tickets_backup → tickets
   const backupSnapshot = await getDocs(collection(db, "tickets_backup"));
   for (const doc of backupSnapshot.docs) {
     await addDoc(collection(db, "tickets"), doc.data());
   }
   ```

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Firebase Console → Firestore for data
3. Review `DATABASE_STRUCTURE.md` for details
4. Check migration logs in browser DevTools

## Statistics Example

```
 Migration completed successfully!

 Statistics:
• Old tickets backed up: 15
• Concerts created: 5
• New tickets generated: 32
• Average tickets per concert: 6
```

## Notes

- Migration is idempotent (can run multiple times safely)
- Backup collection can be deleted after verification
- Generated tickets have random but realistic data
- All tickets initially marked as "available"
- Seller ID set to "system_generated"
