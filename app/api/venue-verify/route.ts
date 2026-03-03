import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

/**
 * Venue Ticket Verification API
 *
 * Data-driven: reads enabled providers from Firestore `venue_api_providers`.
 * - If the "builtin_demo" provider is enabled → runs local mock verification.
 * - For each enabled real provider → calls their API using stored config + secrets.
 * - Returns the first verified result, or the best partial match for review.
 */

interface VerificationRequest {
  barcode?: string;
  artist: string;
  eventName?: string;
  venue: string;
  date: string; // DD/MM/YYYY
  time?: string;
  section?: string;
  row?: string;
  seat?: string;
  isStanding?: boolean;
  _testProviderId?: string; // internal test flag
}

interface OfficialTicket {
  ticketId: string;
  barcode: string;
  eventId: string;
  eventName: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  section: string;
  row: string;
  seat: string;
  seatType: string;
  ticketStatus: string;
  originalPrice: number;
  ticketingSystem: string;
}

interface VerificationResponse {
  verified: boolean;
  confidence: number;
  status: "verified" | "needs_review" | "rejected";
  matchedFields: string[];
  unmatchedFields: string[];
  details?: {
    officialTicketId?: string;
    eventId?: string;
    ticketingSystem?: string;
    originalPrice?: number;
  };
  reason: string;
  timestamp: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  verifyEndpoint: string;
  authType: "bearer" | "header" | "query";
  authHeaderName: string;
  secondaryCredentialHeaderName?: string;
  requestBodyTemplate: string;
  responseValidField: string;
  barcodePattern?: string;
  enabled: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Replace {{variable}} tokens in the request body template */
function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/** Build the auth headers for a given provider config and its API key */
function buildAuthHeaders(
  provider: ProviderConfig,
  apiKey: string,
  secondaryKey?: string
): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (provider.authType === "bearer") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (provider.authType === "header") {
    headers[provider.authHeaderName] = apiKey;
  }
  // "query" type is appended to URL — handled separately

  if (provider.secondaryCredentialHeaderName && secondaryKey) {
    headers[provider.secondaryCredentialHeaderName] = secondaryKey;
  }

  return headers;
}

