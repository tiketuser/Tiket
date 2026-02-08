# מדריך אינטגרציה עם API אמיתי של ספקי כרטיסים

##  סקירה כללית

מסמך זה מתאר כיצד לשדרג את המערכת ממאגר נתונים מדומה (Mock API) לאינטגרציה אמיתית עם מערכות כרטוס של אולמות וספקי כרטיסים.

---

##  ספקי כרטיסים עיקריים בישראל

### 1. **Leaan** (ליאן)

-  **אתר:** https://www.leaan.co.il
-  **נתח שוק:** ~40% מהאירועים בישראל
-  **אולמות מרכזיים:**
  - היכל מנורה מבטחים
  - היכל התרבות תל אביב
  - היכל הספורט ירושלים
  - פארק הירקון

**API Documentation:** יש לפנות ל-Leaan לקבלת גישה ל-API

### 2. **Eventim Israel** (אוונטים)

-  **אתר:** https://www.eventim.co.il
-  **נתח שוק:** ~30% מהאירועים
-  **חלק מרשת בינלאומית**

**API Documentation:** https://developer.eventim.com

### 3. **Ticketmaster Israel**

-  **אתר:** https://www.ticketmaster.co.il
-  **נתח שוק:** ~20% מהאירועים
-  **רשת עולמית**

**API Documentation:** https://developer.ticketmaster.com

### 4. **Tixwise** (טיקסווייז)

-  **אתר:** https://www.tixwise.co.il
-  אירועים קטנים ובינוניים

---

##  מה צריך להשתנות

### סיכום מהיר

| קובץ                             | שינוי נדרש                 | קושי      |
| -------------------------------- | -------------------------- | --------- |
| `app/api/venue-verify/route.ts`  | החלפת Mock API ב-API אמיתי | 🟡 בינוני |
| `MOCK_VENUE_DATA.json`           | מחיקה (לא צריך יותר)       | 🟢 קל     |
| `.env.local`                     | הוספת API Keys             | 🟢 קל     |
| `app/api/venue-verify/config.ts` | יצירת קובץ תצורה           | 🟡 בינוני |
| `lib/venueApiClient.ts`          | יצירת לקוח API             |  מורכב  |

---

##  שינויים מפורטים

###  קובץ: `app/api/venue-verify/route.ts`

**מיקום:** `app/api/venue-verify/route.ts`

**מצב נוכחי:**

```typescript
// קריאה למאגר Mock
const mockResponse = await fetch(
  "https://run.mocky.io/v3/7e8f5b2d-3c9a-4f1e-8b6d-9a2c3e4f5a6b"
);
const mockDatabase = await mockResponse.json();
```

**שינוי נדרש:**

#### א. הסרת קריאה ל-Mock API

**למחוק:**

```typescript
//  למחוק את כל הקוד הזה
const mockResponse = await fetch(
  "https://run.mocky.io/v3/7e8f5b2d-3c9a-4f1e-8b6d-9a2c3e4f5a6b"
);
const mockDatabase = await mockResponse.json();
const tickets = mockDatabase.tickets || [];
```

#### ב. הוספת קריאה ל-API אמיתי

**להוסיף:**

```typescript
//  קוד חדש - אינטגרציה אמיתית
import { verifyTicketWithVenue } from "@/lib/venueApiClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, artist, venue, date, time, section, row, seat } = body;

    console.log(" Verifying ticket with real venue API:", {
      barcode,
      artist,
      venue,
    });

    // קריאה ל-API אמיתי של ספק הכרטיסים
    const verificationResult = await verifyTicketWithVenue({
      barcode,
      artist,
      eventName: artist,
      venue,
      date,
      time,
      section,
      row,
      seat,
    });

    // החזרת התוצאה
    return NextResponse.json(verificationResult);
  } catch (error) {
    console.error(" Venue API error:", error);
    return NextResponse.json(
      {
        verified: false,
        confidence: 0,
        status: "needs_review",
        reason: "Unable to verify with venue API - manual review required",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

**מה השתנה:**

-  הוסר `fetch` למאגר Mock
-  נוסף `import` של פונקציית אימות אמיתית
-  קריאה ל-`verifyTicketWithVenue` שתטפל בכל הלוגיקה
-  טיפול בשגיאות משופר

---

###  קובץ חדש: `lib/venueApiClient.ts`

**צריך ליצור קובץ חדש!**

**מיקום:** `lib/venueApiClient.ts`

```typescript
// lib/venueApiClient.ts
// לקוח API לאימות כרטיסים מול מערכות ספקי כרטיסים

