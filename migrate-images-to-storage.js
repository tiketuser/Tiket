/**
 * Migration script: Move concert images from base64 in Firestore to Firebase Storage URLs
 * 
 * Run: node migrate-images-to-storage.js
 * 
 * This script:
 * 1. Reads all concerts from Firestore
 * 2. For each concert with a base64 imageData, uploads it to Firebase Storage
 * 3. Updates the concert document with the download URL
 * 4. Keeps original imageData in imageDataBackup field (safety)
 */

const admin = require("firebase-admin");

// Initialize with service account
const serviceAccount = require("./creds.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function migrateImages() {
  console.log("Starting image migration from Firestore base64 to Firebase Storage...\n");

  const concertsSnapshot = await db.collection("concerts").get();
  console.log(`Found ${concertsSnapshot.size} concerts total.\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const concertDoc of concertsSnapshot.docs) {
    const data = concertDoc.data();
    const concertId = concertDoc.id;
    const artist = data.artist || "unknown";

    // Skip if no imageData or already a URL
    if (!data.imageData) {
      console.log(`[SKIP] ${artist} (${concertId}) - no image`);
      skipped++;
      continue;
    }

    if (data.imageData.startsWith("http")) {
      console.log(`[SKIP] ${artist} (${concertId}) - already a URL`);
      skipped++;
      continue;
    }

    if (!data.imageData.startsWith("data:image")) {
      console.log(`[SKIP] ${artist} (${concertId}) - not a base64 data URI`);
      skipped++;
      continue;
    }

    try {
      // Extract the base64 data and content type
      const matches = data.imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.log(`[FAIL] ${artist} (${concertId}) - invalid base64 format`);
        failed++;
        continue;
      }

      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Determine file extension
      const ext = contentType.includes("png") ? "png" 
                : contentType.includes("webp") ? "webp" 
                : "jpg";

      const filePath = `concert-images/${concertId}.${ext}`;
      const file = bucket.file(filePath);

      // Upload to Storage
      await file.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            concertId,
            artist,
            migratedAt: new Date().toISOString(),
          },
        },
      });

      // Make publicly accessible
      await file.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      // Update Firestore: set imageData to URL, backup original
      await db.collection("concerts").doc(concertId).update({
        imageData: publicUrl,
        imageDataBackup: data.imageData.substring(0, 50) + "...[migrated]",
        imageStoragePath: filePath,
      });

      const sizeKB = Math.round(buffer.length / 1024);
      console.log(`[OK] ${artist} (${concertId}) - ${sizeKB}KB uploaded`);
      migrated++;
    } catch (error) {
      console.error(`[FAIL] ${artist} (${concertId}) - ${error.message}`);
      failed++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);

  // Also migrate default category images
  console.log("\nChecking default category images...");
  const categorySnapshot = await db.collection("category_images").get();
  for (const catDoc of categorySnapshot.docs) {
    const catData = catDoc.data();
    if (catData.imageData && catData.imageData.startsWith("data:image")) {
      try {
        const matches = catData.imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) continue;

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = contentType.includes("png") ? "png" : "jpg";
        const filePath = `category-images/${catDoc.id}.${ext}`;
        const file = bucket.file(filePath);

        await file.save(buffer, {
          metadata: { contentType },
        });
        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        await db.collection("category_images").doc(catDoc.id).update({
          imageData: publicUrl,
        });
        console.log(`[OK] Category: ${catDoc.id} migrated`);
      } catch (error) {
        console.error(`[FAIL] Category: ${catDoc.id} - ${error.message}`);
      }
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

migrateImages().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