/** Resolve a dot-notation path in an object (e.g. "data.valid") */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((curr, key) => {
    if (curr && typeof curr === "object") return (curr as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// ─── Real provider call ──────────────────────────────────────────────────────

async function callRealProvider(
  provider: ProviderConfig,
  secrets: { apiKey: string; secondaryKey?: string },
  req: VerificationRequest
): Promise<VerificationResponse> {
  const vars: Record<string, string> = {
    barcode: req.barcode ?? "",
    artist: req.artist,
    venue: req.venue,
    date: req.date,
    time: req.time ?? "",
    section: req.section ?? "",
    row: req.row ?? "",
    seat: req.seat ?? "",
  };

  let url = `${provider.baseUrl}${provider.verifyEndpoint}`;
  const headers = buildAuthHeaders(provider, secrets.apiKey, secrets.secondaryKey);

  if (provider.authType === "query") {
    url += `${url.includes("?") ? "&" : "?"}${provider.authHeaderName}=${encodeURIComponent(secrets.apiKey)}`;
  }

  const body = renderTemplate(provider.requestBodyTemplate, vars);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`${provider.name} API error: HTTP ${response.status}`);
  }

  const data: Record<string, unknown> = await response.json();
  const isValid = Boolean(resolvePath(data, provider.responseValidField));

  return {
    verified: isValid,
    confidence: isValid ? 100 : 0,
    status: isValid ? "verified" : "rejected",
    matchedFields: isValid ? ["barcode", "artist", "venue", "date"] : [],
    unmatchedFields: isValid ? [] : ["barcode"],
    details: { ticketingSystem: provider.name },
    reason: isValid
      ? `כרטיס אומת בהצלחה על ידי ${provider.name}`
      : `הכרטיס לא אומת על ידי ${provider.name}`,
    timestamp: new Date().toISOString(),
  };
}

// ─── Demo / mock verification ────────────────────────────────────────────────

async function fetchMockVenueData(): Promise<OfficialTicket[]> {
  // Load Firestore-stored mock tickets (added when real tickets are published)
  const firestoreMockTickets: OfficialTicket[] = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection("mock_tickets").get();
      snap.forEach((doc) => {
        const d = doc.data();
        firestoreMockTickets.push({
          ticketId: doc.id,
          barcode: d.barcode || "",
          eventId: d.eventId || "",
          eventName: d.eventName || "",
          artistName: d.artistName || "",
          venueName: d.venueName || "",
          eventDate: d.eventDate || "",
          eventTime: d.eventTime || "",
          section: d.section || "",
          row: d.row || "",
          seat: d.seat || "",
          seatType: d.seatType || "seated",
          ticketStatus: "active",
          originalPrice: d.originalPrice || 0,
          ticketingSystem: "Tiket",
        });
      });
    } catch {
      // ignore, fall through to static data
    }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/venue-api-mock.json`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      const staticTickets: OfficialTicket[] = data.official_tickets || [];
      return [...firestoreMockTickets, ...staticTickets];
    }
  } catch {
    // fall through to hardcoded
  }

  if (firestoreMockTickets.length > 0) return firestoreMockTickets;

  return [
    {
      ticketId: "LEAAN-2025-HIK-001234",
      barcode: "7290016353891",
      eventId: "EVT-HIK-5678",
      eventName: "עומר אדם - בלב שלי",
      artistName: "עומר אדם",
      venueName: "היכל מנורה מבטחים",
      eventDate: "15/03/2025",
      eventTime: "21:00",
      section: "A",
      row: "12",
      seat: "15",
      seatType: "seated",
      ticketStatus: "active",
      originalPrice: 350,
      ticketingSystem: "Leaan",
    },
    {
      ticketId: "LEAAN-2025-HIK-001236",
      barcode: "7290016353893",
      eventId: "EVT-HIK-5678",
      eventName: "עומר אדם - בלב שלי",
      artistName: "עומר אדם",
      venueName: "היכל מנורה מבטחים",
      eventDate: "15/03/2025",
      eventTime: "21:00",
      section: "STANDING",
      row: "",
      seat: "",
      seatType: "standing",
      ticketStatus: "active",
      originalPrice: 300,
      ticketingSystem: "Leaan",
    },
    {
      ticketId: "LEAAN-2025-HIK-004567",
      barcode: "7290016356345",
      eventId: "EVT-HIK-5681",
      eventName: "נועה קירל - סיבוב הופעות 2025",
      artistName: "נועה קירל",
      venueName: "היכל מנורה מבטחים",
      eventDate: "05/04/2025",
      eventTime: "21:00",
      section: "STANDING",
      row: "",
      seat: "",
      seatType: "standing",
      ticketStatus: "active",
      originalPrice: 250,
      ticketingSystem: "Leaan",
    },
  ];
}

function verifyTicketAgainstMock(
  uploaded: VerificationRequest,
  officialTickets: OfficialTicket[]
): VerificationResponse {
  let bestMatch: OfficialTicket | null = null;
  let matchScore = 0;
  let matchedFields: string[] = [];
  let unmatchedFields: string[] = [];

  const normalizeDate = (d: string) => d.replace(/\./g, "/");
  const uploadedDate = normalizeDate(uploaded.date);

  for (const official of officialTickets) {
    let currentScore = 0;
    const currentMatched: string[] = [];
    const currentUnmatched: string[] = [];

    if (uploaded.barcode && uploaded.barcode === official.barcode) {
      currentScore += 40;
      currentMatched.push("barcode");
    } else if (uploaded.barcode) {
      currentUnmatched.push("barcode");
    }

    const artistMatch =
      normalizeString(uploaded.artist).includes(normalizeString(official.artistName)) ||
      normalizeString(official.artistName).includes(normalizeString(uploaded.artist));
    if (artistMatch) { currentScore += 20; currentMatched.push("artist"); }
    else { currentUnmatched.push("artist"); }

    if (uploadedDate === normalizeDate(official.eventDate)) {
      currentScore += 20; currentMatched.push("date");
    } else { currentUnmatched.push("date"); }

    const venueMatch =
      normalizeString(uploaded.venue).includes(normalizeString(official.venueName)) ||
      normalizeString(official.venueName).includes(normalizeString(uploaded.venue));
    if (venueMatch) { currentScore += 15; currentMatched.push("venue"); }
    else { currentUnmatched.push("venue"); }

    if (uploaded.time && uploaded.time === official.eventTime) {
      currentScore += 5; currentMatched.push("time");
    }

    if (!uploaded.isStanding && official.seatType === "seated") {
      if (uploaded.section === official.section) { currentScore += 4; currentMatched.push("section"); }
      else if (uploaded.section) { currentUnmatched.push("section"); }
      if (uploaded.row === official.row) { currentScore += 3; currentMatched.push("row"); }
      else if (uploaded.row) { currentUnmatched.push("row"); }
      if (uploaded.seat === official.seat) { currentScore += 3; currentMatched.push("seat"); }
      else if (uploaded.seat) { currentUnmatched.push("seat"); }
    } else if (uploaded.isStanding && official.seatType === "standing") {
      currentScore += 10; currentMatched.push("seatType");
    }

    if (currentScore > matchScore) {
      matchScore = currentScore;
      bestMatch = official;
      matchedFields = currentMatched;
      unmatchedFields = currentUnmatched;
    }
  }

  const confidence = Math.min(matchScore, 100);
  let status: "verified" | "needs_review" | "rejected";
  let reason: string;

  if (confidence >= 90) {
    status = "verified";
    reason = `כרטיס אומת בהצלחה! תואם ${matchedFields.length} שדות במערכת ${bestMatch?.ticketingSystem}`;
  } else if (confidence >= 40) {
    status = "needs_review";
    reason = matchedFields.length > 0
      ? `התאמה חלקית - נדרשת בדיקה ידנית. תואם: ${matchedFields.join(", ")}`
      : `הכרטיס לא נמצא במאגר האולמות - נדרשת בדיקה ידנית`;
  } else {
    status = "needs_review";
    reason = `הכרטיס לא נמצא במאגר האולמות - נדרשת בדיקה ידנית של מנהל`;
  }

  return {
    verified: status === "verified",
    confidence,
    status,
    matchedFields,
    unmatchedFields,
    details: bestMatch
      ? {
          officialTicketId: bestMatch.ticketId,
          eventId: bestMatch.eventId,
          ticketingSystem: bestMatch.ticketingSystem,
          originalPrice: bestMatch.originalPrice,
        }
      : undefined,
    reason,
    timestamp: new Date().toISOString(),
  };
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: VerificationRequest = await request.json();

    console.log("🔍 Venue Verification Request:", {
      artist: body.artist,
      venue: body.venue,
      date: body.date,
      hasBarcode: !!body.barcode,
    });

    if (!body.artist || !body.venue || !body.date) {
      return NextResponse.json(
        {
          verified: false,
          confidence: 0,
          status: "rejected",
          matchedFields: [],
          unmatchedFields: ["artist", "venue", "date"],
          reason: "Missing required fields for verification",
          timestamp: new Date().toISOString(),
        } as VerificationResponse,
        { status: 400 }
      );
    }

    // ── Load provider configs from Firestore ──
    let providers: ProviderConfig[] = [];
    let demoEnabled = true; // safe default

    if (adminDb) {
      try {
        const snap = await adminDb.collection("venue_api_providers").where("enabled", "==", true).get();
        for (const doc of snap.docs) {
          const d = doc.data();
          const cfg: ProviderConfig = {
            id: doc.id,
            name: d.name,
            type: d.type || "real",
            baseUrl: d.baseUrl || "",
            verifyEndpoint: d.verifyEndpoint || "",
            authType: d.authType || "bearer",
            authHeaderName: d.authHeaderName || "Authorization",
            secondaryCredentialHeaderName: d.secondaryCredentialHeaderName || "",
            requestBodyTemplate: d.requestBodyTemplate || "",
            responseValidField: d.responseValidField || "valid",
            barcodePattern: d.barcodePattern || "",
            enabled: d.enabled,
          };
          if (cfg.type === "builtin_demo") {
            demoEnabled = true;
          } else {
            providers.push(cfg);
          }
        }

        // Check if demo is explicitly disabled
        const demoSnap = await adminDb.collection("venue_api_providers").doc("demo").get();
        if (demoSnap.exists) {
          demoEnabled = demoSnap.data()?.enabled !== false;
        }
      } catch (err) {
        console.warn("Could not load providers from Firestore, using demo fallback:", err);
        demoEnabled = true;
      }
    }

    // ── Filter by barcode pattern if applicable ──
    let matchedProviders = providers;
    if (body.barcode) {
      const patternMatched = providers.filter((p) => {
        if (!p.barcodePattern) return false;
        try { return new RegExp(p.barcodePattern).test(body.barcode!); } catch { return false; }
      });
      if (patternMatched.length > 0) matchedProviders = patternMatched;
    }

    // ── Try real providers first ──
    for (const provider of matchedProviders) {
      try {
        const secretDoc = await adminDb?.collection("venue_api_secrets").doc(provider.id).get();
        const secrets = {
          apiKey: secretDoc?.data()?.apiKey || "",
          secondaryKey: secretDoc?.data()?.secondaryKey || undefined,
        };

        const result = await callRealProvider(provider, secrets, body);
        console.log(`✅ Provider ${provider.name} result:`, result.status);

        if (result.verified) return NextResponse.json(result, { status: 200 });
        // If rejected by this provider, continue to next
      } catch (err) {
        console.error(`❌ Provider ${provider.name} error:`, err);
        // Continue to next provider
      }
    }

    // ── Fall back to demo mode ──
    if (demoEnabled || providers.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));
      const mockData = await fetchMockVenueData();
      const result = verifyTicketAgainstMock(body, mockData);
      console.log("✅ Demo verification result:", result.status);
      return NextResponse.json(result, { status: 200 });
    }

    // No provider verified and demo is off
    return NextResponse.json(
      {
        verified: false,
        confidence: 0,
        status: "needs_review",
        matchedFields: [],
        unmatchedFields: [],
        reason: "הכרטיס לא אומת על ידי אף ספק — נדרשת בדיקה ידנית",
        timestamp: new Date().toISOString(),
      } as VerificationResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Verification Error:", error);
    return NextResponse.json(
      {
        verified: false,
        confidence: 0,
        status: "needs_review",
        matchedFields: [],
        unmatchedFields: [],
        reason: "שירות האימות אינו זמין זמנית — נדרשת בדיקה ידנית",
        timestamp: new Date().toISOString(),
      } as VerificationResponse,
      { status: 200 }
    );
  }
}
