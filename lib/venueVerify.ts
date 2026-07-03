import { adminDb } from "./firebaseAdmin";

/**
 * Shared venue ticket verification logic.
 *
 * Extracted from app/api/venue-verify so it can be invoked server-side (e.g.
 * from /api/create-ticket) without an internal HTTP round-trip. The status
 * decision made here is authoritative — clients never get to declare their own
 * verification result.
 */

export interface VerificationRequest {
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
  _testProviderId?: string;
}

export interface OfficialTicket {
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

export interface VerificationResponse {
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

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

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

  if (provider.secondaryCredentialHeaderName && secondaryKey) {
    headers[provider.secondaryCredentialHeaderName] = secondaryKey;
  }

  return headers;
}

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

  // The static mock file is a development-only fixture. Loading it in
  // production would let anyone read known-good barcodes from a public URL and
  // replay them to force a "verified" result, so it is gated to non-production.
  if (process.env.NODE_ENV !== "production") {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/venue-api-mock.json`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const staticTickets: OfficialTicket[] = data.official_tickets || [];
        return [...firestoreMockTickets, ...staticTickets];
      }
    } catch {
      // fall through
    }
  }

  return firestoreMockTickets;
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

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * Run authoritative server-side verification for a ticket. Tries configured
 * real providers first, then falls back to demo/mock matching.
 */
export async function verifyTicket(body: VerificationRequest): Promise<VerificationResponse> {
  if (!body.artist || !body.venue || !body.date) {
    return {
      verified: false,
      confidence: 0,
      status: "rejected",
      matchedFields: [],
      unmatchedFields: ["artist", "venue", "date"],
      reason: "Missing required fields for verification",
      timestamp: new Date().toISOString(),
    };
  }

  const providers: ProviderConfig[] = [];
  let demoEnabled = true; // safe default

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection("venue_api_providers")
        .where("enabled", "==", true)
        .get();
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

      const demoSnap = await adminDb.collection("venue_api_providers").doc("demo").get();
      if (demoSnap.exists) {
        demoEnabled = demoSnap.data()?.enabled !== false;
      }
    } catch (err) {
      console.warn("Could not load providers from Firestore, using demo fallback:", err);
      demoEnabled = true;
    }
  }

  // Filter by barcode pattern if applicable
  let matchedProviders = providers;
  if (body.barcode) {
    const patternMatched = providers.filter((p) => {
      if (!p.barcodePattern) return false;
      try { return new RegExp(p.barcodePattern).test(body.barcode!); } catch { return false; }
    });
    if (patternMatched.length > 0) matchedProviders = patternMatched;
  }

  // Try real providers first
  let providerRejected = false;
  for (const provider of matchedProviders) {
    try {
      const secretDoc = await adminDb?.collection("venue_api_secrets").doc(provider.id).get();
      const secrets = {
        apiKey: secretDoc?.data()?.apiKey || "",
        secondaryKey: secretDoc?.data()?.secondaryKey || undefined,
      };

      const result = await callRealProvider(provider, secrets, body);
      if (result.verified) return result;
      // A real provider that explicitly says "not valid" is a hard rejection —
      // remember it so we don't silently paper over it with the demo fallback.
      providerRejected = true;
    } catch (err) {
      console.error(`Provider ${provider.name} error:`, err);
    }
  }

  // If a real provider explicitly rejected the barcode, honor that instead of
  // falling through to demo matching.
  if (providerRejected) {
    return {
      verified: false,
      confidence: 0,
      status: "rejected",
      matchedFields: [],
      unmatchedFields: ["barcode"],
      reason: "הכרטיס נדחה על ידי ספק הכרטוס הרשמי",
      timestamp: new Date().toISOString(),
    };
  }

  // Fall back to demo mode
  if (demoEnabled || providers.length === 0) {
    const mockData = await fetchMockVenueData();
    return verifyTicketAgainstMock(body, mockData);
  }

  return {
    verified: false,
    confidence: 0,
    status: "needs_review",
    matchedFields: [],
    unmatchedFields: [],
    reason: "הכרטיס לא אומת על ידי אף ספק — נדרשת בדיקה ידנית",
    timestamp: new Date().toISOString(),
  };
}
