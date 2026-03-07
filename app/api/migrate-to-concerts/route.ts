import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../firebase";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Migration API Route
 * POST /api/migrate-to-events
 * 
 * Converts existing tickets to events + tickets structure
 */

export async function POST(request: NextRequest) {
  // Require admin auth — this endpoint mutates the entire database
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    console.log("Starting migration...");

    // Step 1: Read all existing tickets
    const ticketsSnapshot = await getDocs(collection(db, "tickets"));
    const oldTickets = ticketsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Found ${oldTickets.length} existing tickets`);

    // Step 2: Group by event
    const eventMap = new Map();

    oldTickets.forEach((ticket: any) => {
      const key = `${ticket.artist || "Unknown"}_${ticket.date || "No Date"}_${
        ticket.venue || "Unknown Venue"
      }`;

      if (!eventMap.has(key)) {
        eventMap.set(key, {
          artist: ticket.artist || "Unknown Artist",
          title: ticket.title || ticket.artist || "Unknown Concert",
          date: ticket.date || "",
          time: ticket.time || "20:00",
          venue: ticket.venue || "Unknown Venue",
          imageData: ticket.imageData || null,
          status: "active",
          createdAt: serverTimestamp(),
          views: 0,
        });
      }
    });

    console.log(`Identified ${eventMap.size} unique events`);

    // Step 3: Backup old tickets
    const backupBatch = writeBatch(db);
    let backupCount = 0;

    oldTickets.forEach((ticket: any) => {
      const backupRef = doc(collection(db as any, "tickets_backup"));
      backupBatch.set(backupRef, ticket);
      backupCount++;
    });

    await backupBatch.commit();
    console.log(`Backed up ${backupCount} tickets`);

    // Step 4: Create events and collect their IDs
    const eventIds = new Map();

    for (const [key, eventData] of eventMap) {
      const eventRef = await addDoc(
        collection(db, "events"),
        eventData as any
      );
      eventIds.set(key, eventRef.id);
    }

    console.log(`Created ${eventIds.size} events`);

    // Step 5: Generate tickets for each event
    const sections = ["A", "B", "C", "D", "VIP"];
    let totalTickets = 0;

    for (const [key, eventId] of eventIds) {
      const event: any = eventMap.get(key);
      const ticketCount = Math.floor(Math.random() * 8) + 3; // 3-10 tickets

      for (let i = 0; i < ticketCount; i++) {
        const isStanding = Math.random() > 0.7; // 30% standing
        const basePrice = Math.floor(Math.random() * 300) + 150;
        const discount = Math.random() * 0.4;
        const askingPrice = Math.floor(basePrice * (1 - discount));

        const ticket: any = {
          eventId,
          artist: event.artist,
          date: event.date,
          venue: event.venue,
          isStanding,
          askingPrice,
          originalPrice: basePrice,
          status: "available",
          sellerId: "system_generated",
          createdAt: serverTimestamp(),
          allowPriceSuggestions: Math.random() > 0.5,
        };

        if (!isStanding) {
          ticket.section = sections[Math.floor(Math.random() * sections.length)];
          ticket.row = String(Math.floor(Math.random() * 30) + 1);
          ticket.seat = String(Math.floor(Math.random() * 40) + 1);
        } else {
          ticket.section = "";
          ticket.row = "";
          ticket.seat = "";
        }

        await addDoc(collection(db, "tickets"), ticket);
        totalTickets++;
      }
    }

    console.log(`Generated ${totalTickets} tickets`);

    return NextResponse.json(
      {
        success: true,
        message: "Migration completed successfully",
        stats: {
          oldTicketsBackedUp: backupCount,
          eventsCreated: eventIds.size,
          newTicketsGenerated: totalTickets,
          averageTicketsPerConcert: Math.floor(totalTickets / eventIds.size),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