interface TicketVerificationRequest {
  barcode: string;
  artist: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  section?: string;
  row?: string;
  seat?: string;
}

interface TicketVerificationResponse {
  verified: boolean;
  confidence: number;
  status: "verified" | "needs_review" | "rejected";
  matchedFields: string[];
  unmatchedFields: string[];
  details?: {
    officialTicketId?: string;
    eventId?: string;
    ticketingSystem?: string;
  };
  reason: string;
  timestamp: string;
}

/**
 * זיהוי מערכת הכרטוס לפי ברקוד או אולם
 */
function detectTicketingSystem(barcode: string, venue: string): string {
  // Leaan - בדרך כלל ברקודים של 13 ספרות שמתחילים ב-978
  if (barcode.startsWith("978") && barcode.length === 13) {
    return "leaan";
  }

  // Eventim - בדרך כלל ברקודים אלפא-נומריים
  if (/^[A-Z0-9]{12,16}$/.test(barcode)) {
    return "eventim";
  }

  // Ticketmaster - בדרך כלל מתחילים ב-TM
  if (barcode.startsWith("TM")) {
    return "ticketmaster";
  }

  // זיהוי לפי אולם
  const venueNormalized = venue.toLowerCase();
  if (venueNormalized.includes("מנורה") || venueNormalized.includes("menora")) {
    return "leaan";
  }

  // ברירת מחדל
  return "unknown";
}

/**
 * אימות עם Leaan API
 */
async function verifyWithLeaan(
  request: TicketVerificationRequest
): Promise<TicketVerificationResponse> {
  const LEAAN_API_URL =
    process.env.LEAAN_API_URL || "https://api.leaan.co.il/v1";
  const LEAAN_API_KEY = process.env.LEAAN_API_KEY;

  if (!LEAAN_API_KEY) {
    throw new Error("LEAAN_API_KEY not configured");
  }

  try {
    const response = await fetch(`${LEAAN_API_URL}/tickets/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LEAAN_API_KEY}`,
        "X-API-Version": "1.0",
      },
      body: JSON.stringify({
        barcode: request.barcode,
        event_name: request.eventName,
        venue: request.venue,
        event_date: request.date,
        event_time: request.time,
      }),
    });

    if (!response.ok) {
      throw new Error(`Leaan API error: ${response.status}`);
    }

    const data = await response.json();

    // המרת תשובה מ-Leaan לפורמט שלנו
    return {
      verified: data.valid === true,
      confidence: data.valid ? 100 : 0,
      status: data.valid ? "verified" : "rejected",
      matchedFields: data.matched_fields || [],
      unmatchedFields: data.unmatched_fields || [],
      details: {
        officialTicketId: data.ticket_id,
        eventId: data.event_id,
        ticketingSystem: "Leaan",
      },
      reason: data.message || "Verified with Leaan",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(" Leaan API error:", error);
    throw error;
  }
}

/**
 * אימות עם Eventim API
 */
