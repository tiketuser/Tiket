/**
 * Migration Script: Convert Tickets to Concerts
 * 
 * This script will:
 * 1. Read all existing documents from 'tickets' collection
 * 2. Create unique concerts based on artist + date + venue
 * 3. Create the 'concerts' collection with concert documents
 * 4. Generate 3-10 random tickets for each concert
 * 5. Create the new 'tickets' collection with ticket documents
 * 6. Optionally backup old data to 'tickets_backup'
 * 
 * Run with: node migrate-to-concerts.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./creds.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to generate random tickets for a concert
function generateRandomTickets(concert, count) {
  const tickets = [];
  const sections = ['A', 'B', 'C', 'D', 'VIP'];
  const ticketTypes = [
    { isStanding: false, hasSeats: true },
    { isStanding: true, hasSeats: false }
  ];

  for (let i = 0; i < count; i++) {
    const type = ticketTypes[Math.random() > 0.3 ? 0 : 1]; // 70% seated, 30% standing
    
    const basePrice = concert.originalPrice || Math.floor(Math.random() * 300) + 150;
    const discount = Math.random() * 0.4; // 0-40% discount
    const askingPrice = Math.floor(basePrice * (1 - discount));

    const ticket = {
      concertId: concert.id,
      artist: concert.artist,
      date: concert.date,
      venue: concert.venue,
      isStanding: type.isStanding,
      askingPrice: askingPrice,
      originalPrice: basePrice,
      status: 'available',
      sellerId: 'system_generated',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      allowPriceSuggestions: Math.random() > 0.5,
    };

    if (type.hasSeats) {
      ticket.section = sections[Math.floor(Math.random() * sections.length)];
      ticket.row = String(Math.floor(Math.random() * 30) + 1);
      ticket.seat = String(Math.floor(Math.random() * 40) + 1);
    } else {
      ticket.section = '';
      ticket.row = '';
      ticket.seat = '';
    }

    tickets.push(ticket);
  }

  return tickets;
}

async function migrateData() {
  console.log('🚀 Starting migration...\n');

  try {
    // Step 1: Read all existing tickets
    console.log('📖 Reading existing tickets...');
    const ticketsSnapshot = await db.collection('tickets').get();
    const oldTickets = ticketsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`   Found ${oldTickets.length} existing tickets\n`);

    // Step 2: Group by concert (artist + date + venue)
    console.log('🎵 Grouping tickets by concert...');
    const concertMap = new Map();

    oldTickets.forEach(ticket => {
      const key = `${ticket.artist || 'Unknown'}_${ticket.date || 'No Date'}_${ticket.venue || 'Unknown Venue'}`;
      
      if (!concertMap.has(key)) {
        concertMap.set(key, {
          artist: ticket.artist || 'Unknown Artist',
          title: ticket.title || ticket.artist || 'Unknown Concert',
          date: ticket.date || '',
          time: ticket.time || '20:00',
          venue: ticket.venue || 'Unknown Venue',
          imageData: ticket.imageData || null,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          views: 0,
          originalPrice: ticket.originalPrice || ticket.askingPrice || 250
        });
      }
    });

    console.log(`   Identified ${concertMap.size} unique concerts\n`);

    // Step 3: Backup old tickets collection
    console.log('💾 Backing up old tickets to tickets_backup...');
    const batch1 = db.batch();
    let count = 0;
    
    for (const ticket of oldTickets) {
      const backupRef = db.collection('tickets_backup').doc();
      batch1.set(backupRef, ticket);
      count++;
      
      if (count % 500 === 0) {
        await batch1.commit();
        console.log(`   Backed up ${count} tickets...`);
      }
    }
    
    if (count % 500 !== 0) {
      await batch1.commit();
    }
    console.log(`   ✅ Backed up ${count} tickets\n`);

    // Step 4: Create concerts collection
    console.log('🎪 Creating concerts collection...');
    const concertIds = new Map();
    let concertCount = 0;

    for (const [key, concertData] of concertMap) {
      const concertRef = await db.collection('concerts').add(concertData);
      concertIds.set(key, concertRef.id);
      concertCount++;
      console.log(`   Created concert ${concertCount}/${concertMap.size}: ${concertData.artist} - ${concertData.date}`);
    }
    console.log(`   ✅ Created ${concertCount} concerts\n`);

    // Step 5: Generate and create tickets for each concert
    console.log('🎟️  Generating tickets for concerts...');
    let totalTickets = 0;
    let batchCount = 0;
    let batch = db.batch();

    for (const [key, concertId] of concertIds) {
      const concert = concertMap.get(key);
      const ticketCount = Math.floor(Math.random() * 8) + 3; // 3-10 tickets per concert
      
      const tickets = generateRandomTickets({
        id: concertId,
        ...concert
      }, ticketCount);

      for (const ticket of tickets) {
        const ticketRef = db.collection('tickets').doc();
        batch.set(ticketRef, ticket);
        totalTickets++;
        batchCount++;

        // Commit every 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`   Generated ${totalTickets} tickets...`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`   ✅ Generated ${totalTickets} tickets\n`);

    // Step 6: Summary
    console.log('📊 Migration Summary:');
    console.log(`   • Old tickets backed up: ${oldTickets.length}`);
    console.log(`   • Concerts created: ${concertCount}`);
    console.log(`   • New tickets generated: ${totalTickets}`);
    console.log(`   • Average tickets per concert: ${Math.floor(totalTickets / concertCount)}`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  Note: Old tickets are in "tickets_backup" collection');
    console.log('   You can delete this collection once you verify everything works.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migrateData();
