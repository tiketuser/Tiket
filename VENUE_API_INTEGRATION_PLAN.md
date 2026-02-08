# Venue API Integration Plan (POC for Investors)

##  **Objective**

Replace manual admin approval with automated venue API verification to prove the concept of real-time ticket validation against official venue databases.

---

##  **Current Flow**

1. User uploads ticket → OCR extraction → Saved as `status: "pending_approval"`
2. Admin manually reviews each ticket in `/approve-tickets`
3. Admin approves/rejects manually
4. Approved tickets change to `status: "available"`

---

##  **New Flow (Automated Verification)**

### **Phase 1: Ticket Upload & Automatic Verification**

```
User uploads ticket
    ↓
OCR extracts details (artist, date, venue, seat, barcode)
    ↓
[NEW] Call Venue API to verify ticket authenticity
    ↓
  Verified: status = "verified" → Publish immediately
  Partial Match: status = "needs_review" → Admin review
  Not Found: status = "rejected" → Notify seller
```

### **Phase 2: Admin Dashboard (Updated)**

- **Auto-verified tickets**: Bypass approval (go straight to marketplace)
- **Needs Review**: Show in admin panel with API response + suggestion
- **Rejected**: Log reason, notify seller automatically

---

##  **Mock Venue Database Schema**

Using **JSONPlaceholder** style mock API or **Mocky.io** for demo purposes.

### **Venue Database Table: `official_tickets`**

```json
{
  "ticketId": "TKT-2025-001234",
  "eventId": "EVT-12345",
  "eventName": "עומר אדם - הופעה בלייב",
  "venueName": "היכל התרבות",
  "venueId": "VEN-001",
  "eventDate": "15/03/2025",
  "eventTime": "21:00",
  "section": "A",
  "row": "12",
  "seat": "15",
  "seatType": "seated", // or "standing"
  "barcode": "123456789012",
  "ticketStatus": "active", // active, used, cancelled, refunded
  "originalPrice": 350,
  "purchaseDate": "10/01/2025",
  "buyerEmail": "masked@example.com" // partial for privacy
}
```

### **API Endpoints (Mock)**

1. **Verify Ticket**: `POST /api/verify-ticket`

   - Input: `{ barcode, eventName, venue, date, seat }`
   - Output: `{ verified: boolean, confidence: number, details: {...}, reason: string }`

2. **Search Event**: `GET /api/events?name={eventName}&date={date}`

   - Returns list of official events matching criteria

3. **Get Event Details**: `GET /api/events/{eventId}`
   - Returns full event info including available sections/seats

---

##  **Implementation Steps**

### **Step 1: Create Mock Venue API** 

- **File**: `app/api/venue-verify/route.ts`
- **Mock Data**: Store in `app/api/venue-verify/mockVenueData.ts`
- **Logic**:
  - Match barcode (highest confidence)
  - Match event name + date + venue (medium confidence)
  - Match partial details (low confidence → needs review)
  - No match (reject)

### **Step 2: Update Ticket Upload Flow** 

- **File**: `app/components/Dialogs/UploadTicketDialog/UploadTicketDialog.tsx`
- **Changes**:
  - After OCR extraction, call `/api/venue-verify`
  - Set `status` based on API response:
    - `verified` (90-100% match) → Auto-publish
    - `needs_review` (60-89% match) → Admin review
    - `rejected` (<60% match) → Don't save ticket
  - Store verification details: `verificationResult`, `verificationConfidence`, `verificationTimestamp`

### **Step 3: Update Ticket Schema** 

Add new fields to ticket documents:

```typescript
{
  // ... existing fields
  verificationStatus: "verified" | "needs_review" | "rejected" | "pending",
  verificationConfidence: number, // 0-100
  verificationDetails: {
    officialTicketId?: string,
    matchedEventId?: string,
    matchedFields: string[], // ["barcode", "seat", "date"]
    unmatchedFields: string[],
    apiResponse: any,
  },
  verificationTimestamp: Timestamp,
}
```