async function verifyWithEventim(
  request: TicketVerificationRequest
): Promise<TicketVerificationResponse> {
  const EVENTIM_API_URL =
    process.env.EVENTIM_API_URL || "https://api.eventim.com/v2";
  const EVENTIM_API_KEY = process.env.EVENTIM_API_KEY;
  const EVENTIM_CLIENT_ID = process.env.EVENTIM_CLIENT_ID;

  if (!EVENTIM_API_KEY || !EVENTIM_CLIENT_ID) {
    throw new Error("Eventim credentials not configured");
  }

  try {
    const response = await fetch(`${EVENTIM_API_URL}/tickets/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": EVENTIM_API_KEY,
        "X-Client-Id": EVENTIM_CLIENT_ID,
      },
      body: JSON.stringify({
        ticket_code: request.barcode,
        event_details: {
          name: request.eventName,
          venue: request.venue,
          date: request.date,
          time: request.time,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Eventim API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      verified: data.is_valid === true,
      confidence: data.is_valid ? 100 : 0,
      status: data.is_valid ? "verified" : "rejected",
      matchedFields: data.matched_attributes || [],
      unmatchedFields: data.unmatched_attributes || [],
      details: {
        officialTicketId: data.ticket_reference,
        eventId: data.event_id,
        ticketingSystem: "Eventim",
      },
      reason: data.validation_message || "Verified with Eventim",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(" Eventim API error:", error);
    throw error;
  }
}

/**
 * אימות עם Ticketmaster API
 */
async function verifyWithTicketmaster(
  request: TicketVerificationRequest
): Promise<TicketVerificationResponse> {
  const TM_API_URL =
    process.env.TICKETMASTER_API_URL ||
    "https://app.ticketmaster.com/discovery/v2";
  const TM_API_KEY = process.env.TICKETMASTER_API_KEY;

  if (!TM_API_KEY) {
    throw new Error("Ticketmaster API key not configured");
  }

  try {
    const response = await fetch(`${TM_API_URL}/tickets/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": TM_API_KEY,
      },
      body: JSON.stringify({
        barcode: request.barcode,
        event: {
          name: request.eventName,
          venue: request.venue,
          dateTime: `${request.date}T${request.time}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      verified: data.verified === true,
      confidence: data.verified ? 100 : 0,
      status: data.verified ? "verified" : "rejected",
      matchedFields: data.matches || [],
      unmatchedFields: data.mismatches || [],
      details: {
        officialTicketId: data.ticketId,
        eventId: data.eventId,
        ticketingSystem: "Ticketmaster",
      },
      reason: data.status_message || "Verified with Ticketmaster",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(" Ticketmaster API error:", error);
    throw error;
  }
}

/**
 * פונקציה ראשית - מנתבת לספק הנכון
 */
export async function verifyTicketWithVenue(
  request: TicketVerificationRequest
): Promise<TicketVerificationResponse> {
  console.log(" Detecting ticketing system...");

  const system = detectTicketingSystem(request.barcode, request.venue);

  console.log(` Detected system: ${system}`);

  try {
    switch (system) {
      case "leaan":
        return await verifyWithLeaan(request);

      case "eventim":
        return await verifyWithEventim(request);

      case "ticketmaster":
        return await verifyWithTicketmaster(request);

      default:
        // אם לא זוהה - נסה את כולם
        console.log(" Unknown system, trying all providers...");

        const errors: string[] = [];

        // נסה Leaan
        try {
          return await verifyWithLeaan(request);
        } catch (e) {
          errors.push(
            `Leaan: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }

        // נסה Eventim
        try {
          return await verifyWithEventim(request);
        } catch (e) {
          errors.push(
            `Eventim: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }

        // נסה Ticketmaster
        try {
          return await verifyWithTicketmaster(request);
        } catch (e) {
          errors.push(
            `Ticketmaster: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }

        // אף אחד לא עבד
        throw new Error(`All providers failed: ${errors.join(", ")}`);
    }
  } catch (error) {
    console.error(" Verification failed:", error);

    // במקרה של כשל - החזר needs_review
    return {
      verified: false,
      confidence: 0,
      status: "needs_review",
      matchedFields: [],
      unmatchedFields: [],
      reason: `API verification failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * פונקציית עזר - בדיקת זמינות API
 */
export async function checkApiHealth(): Promise<{
  leaan: boolean;
  eventim: boolean;
  ticketmaster: boolean;
}> {
  const results = {
    leaan: false,
    eventim: false,
    ticketmaster: false,
  };

  // בדוק Leaan
  try {
    const response = await fetch(`${process.env.LEAAN_API_URL}/health`);
    results.leaan = response.ok;
  } catch (e) {
    results.leaan = false;
  }

  // בדוק Eventim
  try {
    const response = await fetch(`${process.env.EVENTIM_API_URL}/status`);
    results.eventim = response.ok;
  } catch (e) {
    results.eventim = false;
  }

  // בדוק Ticketmaster
  try {
    const response = await fetch(`${process.env.TICKETMASTER_API_URL}/status`);
    results.ticketmaster = response.ok;
  } catch (e) {
    results.ticketmaster = false;
  }

  return results;
}
```

**מה הקובץ עושה:**

-  מזהה מערכת כרטוס אוטומטית (Leaan/Eventim/Ticketmaster)
-  מנתב לפונקציה הנכונה
-  מטפל בשגיאות
-  מנסה את כל הספקים אם לא זוהה
-  פונקציית בדיקת תקינות

---

###  קובץ: `.env.local`

**צריך להוסיף משתני סביבה!**

**מיקום:** `.env.local` (בשורש הפרויקט)

```bash
# ========================================
# API Keys של ספקי כרטיסים
# ========================================

# Leaan API
LEAAN_API_URL=https://api.leaan.co.il/v1
LEAAN_API_KEY=your_leaan_api_key_here

# Eventim API
EVENTIM_API_URL=https://api.eventim.com/v2
EVENTIM_API_KEY=your_eventim_api_key_here
EVENTIM_CLIENT_ID=your_eventim_client_id_here

# Ticketmaster API
TICKETMASTER_API_URL=https://app.ticketmaster.com/discovery/v2
TICKETMASTER_API_KEY=your_ticketmaster_api_key_here

# ========================================
# הגדרות נוספות
# ========================================

# Timeout לבקשות API (במילישניות)
VENUE_API_TIMEOUT=5000

# האם לאפשר fallback ל-Mock בסביבת פיתוח
ENABLE_MOCK_FALLBACK=true

# רמת Logging
VENUE_API_LOG_LEVEL=info
```

**איך להשיג API Keys:**

1. **Leaan:**

   - פנה אל: partnerships@leaan.co.il
   - הסבר שאתה בונה פלטפורמת משנית למכירת כרטיסים
   - בקש גישה ל-API לאימות כרטיסים

2. **Eventim:**

   - הירשם ב: https://developer.eventim.com
   - צור אפליקציה חדשה
   - קבל API Key ו-Client ID

3. **Ticketmaster:**
   - הירשם ב: https://developer.ticketmaster.com
   - צור App חדש
   - קבל API Key

---

###  קובץ: `MOCK_VENUE_DATA.json`

**פעולה: מחיקה**

```bash
# במסוף:
rm MOCK_VENUE_DATA.json
```

**למה למחוק:**

-  לא צריך יותר מאגר מדומה
-  יש לנו API אמיתי
-  ניקיון קוד

**אופציה: שמור לבדיקות**

אם רוצים לשמור לבדיקות:

```bash
# שנה שם
mv MOCK_VENUE_DATA.json tests/fixtures/MOCK_VENUE_DATA.json
```

---

###  קובץ חדש: `lib/venueApiConfig.ts`

**קובץ תצורה מרכזי**

**מיקום:** `lib/venueApiConfig.ts`

```typescript
// lib/venueApiConfig.ts
// תצורה מרכזית לכל ה-APIs

export const VENUE_API_CONFIG = {
  // Leaan
  leaan: {
    baseUrl: process.env.LEAAN_API_URL || "https://api.leaan.co.il/v1",
    apiKey: process.env.LEAAN_API_KEY,
    timeout: 5000,
    retryAttempts: 3,
    endpoints: {
      verify: "/tickets/verify",
      health: "/health",
      events: "/events",
    },
  },

  // Eventim
  eventim: {
    baseUrl: process.env.EVENTIM_API_URL || "https://api.eventim.com/v2",
    apiKey: process.env.EVENTIM_API_KEY,
    clientId: process.env.EVENTIM_CLIENT_ID,
    timeout: 5000,
    retryAttempts: 3,
    endpoints: {
      validate: "/tickets/validate",
      status: "/status",
      events: "/events/search",
    },
  },

  // Ticketmaster
  ticketmaster: {
    baseUrl:
      process.env.TICKETMASTER_API_URL ||
      "https://app.ticketmaster.com/discovery/v2",
    apiKey: process.env.TICKETMASTER_API_KEY,
    timeout: 5000,
    retryAttempts: 3,
    endpoints: {
      verify: "/tickets/verify",
      status: "/status",
      events: "/events",
    },
  },

  // הגדרות כלליות
  general: {
    timeout: parseInt(process.env.VENUE_API_TIMEOUT || "5000"),
    enableMockFallback: process.env.ENABLE_MOCK_FALLBACK === "true",
    logLevel: process.env.VENUE_API_LOG_LEVEL || "info",
  },
};

// בדיקה שכל ה-Keys קיימים
export function validateApiKeys(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!VENUE_API_CONFIG.leaan.apiKey) {
    missing.push("LEAAN_API_KEY");
  }

  if (!VENUE_API_CONFIG.eventim.apiKey) {
    missing.push("EVENTIM_API_KEY");
  }

  if (!VENUE_API_CONFIG.eventim.clientId) {
    missing.push("EVENTIM_CLIENT_ID");
  }

  if (!VENUE_API_CONFIG.ticketmaster.apiKey) {
    missing.push("TICKETMASTER_API_KEY");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
```

---

##  בדיקות והרצה

### בדיקת תקינות API

צור קובץ בדיקה: `scripts/test-venue-api.ts`

```typescript
// scripts/test-venue-api.ts
import { verifyTicketWithVenue, checkApiHealth } from "../lib/venueApiClient";

async function testVenueApi() {
  console.log(" Testing Venue API Integration\n");

  // 1. בדיקת תקינות
  console.log(" Checking API health...");
  const health = await checkApiHealth();
  console.log("Health status:", health);
  console.log("");

  // 2. בדיקת אימות כרטיס
  console.log(" Testing ticket verification...");

  const testTicket = {
    barcode: "9780123456789",
    artist: "עומר אדם",
    eventName: "עומר אדם - סיבוב הופעות 2026",
    venue: "היכל מנורה מבטחים",
    date: "15/03/2026",
    time: "21:00",
    section: "VIP",
    row: "5",
    seat: "12",
  };

  try {
    const result = await verifyTicketWithVenue(testTicket);
    console.log(" Verification result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(" Verification failed:", error);
  }
}

// הרץ בדיקות
testVenueApi();
```

**הרצה:**

```bash
npx tsx scripts/test-venue-api.ts
```

---

##  תהליך השדרוג

### שלב 1: הכנה (לפני השינויים)

1. **גיבוי הקוד הנוכחי**

   ```bash
   git checkout -b backup-mock-api
   git add .
   git commit -m "Backup before real API integration"
   git checkout main
   ```

2. **יצירת ענף חדש**

   ```bash
   git checkout -b feature/real-api-integration
   ```

3. **תיעוד המצב הנוכחי**
   - רשום איזה תכונות עובדות
   - רשום איזה בדיקות עוברות
   - צלם screenshots של הממשק

### שלב 2: קבלת גישה ל-APIs

1. **פנה לספקי הכרטיסים**

   - שלח בקשה ל-Leaan
   - הירשם ל-Eventim Developer Portal
   - הירשם ל-Ticketmaster Developer Portal

2. **קבל אישור והרשאות**

   - API Keys
   - סביבת Sandbox לבדיקות
   - תיעוד API

3. **בדוק את ה-APIs בנפרד**
   - השתמש ב-Postman/Insomnia
   - נסה קריאות בסיסיות
   - ודא שהתשובות תקינות

### שלב 3: ביצוע השינויים

**בסדר הזה:**

1. **צור את קובץ התצורה**

   ```bash
   touch lib/venueApiConfig.ts
   # העתק את הקוד מלמעלה
   ```

2. **צור את לקוח ה-API**

   ```bash
   touch lib/venueApiClient.ts
   # העתק את הקוד מלמעלה
   ```

3. **הוסף משתני סביבה**

   ```bash
   # ערוך .env.local
   nano .env.local
   # הוסף את כל ה-API Keys
   ```

4. **עדכן את route האימות**

   ```bash
   # ערוך app/api/venue-verify/route.ts
   # החלף את הקוד כפי שמתואר למעלה
   ```

5. **מחק/העבר את Mock Database**
   ```bash
   mv MOCK_VENUE_DATA.json tests/fixtures/
   ```

### שלב 4: בדיקות

1. **בדיקת תקינות בסיסית**

   ```bash
   npm run build
   # ודא שאין שגיאות קומפילציה
   ```

2. **הרץ את סקריפט הבדיקה**

   ```bash
   npx tsx scripts/test-venue-api.ts
   ```

3. **בדיקות ידניות**

   - העלה כרטיס אמיתי
   - בדוק שהאימות עובד
   - בדוק כרטיס לא תקף
   - בדוק טיפול בשגיאות

4. **בדיקות Load**
   ```bash
   # נסה 10 כרטיסים במקביל
   # ודא שה-API לא קורס
   ```

### שלב 5: Deployment

1. **הוסף משתני סביבה ל-Production**

   ```bash
   # ב-Vercel/Netlify/AWS:
   # הוסף את כל משתני הסביבה
   # ודא שהם מוצפנים
   ```

2. **Deploy לסביבת Staging**

   ```bash
   git push origin feature/real-api-integration
   # Deploy to staging
   # בדוק שהכל עובד
   ```

3. **Monitor לוגים**

   ```bash
   # בדוק שאין שגיאות
   # בדוק זמני תגובה
   # בדוק rate limits
   ```

4. **Deploy ל-Production**
   ```bash
   git checkout main
   git merge feature/real-api-integration
   git push origin main
   ```

---

##  בעיות נפוצות ופתרונות

### בעיה 1: API Keys לא עובדים

**תסמינים:**

- שגיאת 401 Unauthorized
- "Invalid API Key"

**פתרון:**

```typescript
// בדוק שה-Keys נטענים נכון
console.log("API Keys loaded:", {
  leaan: !!process.env.LEAAN_API_KEY,
  eventim: !!process.env.EVENTIM_API_KEY,
  ticketmaster: !!process.env.TICKETMASTER_API_KEY,
});

// ודא שאתה לא מדפיס את ה-Keys עצמם!
```

### בעיה 2: Timeout

**תסמינים:**

- "Request timeout"
- התשובה לוקחת יותר מ-5 שניות

**פתרון:**

```typescript
// הגדל את ה-timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000), // 10 שניות
});
```

### בעיה 3: Rate Limit

**תסמינים:**

- שגיאת 429 Too Many Requests
- "Rate limit exceeded"

**פתרון:**

```typescript
// הוסף retry עם backoff
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        // המתן והנסה שוב
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

### בעיה 4: פורמט תאריך שונה

**תסמינים:**

- API מצפה ל-ISO 8601
- אנחנו שולחים DD/MM/YYYY

**פתרון:**

```typescript
// המרת תאריך לפורמט ISO
function formatDateForApi(date: string): string {
  // DD/MM/YYYY → YYYY-MM-DD
  const [day, month, year] = date.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
```

---

##  ניטור ומדידה

### מדדים חשובים

1. **זמן תגובה ממוצע**

   ```typescript
   const start = Date.now();
   const result = await verifyTicketWithVenue(request);
   const duration = Date.now() - start;

   console.log(` Verification took ${duration}ms`);

   // שלח ל-Analytics
   analytics.track("venue_api_response_time", { duration });
   ```

2. **שיעור הצלחה**

   ```typescript
   // ספור הצלחות/כשלונות
   const stats = {
     total: 0,
     success: 0,
     failed: 0,
     successRate: 0,
   };

   // לאחר כל בקשה
   stats.total++;
   if (result.verified) {
     stats.success++;
   } else {
     stats.failed++;
   }
   stats.successRate = (stats.success / stats.total) * 100;
   ```

3. **שימוש בכל ספק**

   ```typescript
   const providerUsage = {
     leaan: 0,
     eventim: 0,
     ticketmaster: 0,
     unknown: 0,
   };

   // עדכן לאחר כל זיהוי
   providerUsage[system]++;
   ```

---

##  אבטחה

### אבטחת API Keys

1. **אף פעם לא בקוד**

   ```typescript
   //  רע
   const API_KEY = "sk_live_1234567890";

   //  טוב
   const API_KEY = process.env.LEAAN_API_KEY;
   ```

2. **הצפנה ב-Production**

   ```bash
   # השתמש בכלי הצפנה של הפלטפורמה
   # Vercel: Environment Variables עם הצפנה
   # AWS: Secrets Manager
   # Google Cloud: Secret Manager
   ```

3. **סיבוב Keys תקופתי**

   ```typescript
   // צור מערכת לסיבוב keys כל 90 יום
   // שמור תאריך יצירה
   const keyCreatedAt = new Date("2025-01-01");
   const now = new Date();
   const daysSinceCreation = (now - keyCreatedAt) / (1000 * 60 * 60 * 24);

   if (daysSinceCreation > 90) {
     console.warn(" API Key is older than 90 days - consider rotation");
   }
   ```

### Rate Limiting

```typescript
// הגבל קריאות API
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100, // מקסימום 100 בקשות לכל IP
});

// החל על route
app.use("/api/venue-verify", apiLimiter);
```

---

##  משאבים נוספים

### תיעוד APIs

- **Leaan:** פנה אל partnerships@leaan.co.il
- **Eventim:** https://developer.eventim.com/docs
- **Ticketmaster:** https://developer.ticketmaster.com/products-and-docs

### כלים מומלצים

- **Postman** - בדיקת APIs
- **Insomnia** - חלופה ל-Postman
- **Bruno** - קוד פתוח, offline-first

### ספריות מועילות

```bash
# Retry logic
npm install axios-retry

# Rate limiting
npm install express-rate-limit

# Circuit breaker
npm install opossum

# Monitoring
npm install @sentry/node
```

---

##  Checklist סופי

לפני השקה עם API אמיתי:

- [ ] קיבלתי API Keys מכל הספקים
- [ ] בדקתי את כל ה-APIs עם Postman
- [ ] יצרתי את `lib/venueApiClient.ts`
- [ ] יצרתי את `lib/venueApiConfig.ts`
- [ ] עדכנתי את `.env.local` עם כל ה-Keys
- [ ] עדכנתי את `app/api/venue-verify/route.ts`
- [ ] הסרתי/העברתי את `MOCK_VENUE_DATA.json`
- [ ] הרצתי בדיקות ידניות
- [ ] בדקתי טיפול בשגיאות
- [ ] בדקתי timeout ו-retries
- [ ] הוספתי logging מתאים
- [ ] הוספתי monitoring
- [ ] הגדרתי משתני סביבה ב-Production
- [ ] בדקתי ב-Staging
- [ ] עשיתי deployment ל-Production
- [ ] מנטר לוגים ל-24 שעות הראשונות

---

##  סיכום

אחרי ביצוע כל השינויים:

 **המערכת תעבוד עם APIs אמיתיים**  
 **אימות כרטיסים אמיתי מול מערכות אולמות**  
 **תמיכה ב-3 ספקי כרטיסים עיקריים**  
 **Fallback אוטומטי בין ספקים**  
 **טיפול בשגיאות מתקדם**  
 **ניטור ומדידה**

**זמן משוער לאינטגרציה:** 2-3 ימי עבודה

**קושי:** בינוני-גבוה (תלוי באיכות תיעוד ה-APIs)

---

**מסמך זה עודכן:** 24 באוקטובר 2025  
**גרסה:** 1.0  
**כותב:** System Documentation Team
