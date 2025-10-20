import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../firebase";
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
 * POST /api/migrate-to-concerts
 * 
 * Converts existing tickets to concerts + tickets structure
 */

export async function POST(request: NextRequest) {
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

    // Step 2: Group by concert
    const concertMap = new Map();

    oldTickets.forEach((ticket: any) => {
      const key = `${ticket.artist || "Unknown"}_${ticket.date || "No Date"}_${
        ticket.venue || "Unknown Venue"
      }`;

      if (!concertMap.has(key)) {
        concertMap.set(key, {
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

    console.log(`Identified ${concertMap.size} unique concerts`);

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

    // Step 4: Create concerts and collect their IDs
    const concertIds = new Map();

    for (const [key, concertData] of concertMap) {
      const concertRef = await addDoc(
        collection(db, "concerts"),
        concertData as any
      );
      concertIds.set(key, concertRef.id);
    }

    console.log(`Created ${concertIds.size} concerts`);

    // Step 5: Generate tickets for each concert
    const sections = ["A", "B", "C", "D", "VIP"];
    let totalTickets = 0;

    for (const [key, concertId] of concertIds) {
      const concert: any = concertMap.get(key);
      const ticketCount = Math.floor(Math.random() * 8) + 3; // 3-10 tickets

      for (let i = 0; i < ticketCount; i++) {
        const isStanding = Math.random() > 0.7; // 30% standing
        const basePrice = Math.floor(Math.random() * 300) + 150;
        const discount = Math.random() * 0.4;
        const askingPrice = Math.floor(basePrice * (1 - discount));

        const ticket: any = {
          concertId,
          artist: concert.artist,
          date: concert.date,
          venue: concert.venue,
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
          concertsCreated: concertIds.size,
          newTicketsGenerated: totalTickets,
          averageTicketsPerConcert: Math.floor(totalTickets / concertIds.size),
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