### **Step 4: Update Admin Approval Page** 

- **File**: `app/approve-tickets/page.tsx`
- **Changes**:
  - Filter to show only `status: "needs_review"` tickets
  - Display verification confidence score with visual indicator
  - Show matched/unmatched fields
  - Suggest why ticket needs review
  - Quick approve/reject with verification context
  - Add "Re-verify" button to check API again

### **Step 5: Add Verification Dashboard** 

- **File**: `app/Admin/page.tsx` (add new section)
- **Stats**:
  - Total tickets verified today
  - Auto-approved rate
  - Manual review rate
  - Rejection rate
  - Average confidence score

### **Step 6: Seller Notifications** 

- **Instant approval**: "כרטיס אומת ופורסם מיד! "
- **Needs review**: "כרטיס בבדיקה (זמן משוער: 2-4 שעות) ⏳"
- **Rejected**: "הכרטיס לא אומת - פרטים לא תואמים למאגר האולמות "

---

##  **UI/UX Changes**

### **Upload Dialog Success Message**

```
 הכרטיס אומת בהצלחה!

הכרטיס שלך אושר אוטומטית על ידי מערכת האימות של האולם
ופורסם למכירה באתר.

[אמינות: 98%] [ ברקוד אומת] [ מושב תואם]

→ צפייה בכרטיס שלי
```

### **Needs Review Message**

```
 הכרטיס נשלח לבדיקה

פרטי הכרטיס תואמים חלקית למאגר האולם.
הצוות שלנו יבדוק את הכרטיס תוך 2-4 שעות.

[אמינות: 75%] [ תאריך תואם] [ מושב לא תואם]

נעדכן אותך ב-SMS/Email
```

---

##  **Security Considerations**

1. **Rate Limiting**: Limit API calls to prevent abuse
2. **Barcode Privacy**: Don't expose full barcode in client-side logs
3. **Fraud Detection**: Flag suspicious patterns (same barcode multiple times)
4. **Mock Data Security**: Clearly mark as "DEMO DATA" in UI for investors

---

##  **Success Metrics (For Investor Demo)**

- **Automation Rate**: 80%+ tickets auto-approved
- **Verification Speed**: <2 seconds per ticket
- **False Positive Rate**: <5% (incorrectly approved)
- **False Negative Rate**: <10% (incorrectly flagged for review)
- **Admin Time Saved**: 90% reduction in manual approval time

---

##  **Mock API Implementation Options**

### **Option 1: Local Mock (Recommended for POC)**

- File: `app/api/venue-verify/mockVenueData.ts`
- Pros: No external dependency, full control, fast
- Cons: Not "real" API call (but can simulate delay)

### **Option 2: Mocky.io or JSONPlaceholder**

- Use external mock API service
- Pros: Looks more "real" to investors
- Cons: External dependency, limited customization

### **Option 3: Firebase Firestore Collection**

- Create `official_tickets` collection with mock data
- Pros: Simulates real database lookup
- Cons: More setup, costs (minimal)

---

##  **Recommended: Option 1 (Local Mock)**

We'll create a sophisticated local mock that:

- Simulates API latency (500-1500ms delay)
- Returns realistic responses
- Has configurable match scenarios
- Includes proper error handling
- Logs requests for demo purposes

---

##  **Next Steps**

1.  Review and approve this plan
2.  Implement mock venue API endpoint
3.  Update upload flow with verification
4.  Update UI with verification status
5.  Add verification dashboard
6.  Test various scenarios
7.  Prepare investor demo script

---

##  **Demo Script for Investors**

1. **Show current pain point**: Manual approval is slow
2. **Introduce solution**: Automated venue API verification
3. **Live demo**:
   - Upload ticket with matching barcode →  Instant approval
   - Upload ticket with partial match →  Needs review (show admin)
   - Upload fake ticket →  Rejected with reason
4. **Show metrics**: 80% automation rate, 2sec verification time
5. **Future roadmap**: Integration with 15+ venue APIs in Israel
