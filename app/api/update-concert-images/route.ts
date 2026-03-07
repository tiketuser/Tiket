import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../firebase';
import { requireAdmin } from '@/lib/authMiddleware';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Artist name mapping
const artistMapping: Record<string, string[]> = {
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

// Convert image file to base64 (server-side)
function imageToBase64(imagePath: string): string | null {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Error reading image:', error);
    return null;
  }
}

// Check if artist name matches
function matchesArtist(eventArtist: string, possibleNames: string[]): boolean {
  const normalizedConcert = eventArtist.toLowerCase().trim();
  return possibleNames.some(name => {
    const normalized = name.toLowerCase().trim();
    return normalizedConcert.includes(normalized) || normalized.includes(normalizedConcert);
  });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get all events
    const eventsSnapshot = await getDocs(collection(db as any, 'events'));

    if (eventsSnapshot.empty) {
      return NextResponse.json({ 
        error: 'No events found',
        message: 'Please create events first via /Admin or run migration'
      }, { status: 404 });
    }

    const results = {
      total: eventsSnapshot.size,
      updated: 0,
      skipped: 0,
      notFound: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process each event
    for (const docSnapshot of eventsSnapshot.docs) {
      const event = docSnapshot.data();
      const eventId = docSnapshot.id;
      const artistName = event.artist;

      const result: any = {
        artist: artistName,
        status: 'unknown'
      };

      // Check if already has image
      if (event.imageData && event.imageData.startsWith('data:image')) {
        result.status = 'skipped';
        result.message = 'Already has image';
        results.skipped++;
        results.details.push(result);
        continue;
      }

      // Find matching image
      let matchedImage: string | null = null;

      for (const [filename, possibleNames] of Object.entries(artistMapping)) {
        if (matchesArtist(artistName, possibleNames)) {
          matchedImage = filename;
          break;
        }
      }

      if (!matchedImage) {
        result.status = 'not_found';
        result.message = 'No matching image file';
        results.notFound++;
        results.details.push(result);
        continue;
      }

      try {
        // Convert image to base64 (server-side file reading)
        const imagePath = path.join(process.cwd(), 'public', 'images', 'Artist', matchedImage);
        const base64Image = imageToBase64(imagePath);

        if (!base64Image) {
          result.status = 'error';
          result.message = 'Failed to read or convert image';
          results.errors++;
          results.details.push(result);
          continue;
        }

        // Update event
        await updateDoc(doc(db as any, 'events', eventId), {
          imageData: base64Image
        });

        result.status = 'updated';
        result.message = `Updated with ${matchedImage}`;
        result.imageFile = matchedImage;
        results.updated++;
        results.details.push(result);

      } catch (error: any) {
        result.status = 'error';
        result.message = error.message;
        results.errors++;
        results.details.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Error updating event images:', error);
    return NextResponse.json({ 
      error: 'Failed to update images',
      message: error.message 
    }, { status: 500 });
  }
}
