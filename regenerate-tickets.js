/**
 * Regenerate Tickets Script
 * 
 * This script will:
 * 1. Fetch all existing concerts from Firestore
 * 2. Delete ALL existing tickets
 * 3. Generate new realistic tickets for each concert (5-20 per concert)
 * 
 * Run with: node regenerate-tickets.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./creds.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to generate realistic tickets for a concert
function generateTicketsForConcert(concert, count) {
  const tickets = [];
  const sections = ['A', 'B', 'C', 'D', 'VIP', 'Gold', 'Silver'];
  const venues = {
    'פארק הירקון': { rows: 50, seatsPerRow: 30, hasStanding: true },
    'היכל מנורה': { rows: 40, seatsPerRow: 40, hasStanding: false },
    'אולם התאומים': { rows: 30, seatsPerRow: 35, hasStanding: false },
    'בלומפילד': { rows: 60, seatsPerRow: 50, hasStanding: true },
    'גני יהושע': { rows: 80, seatsPerRow: 40, hasStanding: true },
    'קיסריה אמפיתאטרון': { rows: 35, seatsPerRow: 30, hasStanding: false },
  };

  const venueInfo = venues[concert.venue] || { rows: 40, seatsPerRow: 30, hasStanding: true };
  
  // Price tiers based on section
  const priceTiers = {
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return tickets;
}

async function regenerateTickets() {
  try {
    console.log('🎫 Starting Ticket Regeneration Process...\n');

    // Step 1: Fetch all concerts
    console.log('📖 Fetching all concerts...');
    const concertsSnapshot = await db.collection('concerts').get();
    const concerts = [];
    
    concertsSnapshot.forEach(doc => {
      concerts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${concerts.length} concerts\n`);

    if (concerts.length === 0) {
      console.log('❌ No concerts found! Please create concerts first.');
      return;
    }

    // Display concerts
    console.log('📋 Concerts found:');
    concerts.forEach((concert, index) => {
      console.log(`   ${index + 1}. ${concert.artist} - ${concert.date} @ ${concert.venue}`);
    });
    console.log('');

    // Step 2: Delete all existing tickets
    console.log('🗑️  Deleting all existing tickets...');
    const ticketsSnapshot = await db.collection('tickets').get();
    const deleteCount = ticketsSnapshot.size;
    
    if (deleteCount > 0) {
      const batch = db.batch();
      ticketsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${deleteCount} old tickets\n`);
    } else {
      console.log('✅ No existing tickets to delete\n');
    }

    // Step 3: Generate new tickets for each concert
    console.log('🎟️  Generating new tickets for each concert...\n');
    let totalTicketsCreated = 0;

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
      const batch = db.batch();
      tickets.forEach(ticket => {
        const ticketRef = db.collection('tickets').doc();
        batch.set(ticketRef, ticket);
      });
      await batch.commit();

      totalTicketsCreated += ticketCount;
      console.log(`   ✅ Done!\n`);
    }

    // Final summary
    console.log('═══════════════════════════════════════════');
    console.log('✨ TICKET REGENERATION COMPLETE! ✨');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   - Concerts: ${concerts.length}`);
    console.log(`   - Old tickets deleted: ${deleteCount}`);
    console.log(`   - New tickets created: ${totalTicketsCreated}`);
    console.log(`   - Average per concert: ${Math.round(totalTicketsCreated / concerts.length)}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('🎉 You can now view the updated Gallery!\n');

  } catch (error) {
    console.error('❌ Error during ticket regeneration:', error);
    throw error;
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the regeneration
regenerateTickets();
