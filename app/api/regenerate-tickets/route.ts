import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { 
  collection, 
  getDocs, 
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Helper function to generate realistic tickets for a concert
function generateTicketsForConcert(concert: any, count: number) {
  const tickets = [];
  const sections = ['A', 'B', 'C', 'D', 'VIP', 'Gold', 'Silver'];
  const venues: any = {
    'פארק הירקון': { rows: 50, seatsPerRow: 30, hasStanding: true },
    'היכל מנורה': { rows: 40, seatsPerRow: 40, hasStanding: false },
    'אולם התאומים': { rows: 30, seatsPerRow: 35, hasStanding: false },
    'בלומפילד': { rows: 60, seatsPerRow: 50, hasStanding: true },
    'גני יהושע': { rows: 80, seatsPerRow: 40, hasStanding: true },
    'קיסריה אמפיתאטרון': { rows: 35, seatsPerRow: 30, hasStanding: false },
  };

  const venueInfo = venues[concert.venue] || { rows: 40, seatsPerRow: 30, hasStanding: true };
  
  // Price tiers based on section
  const priceTiers: any = {
    'VIP': { base: 800, variance: 200 },
    'Gold': { base: 600, variance: 150 },
    'A': { base: 400, variance: 100 },
    'B': { base: 300, variance: 80 },
    'C': { base: 250, variance: 60 },
    'Silver': { base: 200, variance: 50 },
    'D': { base: 150, variance: 40 },
  };

  // Generate a mix of ticket types
  const standingCount = venueInfo.hasStanding ? Math.floor(count * 0.2) : 0; // 20% standing
  const seatedCount = count - standingCount;

  // Generate standing tickets
  for (let i = 0; i < standingCount; i++) {
    const section = Math.random() > 0.5 ? 'A' : 'B';
    const tier = priceTiers[section];
    const originalPrice = tier.base + Math.floor(Math.random() * tier.variance);
    const discountPercent = Math.random() * 0.3; // 0-30% discount
    const askingPrice = Math.floor(originalPrice * (1 - discountPercent));

    tickets.push({
      concertId: concert.id,
      artist: concert.artist,
      date: concert.date,
      venue: concert.venue,
      time: concert.time || '20:00',
      isStanding: true,
      section: section,
      row: null,
      seat: null,
      askingPrice: askingPrice,
      originalPrice: originalPrice,
      status: 'available',
      sellerId: 'admin_generated',
      createdAt: serverTimestamp(),
    });
  }

  // Generate seated tickets
  const usedSeats = new Set();
  for (let i = 0; i < seatedCount; i++) {
    const section = sections[Math.floor(Math.random() * sections.length)];
    const tier = priceTiers[section] || priceTiers['C'];
    
    // Generate unique seat
    let row, seat, seatKey;
    do {
      row = Math.floor(Math.random() * venueInfo.rows) + 1;
      seat = Math.floor(Math.random() * venueInfo.seatsPerRow) + 1;
      seatKey = `${section}-${row}-${seat}`;
    } while (usedSeats.has(seatKey));
    usedSeats.add(seatKey);

    const originalPrice = tier.base + Math.floor(Math.random() * tier.variance);
    const discountPercent = Math.random() * 0.35; // 0-35% discount
    const askingPrice = Math.floor(originalPrice * (1 - discountPercent));

    tickets.push({
      concertId: concert.id,
      artist: concert.artist,
      date: concert.date,
      venue: concert.venue,
      time: concert.time || '20:00',
      isStanding: false,
      section: section,
      row: row,
      seat: seat,
      askingPrice: askingPrice,
      originalPrice: originalPrice,
      status: 'available',
      sellerId: 'admin_generated',
      createdAt: serverTimestamp(),
    });
  }

  return tickets;
}

export async function POST() {
  try {
    console.log('🎫 Starting Ticket Regeneration Process...');

    // Step 1: Fetch all concerts
    console.log('📖 Fetching all concerts...');
    const concertsSnapshot = await getDocs(collection(db as any, 'concerts'));
    const concerts: any[] = [];
    
    concertsSnapshot.forEach(doc => {
      concerts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${concerts.length} concerts`);

    if (concerts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No concerts found! Please create concerts first.',
      }, { status: 400 });
    }

    // Step 2: Delete all existing tickets
    console.log('🗑️  Deleting all existing tickets...');
    const ticketsSnapshot = await getDocs(collection(db as any, 'tickets'));
    const deleteCount = ticketsSnapshot.size;
    
    if (deleteCount > 0) {
      const deletePromises = ticketsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${deleteCount} old tickets`);
    } else {
      console.log('✅ No existing tickets to delete');
    }

    // Step 3: Generate new tickets for each concert
    console.log('🎟️  Generating new tickets for each concert...');
    let totalTicketsCreated = 0;
    const concertDetails: any[] = [];

    for (const concert of concerts) {
      // Generate 5-20 tickets per concert
      const ticketCount = Math.floor(Math.random() * 16) + 5; // 5 to 20 tickets
      const tickets = generateTicketsForConcert(concert, ticketCount);

      console.log(`   Creating ${ticketCount} tickets for: ${concert.artist}`);
      
      // Price range for this concert
      const prices = tickets.map(t => t.askingPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      console.log(`   💰 Price range: ₪${minPrice} - ₪${maxPrice}`);

      // Add tickets to Firestore
      const addPromises = tickets.map(ticket => 
        addDoc(collection(db as any, 'tickets'), ticket)
      );
      await Promise.all(addPromises);

      totalTicketsCreated += ticketCount;
      
      concertDetails.push({
        artist: concert.artist,
        date: concert.date,
        venue: concert.venue,
        ticketCount: ticketCount,
        priceRange: `₪${minPrice} - ₪${maxPrice}`,
      });
    }

    // Final summary
    const summary = {
      success: true,
      concerts: concerts.length,
      oldTicketsDeleted: deleteCount,
      newTicketsCreated: totalTicketsCreated,
      averagePerConcert: Math.round(totalTicketsCreated / concerts.length),
      concertDetails: concertDetails,
    };

    console.log('✨ TICKET REGENERATION COMPLETE!');
    console.log(summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Error during ticket regeneration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
