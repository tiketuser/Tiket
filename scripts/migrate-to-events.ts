/**
 * Migration script: concerts → events collection + base64 images → Firebase Storage
 *
 * Run once with:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-to-events.ts
 *
 * Requirements:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path, OR
 *   - Run from a machine already authenticated with Application Default Credentials
 *   - Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET env var (or edit STORAGE_BUCKET below)
 */

import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

// ── Config ────────────────────────────────────────────────────────────────────
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tiket-9268c.firebasestorage.app";
// ─────────────────────────────────────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const bucket = getStorage().bucket();

async function uploadBase64ToStorage(
  base64DataUri: string,
  docId: string
): Promise<string> {
  // Strip the data URI prefix to get the raw base64
  const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error(`Invalid base64 data URI for doc ${docId}`);

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  const ext = mimeType.split("/")[1] || "jpg";
  const filePath = `event-images/${docId}-migrated.${ext}`;
  const file = bucket.file(filePath);

  await file.save(buffer, { contentType: mimeType });
  await file.makePublic();

  return `https://storage.googleapis.com/${STORAGE_BUCKET}/${filePath}`;
}

async function main() {
  console.log("=== TIKET Migration: concerts → events ===\n");

  // ── Step 1: Copy concerts → events ──────────────────────────────────────
  console.log("Step 1: Copying concerts collection to events...");
  const concertsSnap = await db.collection("concerts").get();

  if (concertsSnap.empty) {
    console.log("  No documents found in concerts collection. Skipping.\n");
  } else {
    let copied = 0;
    let skipped = 0;

    for (const concertDoc of concertsSnap.docs) {
      const data = concertDoc.data();

      // Check if already migrated (exists in events)
      const existingEvent = await db.collection("events").doc(concertDoc.id).get();
      if (existingEvent.exists) {
        console.log(`  Skipping ${concertDoc.id} (already in events)`);
        skipped++;
        continue;
      }

      // Rename concertId references on the document itself if any
      const eventData = { ...data };

      // Write to events collection with same doc ID
      await db.collection("events").doc(concertDoc.id).set(eventData);
      copied++;
      console.log(`  Copied: ${data.artist || concertDoc.id}`);
    }

    console.log(`  Done. Copied: ${copied}, Skipped: ${skipped}\n`);
  }

  // ── Step 2: Rename concertId → eventId on tickets ───────────────────────
  console.log("Step 2: Renaming concertId → eventId on tickets...");
  const ticketsSnap = await db
    .collection("tickets")
    .where("concertId", "!=", null)
    .get();

  if (ticketsSnap.empty) {
    console.log("  No tickets with concertId field found.\n");
  } else {
    const batchSize = 400;
    let processed = 0;

    // Process in batches of 400 (Firestore limit is 500 per batch)
    for (let i = 0; i < ticketsSnap.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = ticketsSnap.docs.slice(i, i + batchSize);

      for (const ticketDoc of chunk) {
        const data = ticketDoc.data();
        if (data.concertId !== undefined) {
          batch.update(ticketDoc.ref, {
            eventId: data.concertId,
            concertId: admin.firestore.FieldValue.delete(),
          });
          processed++;
        }
      }

      await batch.commit();
      console.log(`  Processed ${Math.min(i + batchSize, ticketsSnap.docs.length)} / ${ticketsSnap.docs.length} tickets`);
    }

    console.log(`  Done. Updated ${processed} tickets.\n`);
  }

  // ── Step 3: Migrate base64 images → Firebase Storage ────────────────────
  console.log("Step 3: Migrating base64 images to Firebase Storage...");
  const eventsSnap = await db.collection("events").get();

  let imagesConverted = 0;
  let imagesSkipped = 0;
  let imagesFailed = 0;

  for (const eventDoc of eventsSnap.docs) {
    const data = eventDoc.data();

    // Already migrated
    if (data.imageUrl && !data.imageData) {
      imagesSkipped++;
      continue;
    }

    // Has base64 imageData — upload to Storage
    if (data.imageData && typeof data.imageData === "string" && data.imageData.startsWith("data:")) {
      try {
        const imageUrl = await uploadBase64ToStorage(data.imageData, eventDoc.id);
        await eventDoc.ref.update({
          imageUrl,
          imageData: admin.firestore.FieldValue.delete(),
        });
        imagesConverted++;
        console.log(`  Uploaded image for: ${data.artist || eventDoc.id}`);
      } catch (err) {
        imagesFailed++;
        console.error(`  Failed for ${data.artist || eventDoc.id}:`, err);
      }
    } else if (data.imageUrl) {
      // Has imageUrl already (e.g. set from admin form post-migration) — just delete imageData if present
      if (data.imageData) {
        await eventDoc.ref.update({
          imageData: admin.firestore.FieldValue.delete(),
        });
      }
      imagesSkipped++;
    } else {
      // No image at all — skip
      imagesSkipped++;
    }
  }

  console.log(
    `  Done. Converted: ${imagesConverted}, Skipped: ${imagesSkipped}, Failed: ${imagesFailed}\n`
  );

  // ── Step 4: Delete old concerts collection ───────────────────────────────
  if (!concertsSnap.empty) {
    console.log("Step 4: Deleting old concerts collection...");
    const batchSize = 400;

    for (let i = 0; i < concertsSnap.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = concertsSnap.docs.slice(i, i + batchSize);
      chunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    console.log(`  Deleted ${concertsSnap.docs.length} concert documents.\n`);
  }

  console.log("=== Migration complete! ===");
  console.log("Next steps:");
  console.log("  1. Deploy your updated app (push to main)");
  console.log("  2. Deploy updated Firestore rules: firebase deploy --only firestore:rules");
  console.log("  3. Deploy updated Firestore indexes: firebase deploy --only firestore:indexes");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
