// app/api/check-duplicate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../firebase";
import { collection, query, where, getDocs, or } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, artist, venue, date, time } = body;

    console.log("🔍 Checking for duplicate tickets with:", {
      barcode,
      artist,
      venue,
      date,
      time,
    });

    if (!db) {
      console.error("Firebase not initialized");
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Normalize strings for consistent matching
    const normalizeString = (str: string | null | undefined): string => {
      if (!str) return "";
      return str.trim().toLowerCase().replace(/\s+/g, " ");
    };

    const normalizedArtist = normalizeString(artist);
    const normalizedVenue = normalizeString(venue);
    const normalizedDate = date?.trim() || "";

    // Build array of queries to check
    const queries: any[] = [];

    // Query 1: Check for exact barcode match (if barcode exists)
    if (barcode && barcode.trim()) {
      console.log("📋 Checking for barcode match:", barcode);
      queries.push(
        query(
          collection(db, "tickets"),
          where("barcode", "==", barcode.trim())
        )
      );
    }

    // Query 2: Check for artist + venue + date + time match (exact duplicate event)
    if (normalizedArtist && normalizedVenue && normalizedDate) {
      console.log("🎫 Checking for event details match");
      // Note: Firestore queries are case-sensitive, so we'll fetch all tickets
      // and do manual filtering for better matching
    }

    let duplicates: any[] = [];

    // Check barcode duplicates
    if (queries.length > 0) {
      const barcodeQuery = queries[0];
      const barcodeSnapshot = await getDocs(barcodeQuery);

      if (!barcodeSnapshot.empty) {
        console.log(
          `⚠️ Found ${barcodeSnapshot.size} ticket(s) with same barcode`
        );
        barcodeSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          duplicates.push({
            id: doc.id,
            matchType: "barcode",
            matchedFields: ["barcode"],
            ticket: {
              artist: data.artist,
              venue: data.venue,
              date: data.date,
              time: data.time,
              barcode: data.barcode,
              seat: data.seat,
              row: data.row,
              section: data.section,
              status: data.status,
            },
          });
        });
      }
    }

    // Check event details duplicates (fetch all tickets and filter manually)
    // Now includes seat/row/section to allow multiple tickets for same event
    if (normalizedArtist && normalizedVenue && normalizedDate) {
      const allTicketsSnapshot = await getDocs(collection(db, "tickets"));

      // Get the seat details from the request
      const requestSeat = normalizeString(body.seat || "");
      const requestRow = normalizeString(body.row || "");
      const requestSection = normalizeString(body.section || "");

      allTicketsSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        const ticketArtist = normalizeString(data.artist);
        const ticketVenue = normalizeString(data.venue);
        const ticketDate = data.date?.trim() || "";
        const ticketTime = data.time?.trim() || "";
        const ticketSeat = normalizeString(data.seat || "");
        const ticketRow = normalizeString(data.row || "");
        const ticketSection = normalizeString(data.section || "");

        // Check for exact match on artist, venue, date, time, AND seat location
        const eventMatches = 
          ticketArtist === normalizedArtist &&
          ticketVenue === normalizedVenue &&
          ticketDate === normalizedDate &&
          ticketTime === (time?.trim() || "");

        const seatMatches = 
          ticketSeat === requestSeat &&
          ticketRow === requestRow &&
          ticketSection === requestSection;

        // Only flag as duplicate if BOTH event and seat location match
        if (eventMatches && seatMatches) {
          // Check if not already added by barcode match
          const alreadyAdded = duplicates.some((dup) => dup.id === doc.id);
          if (!alreadyAdded) {
            console.log(
              `⚠️ Found duplicate by event details + seat: ${doc.id}`,
              data
            );
            duplicates.push({
              id: doc.id,
              matchType: "event_details",
              matchedFields: ["artist", "venue", "date", "time", "seat", "row", "section"],
              ticket: {
                artist: data.artist,
                venue: data.venue,
                date: data.date,
                time: data.time,
                barcode: data.barcode,
                seat: data.seat,
                row: data.row,
                section: data.section,
                status: data.status,
              },
            });
          }
        }
      });
    }

    // Return results
    if (duplicates.length > 0) {
      console.log(`🚫 Found ${duplicates.length} duplicate ticket(s)`);
      return NextResponse.json({
        isDuplicate: true,
        duplicates: duplicates,
        message:
          duplicates[0].matchType === "barcode"
            ? "כרטיס עם אותו ברקוד כבר קיים במערכת"
            : "כרטיס זהה באותו מקום (שורה/מושב) כבר קיים במערכת",
      });
    }

    console.log("✅ No duplicates found");
    return NextResponse.json({
      isDuplicate: false,
      duplicates: [],
      message: "אין כרטיס כפול",
    });
  } catch (error) {
    console.error("❌ Duplicate check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check for duplicates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
