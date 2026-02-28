import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

const ADMIN_SELLER_ID = 'XzttD4gMV6TRxUUZGBTXxYiZtP02';

function generateTicketsForEvent(event: any, count: number) {
  const sections = ['A', 'B', 'C', 'D', 'VIP', 'Gold', 'Silver'];
  const venues: any = {
    'פארק הירקון': { rows: 50, seatsPerRow: 30, hasStanding: true },
    'היכל מנורה': { rows: 40, seatsPerRow: 40, hasStanding: false },
    'אולם התאומים': { rows: 30, seatsPerRow: 35, hasStanding: false },
    'בלומפילד': { rows: 60, seatsPerRow: 50, hasStanding: true },
    'גני יהושע': { rows: 80, seatsPerRow: 40, hasStanding: true },
    'קיסריה אמפיתאטרון': { rows: 35, seatsPerRow: 30, hasStanding: false },
  };

  const venueInfo = venues[event.venue] || { rows: 40, seatsPerRow: 30, hasStanding: true };

  const priceTiers: any = {
    'VIP': { base: 800, variance: 200 },
    'Gold': { base: 600, variance: 150 },
    'A': { base: 400, variance: 100 },
    'B': { base: 300, variance: 80 },
    'C': { base: 250, variance: 60 },
    'Silver': { base: 200, variance: 50 },
    'D': { base: 150, variance: 40 },
  };

  // Build individual ticket specs (seat assignments)
  interface TicketSpec {
    isStanding: boolean;
    section: string;
    row: number | null;
    seat: number | null;
    originalPrice: number;
    askingPrice: number;
  }

  const specs: TicketSpec[] = [];
  const standingCount = venueInfo.hasStanding ? Math.floor(count * 0.2) : 0;
  const seatedCount = count - standingCount;

  for (let i = 0; i < standingCount; i++) {
    const section = Math.random() > 0.5 ? 'A' : 'B';
    const tier = priceTiers[section];
    const originalPrice = tier.base + Math.floor(Math.random() * tier.variance);
    specs.push({ isStanding: true, section, row: null, seat: null, originalPrice, askingPrice: Math.floor(originalPrice * (1 - Math.random() * 0.3)) });
  }

  const usedSeats = new Set<string>();
  for (let i = 0; i < seatedCount; i++) {
    const section = sections[Math.floor(Math.random() * sections.length)];
    const tier = priceTiers[section] || priceTiers['C'];
    let row: number, seat: number, seatKey: string;
    do {
      row = Math.floor(Math.random() * venueInfo.rows) + 1;
      seat = Math.floor(Math.random() * venueInfo.seatsPerRow) + 1;
      seatKey = `${section}-${row}-${seat}`;
    } while (usedSeats.has(seatKey));
    usedSeats.add(seatKey);
    const originalPrice = tier.base + Math.floor(Math.random() * tier.variance);
    specs.push({ isStanding: false, section, row, seat, originalPrice, askingPrice: Math.floor(originalPrice * (1 - Math.random() * 0.35)) });
  }

  // Assign some specs to bundles (~30% of tickets become part of bundles of 2-4)
  const assigned = new Array(specs.length).fill(false);
  const bundleAssignments: Array<string | null> = new Array(specs.length).fill(null);
  const bundleSizes: Array<number | null> = new Array(specs.length).fill(null);
  const canSplits: Array<boolean | null> = new Array(specs.length).fill(null);

  let i = 0;
  while (i < specs.length) {
    if (!assigned[i] && Math.random() < 0.3 && i + 1 < specs.length) {
      const bundleSize = Math.min(2 + Math.floor(Math.random() * 3), specs.length - i); // 2-4 tickets
      const bundleId = randomUUID();
      const canSplit = Math.random() > 0.5;
      for (let j = i; j < i + bundleSize; j++) {
        assigned[j] = true;
        bundleAssignments[j] = bundleId;
        bundleSizes[j] = bundleSize;
        canSplits[j] = canSplit;
      }
      i += bundleSize;
    } else {
      assigned[i] = true;
      i++;
    }
  }

  // Build final ticket objects
  return specs.map((spec, idx) => ({
    concertId: event.id,
    artist: event.artist,
    category: event.category || 'מוזיקה',
    date: event.date,
    venue: event.venue,
    time: event.time || '20:00',
    isStanding: spec.isStanding,
    section: spec.section,
    row: spec.row,
    seat: spec.seat,
    barcode: null,
    askingPrice: spec.askingPrice,
    originalPrice: spec.originalPrice,
    bundleId: bundleAssignments[idx],
    bundleSize: bundleSizes[idx],
    canSplit: canSplits[idx],
    status: 'available',
    verificationStatus: 'verified',
    verificationConfidence: 100,
    verificationDetails: {
      matchedFields: spec.isStanding
        ? ['artist', 'venue', 'date', 'section']
        : ['artist', 'venue', 'date', 'section', 'row', 'seat'],
      unmatchedFields: [],
      officialTicketId: null,
      eventId: null,
      ticketingSystem: 'admin_generated',
      reason: 'Admin generated ticket - auto-verified',
    },
    verificationTimestamp: FieldValue.serverTimestamp(),
    sellerId: ADMIN_SELLER_ID,
    createdAt: FieldValue.serverTimestamp(),
  }));
}

export async function POST() {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    console.log('🎫 Starting Ticket Regeneration Process...');

    const eventsSnapshot = await adminDb.collection('events').get();
    const events: any[] = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`✅ Found ${events.length} events`);
    if (events.length === 0) {
      return NextResponse.json({ success: false, error: 'No events found! Please create events first.' }, { status: 400 });
    }

    const ticketsSnapshot = await adminDb.collection('tickets').get();
    const deleteCount = ticketsSnapshot.size;
    if (deleteCount > 0) {
      await Promise.all(ticketsSnapshot.docs.map(doc => doc.ref.delete()));
      console.log(`✅ Deleted ${deleteCount} old tickets`);
    }

    let totalTicketsCreated = 0;
    let totalBundlesCreated = 0;
    const concertDetails: any[] = [];

    for (const event of events) {
      const ticketCount = Math.floor(Math.random() * 16) + 5;
      const tickets = generateTicketsForEvent(event, ticketCount);
      const prices = tickets.map(t => t.askingPrice);
      const bundleCount = new Set(tickets.map(t => t.bundleId).filter(Boolean)).size;
      await Promise.all(tickets.map(ticket => adminDb!.collection('tickets').add(ticket)));
      totalTicketsCreated += tickets.length;
      totalBundlesCreated += bundleCount;
      concertDetails.push({
        artist: event.artist,
        date: event.date,
        venue: event.venue,
        ticketCount: tickets.length,
        bundleCount,
        priceRange: `₪${Math.min(...prices)} - ₪${Math.max(...prices)}`,
      });
    }

    const summary = {
      success: true,
      concerts: events.length,
      oldTicketsDeleted: deleteCount,
      newTicketsCreated: totalTicketsCreated,
      bundlesCreated: totalBundlesCreated,
      averagePerConcert: Math.round(totalTicketsCreated / events.length),
      concertDetails,
    };

    console.log('✨ TICKET REGENERATION COMPLETE!', summary);
    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Error during ticket regeneration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
