# 🌐 Mocky.io Setup Guide

## Step-by-Step Instructions to Make Venue Database Accessible Online

### Option 1: Quick Setup (Recommended for Demo)

1. **Go to Mocky.io**

   - Visit: https://designer.mocky.io/

2. **Create New Mock**

   - Click "Create New Mock"

3. **Configure Response**

   - **Name**: `Tiket Venue Database`
   - **Status Code**: `200`
   - **Content-Type**: `application/json`
   - **Delay**: `500-1500ms` (to simulate real API)

4. **Paste Mock Data**

   - Open `MOCK_VENUE_DATA.json`
   - Copy entire content
   - Paste into Mocky.io body field

5. **Generate URL**

   - Click "Generate"
   - Copy the URL (format: `https://run.mocky.io/v3/XXXXX-XXXX-XXXX`)

6. **Update Code**

   - Open `app/api/venue-verify/route.ts`
   - Find line ~44: `const MOCKY_IO_URL = "https://run.mocky.io/v3/YOUR_MOCKY_ID_HERE";`
   - Replace with your generated URL

7. **Enable Mocky.io Fetch** (Optional)
   - In `fetchMockVenueData()` function
   - Uncomment the fetch code:
     ```typescript
     try {
       const response = await fetch(MOCKY_IO_URL);
       const data = await response.json();
       return data.official_tickets;
     } catch (error) {
       console.error("Mocky.io fetch failed, using local data");
       // Fallback to local data
     }
     ```

---

### Option 2: Current Setup (Local Mock - Faster)

**No Setup Needed!**

- Currently using local mock data in `venue-verify/route.ts`
- Data is hardcoded in `fetchMockVenueData()` function
- Simulates API delay (500-1500ms)
- **Pros**: No external dependency, faster, full control
- **Cons**: Not a "real" external API call

---

### For Investor Demo Presentation

#### Show Mocky.io Dashboard:

1. Open Mocky.io in browser during demo
2. Show the JSON response
3. Explain: "This simulates venue APIs like Leaan, Eventim"
4. Point out: Real venue data structure (barcodes, ticket IDs, etc.)

#### Live API Call:

1. Open browser developer tools (Network tab)
2. Upload a ticket
3. Show the API call to `/api/venue-verify`
4. Show it calling Mocky.io (if enabled)
5. Show verification response with confidence score

---

### Alternative Services (If Mocky.io is Down)

1. **JSONPlaceholder** - https://jsonplaceholder.typicode.com/
2. **My JSON Server** - https://my-json-server.typicode.com/
3. **Mockable.io** - https://www.mockable.io/
4. **Beeceptor** - https://beeceptor.com/

---

### Testing the API

#### Using curl:

```bash
curl -X POST http://localhost:3000/api/venue-verify \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "7290016353891",
    "artist": "עומר אדם",
    "venue": "היכל מנורה מבטחים",
    "date": "15/03/2025",
    "time": "21:00",
    "section": "A",
    "row": "12",
    "seat": "15"
  }'
```

#### Expected Response:

```json
{
  "verified": true,
  "confidence": 95,
  "status": "verified",
  "matchedFields": [
    "barcode",
    "artist",
    "date",
    "venue",
    "section",
    "row",
    "seat"
  ],
  "unmatchedFields": [],
  "details": {
    "officialTicketId": "LEAAN-2025-HIK-001234",
    "eventId": "EVT-HIK-5678",
    "ticketingSystem": "Leaan",
    "originalPrice": 350
  },
  "reason": "כרטיס אומת בהצלחה! תואם 7 שדות במערכת Leaan",
  "timestamp": "2025-01-22T10:00:00.000Z"
}
```

---

### Demo Script

1. **Explain the Problem**:

   - "Currently, admins manually verify every ticket - slow and doesn't scale"

2. **Show the Solution**:

   - "We built automatic verification against venue databases"
   - Open Mocky.io, show the mock venue database

3. **Live Demo**:

   - Upload ticket with barcode `7290016353891`
   - Show instant "✅ Verified" message
   - Open MyTickets, show green badge + 95% confidence

4. **Show Partial Match**:

   - Upload ticket with wrong section
   - Show "⏳ Needs Review" message
   - Open Admin panel, show verification details

5. **Show Rejection**:

   - Upload fake ticket
   - Show "❌ Rejected" message
   - Explain: "Saves admin time by rejecting obvious fakes"

6. **Show Metrics** (Future):
   - "80% auto-approved"
   - "2 second verification vs 2-4 hour manual review"
   - "90% reduction in admin work"

---

### Recommended: Keep Local Mock for Now

**Why?**

- Faster iteration during development
- No external dependency
- Same functionality
- Can switch to Mocky.io anytime for demo

**When to Use Mocky.io?**

- Investor presentations (looks more "real")
- Showing external API integration
- Demo that data is accessible externally

**Current Status**: ✅ Working with local mock data
