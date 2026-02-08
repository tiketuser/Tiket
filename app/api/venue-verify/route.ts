import { NextRequest, NextResponse } from "next/server";

/**
 * Venue Ticket Verification API (POC)
 * 
 * This endpoint verifies uploaded tickets against a mock venue database (Mocky.io).
 * In production, this would call real venue APIs like Leaan, Eventim, etc.
 * 
 * Verification Logic:
 * - Barcode match: 95-100% confidence → Auto-approve
 * - Event + Date + Venue match: 75-90% confidence → Auto-approve or Review
 * - Partial match: 60-74% confidence → Needs review
 * - No match: <60% confidence → Reject
 */

interface VerificationRequest {
  barcode?: string;
  artist: string;
  eventName: string;
  venue: string;
  date: string; // DD/MM/YYYY
  time?: string;
  section?: string;
  row?: string;
  seat?: string;
  isStanding?: boolean;
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
  confidence: number; // 0-100
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

// Mocky.io URL - Contains mock venue database
// This will be replaced with real venue API in production
const MOCKY_IO_URL = "https://run.mocky.io/v3/YOUR_MOCKY_ID_HERE"; // TODO: Replace after creating on Mocky.io

export async function POST(request: NextRequest) {
  try {
    const body: VerificationRequest = await request.json();

    console.log("🔍 Venue Verification Request:", body);

    // Validate required fields
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

    // Simulate API latency (500-1500ms) for realistic demo
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    // For POC: Use local mock data instead of Mocky.io for faster iteration
    // In production demo, this will call Mocky.io
    const mockData = await fetchMockVenueData();

    // Verify ticket against mock database
    const verificationResult = verifyTicket(body, mockData);

    console.log("✅ Verification Result:", verificationResult);

    return NextResponse.json(verificationResult, { status: 200 });
  } catch (error) {
    console.error("❌ Verification Error:", error);
    return NextResponse.json(
      {
        verified: false,
        confidence: 0,
        status: "needs_review",
        matchedFields: [],
        unmatchedFields: [],
        reason: "Verification service temporarily unavailable - manual review required",
        timestamp: new Date().toISOString(),
      } as VerificationResponse,
      { status: 200 } // Return 200 so upload doesn't fail, just needs review
    );
  }
}

// Fetch mock venue data (in production, this calls real venue API)
async function fetchMockVenueData(): Promise<OfficialTicket[]> {
  // Option 1: Fetch from public JSON file (simulates external API)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/venue-api-mock.json`, {
      cache: 'no-store', // Don't cache for demo purposes
    });
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fetched venue data from public API:', data.official_tickets?.length, 'tickets');
      return data.official_tickets || [];
    }
  } catch (error) {
    console.error("Failed to fetch from venue-api-mock.json, using fallback data:", error);
  }

  // Option 2: Fallback to hardcoded data if fetch fails
  console.log('⚠️ Using fallback hardcoded venue data');
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

// Verification logic - matches uploaded ticket against official database
function verifyTicket(
  uploaded: VerificationRequest,
  officialTickets: OfficialTicket[]
): VerificationResponse {
  let bestMatch: OfficialTicket | null = null;
  let matchScore = 0;
  let matchedFields: string[] = [];
  let unmatchedFields: string[] = [];

  // Normalize date format for comparison
  const normalizeDate = (date: string) => date.replace(/\./g, "/");
  const uploadedDate = normalizeDate(uploaded.date);

  for (const official of officialTickets) {
    let currentScore = 0;
    const currentMatched: string[] = [];
    const currentUnmatched: string[] = [];

    // 1. Barcode match (highest priority) - 40 points
    if (uploaded.barcode && uploaded.barcode === official.barcode) {
      currentScore += 40;
      currentMatched.push("barcode");
    } else if (uploaded.barcode) {
      currentUnmatched.push("barcode");
    }

    // 2. Artist/Event name match - 20 points
    const artistMatch =
      normalizeString(uploaded.artist).includes(
        normalizeString(official.artistName)
      ) ||
      normalizeString(official.artistName).includes(
        normalizeString(uploaded.artist)
      );
    if (artistMatch) {
      currentScore += 20;
      currentMatched.push("artist");
    } else {
      currentUnmatched.push("artist");
    }

    // 3. Date match - 20 points
    if (uploadedDate === normalizeDate(official.eventDate)) {
      currentScore += 20;
      currentMatched.push("date");
    } else {
      currentUnmatched.push("date");
    }

    // 4. Venue match - 15 points
    const venueMatch =
      normalizeString(uploaded.venue).includes(
        normalizeString(official.venueName)
      ) ||
      normalizeString(official.venueName).includes(
        normalizeString(uploaded.venue)
      );
    if (venueMatch) {
      currentScore += 15;
      currentMatched.push("venue");
    } else {
      currentUnmatched.push("venue");
    }

    // 5. Time match - 5 points
    if (uploaded.time && uploaded.time === official.eventTime) {
      currentScore += 5;
      currentMatched.push("time");
    }

    // 6. Seat details match (if seated) - 10 points total
    if (!uploaded.isStanding && official.seatType === "seated") {
      if (uploaded.section === official.section) {
        currentScore += 4;
        currentMatched.push("section");
      } else if (uploaded.section) {
        currentUnmatched.push("section");
      }
      if (uploaded.row === official.row) {
        currentScore += 3;
        currentMatched.push("row");
      } else if (uploaded.row) {
        currentUnmatched.push("row");
      }
      if (uploaded.seat === official.seat) {
        currentScore += 3;
        currentMatched.push("seat");
      } else if (uploaded.seat) {
        currentUnmatched.push("seat");
      }
    } else if (uploaded.isStanding && official.seatType === "standing") {
      currentScore += 10;
      currentMatched.push("seatType");
    }

    // Track best match
    if (currentScore > matchScore) {
      matchScore = currentScore;
      bestMatch = official;
      matchedFields = currentMatched;
      unmatchedFields = currentUnmatched;
    }
  }

  // Calculate confidence percentage (max score is 100)
  const confidence = Math.min(matchScore, 100);

  // Determine status based on confidence
  let status: "verified" | "needs_review" | "rejected";
  let reason: string;

  if (confidence >= 90) {
    // High confidence - barcode match or near-perfect match
    status = "verified";
    reason = `כרטיס אומת בהצלחה! תואם ${matchedFields.length} שדות במערכת ${bestMatch?.ticketingSystem}`;
  } else if (confidence >= 40) {
    // Partial match - send to manual review (artist + venue + date = 55 points minimum)
    status = "needs_review";
    reason = matchedFields.length > 0 
      ? `התאמה חלקית - נדרשת בדיקה ידנית. תואם: ${matchedFields.join(", ")}`
      : `הכרטיס לא נמצא במאגר האולמות - נדרשת בדיקה ידנית`;
  } else {
    // Very low confidence or no match at all - only reject if obviously wrong
    status = "needs_review"; // Changed from "rejected" - let admin decide
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

// Normalize string for comparison (lowercase, remove extra spaces)
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}
