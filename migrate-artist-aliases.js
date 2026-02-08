/**
 * One-time migration script to populate Firestore with artist aliases
 * Run with: node migrate-artist-aliases.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use service account credentials if available
    const serviceAccount = require('./creds.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.log('Service account not found, using application default credentials');
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

const db = admin.firestore();

// Default artist aliases to migrate
const DEFAULT_ARTIST_ALIASES = {
  "omer adam": ["עומר אדם", "omer adam", "umeradam"],
  "static and ben el tavori": ["סטטיק ובן אל תבורי", "static and ben el", "static & ben el tavori", "סטטיק בן אל"],
  "netta barzilai": ["נטע ברזילי", "netta", "neta barzilai"],
  "eyal golan": ["אייל גולן", "eyal golan", "golan"],
  "sarit hadad": ["שרית חדד", "sarit hadad", "sarit"],
  "idan raichel": ["עידן רייכל", "idan raichel", "idan reichel"],
  "ivri lider": ["עברי לידר", "ivri lider"],
  "mashina": ["משינה", "mashina"],
  "kaveret": ["כוורת", "kaveret", "beehive"],
  "berry sakharof": ["ברי סחרוף", "berry sakharof", "berry saharof"],
  "ethnix": ["אתניקס", "ethnix"],
  "shlomo artzi": ["שלמה ארצי", "shlomo artzi"],
  "yehoram gaon": ["יהורם גאון", "yehoram gaon"],
  "rita": ["ריטה", "rita"],
  "david broza": ["דויד ברוזה", "david broza"],
  "avi bitter": ["אבי ביטר", "avi bitter", "avi biter"],
  "infected mushroom": ["infected mushroom", "אינפקטד מאשרום"],
  "subliminal": ["סאבלימינל", "subliminal"],
  "hatuna meucheret": ["חתונה מאוחרת", "hatuna meucheret"],
  "hadag nahash": ["הדג נחש", "hadag nahash", "the fish snake"],
  "dennis lloyd": ["דניס לויד", "Dennis Lloyd"],
};

async function migrateArtistAliases() {
  console.log('🚀 Starting artist aliases migration to Firestore...\n');

  try {
    const aliasCount = Object.keys(DEFAULT_ARTIST_ALIASES).length;
    console.log(`📝 Found ${aliasCount} artist aliases to migrate`);

    const batch = db.batch();
    let count = 0;

    for (const [canonical, variations] of Object.entries(DEFAULT_ARTIST_ALIASES)) {
      const aliasRef = db.collection('artist_aliases').doc(canonical);
      
      batch.set(aliasRef, {
        canonical,
        variations,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedFrom: 'artistMatcher.ts',
      });

      count++;
      console.log(`  ✓ Queued: ${canonical} (${variations.length} variations)`);
    }

    // Commit the batch
    await batch.commit();

    console.log(`\n✅ Successfully migrated ${count} artist aliases to Firestore!`);
    console.log('📍 Collection: artist_aliases');
    console.log('✨ Migration complete!\n');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateArtistAliases();
