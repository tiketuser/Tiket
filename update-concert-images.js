const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./creds.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Artist name mapping (filename -> artist name in Firestore)
const artistMapping = {
  'Alma_Gov.png': ['עלמה זהר', 'עלמה גוב', 'Alma Zohar', 'Alma Gov', 'עלמה'],
  'fatelnavi.png': ['פאטן נבי', 'Faten Navi', 'פאטל נבי'],
  'gayaviv.png': ['גיא אביב', 'Guy Aviv', 'גאיה ויב'],
  'Keren_Peles.png': ['כרן פלס', 'Keren Peles', 'קרן פלס'],
  'mcbenny.png': ['מק בני', 'MC Benny', 'mcbenny'],
  'Noa_Kirel.png': ['נועה קירל', 'Noa Kirel', 'נוע קירל'],
  'ofekrap.png': ['אופק רפ', 'Ofek Rap', 'אופק'],
  'Omer_Adam.png': ['עומר אדם', 'Omer Adam', 'אומר אדם'],
  'Ravid_Plotnik.png': ['רביד פלוטניק', 'Ravid Plotnik', 'רוויד פלוטניק'],
  'Ron_Asael.png': ['רון אסעל', 'Ron Asael', 'רון עשהאל'],
  'Shlomo_Artzi.png': ['שלמה ארצי', 'Shlomo Artzi', 'שלומו ארצי'],
  'Tuna.png': ['טונה', 'Tuna', 'תונה']
};

// Convert image to base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error(`Error reading image ${imagePath}:`, error.message);
    return null;
  }
}

// Check if artist name matches
function matchesArtist(concertArtist, possibleNames) {
  const normalizedConcert = concertArtist.toLowerCase().trim();
  return possibleNames.some(name => {
    const normalized = name.toLowerCase().trim();
    return normalizedConcert.includes(normalized) || normalized.includes(normalizedConcert);
  });
}

async function updateConcertImages() {
  console.log('🎭 Starting concert image update...\n');

  try {
    // Get all concerts
    const concertsSnapshot = await db.collection('concerts').get();
    
    if (concertsSnapshot.empty) {
      console.log('❌ No concerts found in database!');
      console.log('💡 Please run migration or create concerts first.\n');
      return;
    }

    console.log(`📊 Found ${concertsSnapshot.size} concerts\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;

    // Process each concert
    for (const doc of concertsSnapshot.docs) {
      const concert = doc.data();
      const concertId = doc.id;
      const artistName = concert.artist;

      console.log(`\n🎤 Processing: ${artistName}`);

      // Check if already has image
      if (concert.imageData && concert.imageData.startsWith('data:image')) {
        console.log(`   ⏭️  Already has image - skipping`);
        skippedCount++;
        continue;
      }

      // Find matching image
      let matchedImage = null;
      let matchedFilename = null;

      for (const [filename, possibleNames] of Object.entries(artistMapping)) {
        if (matchesArtist(artistName, possibleNames)) {
          matchedImage = filename;
          matchedFilename = filename;
          break;
        }
      }

      if (!matchedImage) {
        console.log(`   ❌ No matching image found`);
        notFoundCount++;
        continue;
      }

      // Convert image to base64
      const imagePath = path.join(__dirname, 'public', 'images', 'Artist', matchedImage);
      console.log(`   📁 Reading: ${matchedFilename}`);
      
      const base64Image = imageToBase64(imagePath);

      if (!base64Image) {
        console.log(`   ❌ Failed to convert image`);
        notFoundCount++;
        continue;
      }

      // Update concert in Firestore
      await db.collection('concerts').doc(concertId).update({
        imageData: base64Image
      });

      console.log(`   ✅ Updated successfully!`);
      updatedCount++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updatedCount} concerts`);
    console.log(`⏭️  Skipped (already has image): ${skippedCount} concerts`);
    console.log(`❌ Not found: ${notFoundCount} concerts`);
    console.log(`📋 Total processed: ${concertsSnapshot.size} concerts`);
    console.log('='.repeat(50) + '\n');

    if (notFoundCount > 0) {
      console.log('💡 TIP: For concerts without matching images:');
      console.log('   - Add them manually via /Admin page');
      console.log('   - Or add the mapping in the script\n');
    }

  } catch (error) {
    console.error('❌ Error updating concerts:', error);
  }
}

// Run the script
updateConcertImages()
  .then(() => {
    console.log('✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
