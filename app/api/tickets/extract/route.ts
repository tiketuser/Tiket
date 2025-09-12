import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load Israeli artists and venues dictionary
let israeliData: any = null;

async function loadIsraeliData() {
  if (!israeliData) {
    try {
      const dataPath = path.join(process.cwd(), 'app/data/israeli-artists.json');
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      israeliData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Failed to load Israeli data:', error);
      israeliData = { artists: [], venues: [] };
    }
  }
  return israeliData;
}

// Advanced text processing for Hebrew tickets
function preprocessImage(imageBuffer: Buffer): string {
  // Convert to base64 for OpenAI
  return Buffer.from(imageBuffer).toString('base64');
}

function normalizeHebrewText(text: string): string {
  return text
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '') // Remove RTL markers
    .replace(/[\u0591-\u05C7]/g, '') // Remove niqqud
    .replace(/[`'"״׳]/g, '"') // Normalize quotes
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

function extractPricesAdvanced(text: string): Array<{ price: number; currency: string; confidence: number; context: string }> {
  const prices = [];
  
  // Enhanced Hebrew price patterns
  const hebrewPatterns = [
    // Explicit price mentions
    /(?:מחיר|עלות|סכום|תשלום)\s*(?:כרטיס)?\s*[:=]?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:₪|שח|ש"ח|שקל)/gi,
    // Price with currency symbol
    /(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:₪|שח|ש"ח|שקלים?)/gi,
    // Currency symbol first
    /₪\s*(\d{1,4}(?:[.,]\d{1,2})?)/gi,
    // Total patterns
    /(?:סה"כ|סך הכל|total)\s*[:=]?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:₪|שח)/gi
  ];

  hebrewPatterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (price > 10 && price < 5000) { // Reasonable ticket price range
        const context = text.substring(Math.max(0, match.index - 50), match.index + 50);
        let confidence = 0.7 + (index === 0 ? 0.2 : 0); // Higher confidence for explicit mentions
        
        // Boost confidence based on context
        if (context.includes('מחיר') || context.includes('עלות')) confidence += 0.15;
        if (context.includes('כרטיס')) confidence += 0.1;
        if (context.includes('₪')) confidence += 0.05;
        
        prices.push({
          price,
          currency: '₪',
          confidence: Math.min(confidence, 0.95),
          context: normalizeHebrewText(context)
        });
      }
    }
  });

  return prices.sort((a, b) => b.confidence - a.confidence);
}

function extractArtistAdvanced(text: string, knownArtists: string[]): Array<{ artist: string; confidence: number }> {
  const results = [];
  const normalizedText = normalizeHebrewText(text);
  
  // Direct matches with fuzzy tolerance
  knownArtists.forEach(artist => {
    const normalizedArtist = normalizeHebrewText(artist);
    
    // Exact match (highest confidence)
    if (normalizedText.includes(normalizedArtist)) {
      results.push({ artist, confidence: 0.95 });
      return;
    }
    
    // Partial matches
    const artistWords = normalizedArtist.split(' ');
    let matchCount = 0;
    artistWords.forEach(word => {
      if (word.length > 2 && normalizedText.includes(word)) {
        matchCount++;
      }
    });
    
    if (matchCount >= artistWords.length * 0.7) { // 70% word match threshold
      const confidence = 0.6 + (matchCount / artistWords.length) * 0.3;
      results.push({ artist, confidence });
    }
  });

  // Look for potential unknown artists (capitalized Hebrew/English names)
  const unknownArtistPatterns = [
    /([א-ת]+\s+[א-ת]+)/g, // Hebrew two-word names
    /([A-Z][a-z]+\s+[A-Z][a-z]+)/g // English two-word names
  ];

  unknownArtistPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(normalizedText)) !== null) {
      const potentialArtist = match[1].trim();
      if (potentialArtist.length > 5 && potentialArtist.length < 30) {
        // Check if it's not a known venue or common words
        const commonWords = ['האצטדיון', 'היכל', 'תל אביב', 'רמת גן', 'כרטיס', 'מקום', 'שער'];
        if (!commonWords.some(word => potentialArtist.includes(word))) {
          results.push({ artist: potentialArtist, confidence: 0.4 });
        }
      }
    }
  });

  return results.sort((a, b) => b.confidence - a.confidence);
}

function extractVenueAdvanced(text: string, knownVenues: string[]): Array<{ venue: string; confidence: number }> {
  const results = [];
  const normalizedText = normalizeHebrewText(text);
  
  // Direct venue matches
  knownVenues.forEach(venue => {
    const normalizedVenue = normalizeHebrewText(venue);
    if (normalizedText.includes(normalizedVenue)) {
      results.push({ venue, confidence: 0.9 });
    } else {
      // Check for partial matches
      const venueWords = normalizedVenue.split(' ');
      let matchCount = 0;
      venueWords.forEach(word => {
        if (word.length > 3 && normalizedText.includes(word)) {
          matchCount++;
        }
      });
      
      if (matchCount >= venueWords.length * 0.6) {
        const confidence = 0.5 + (matchCount / venueWords.length) * 0.3;
        results.push({ venue, confidence });
      }
    }
  });

  // Look for venue indicators
  const venuePatterns = [
    /(?:האצטדיון|אצטדיון)\s+([א-ת\s]+)/g,
    /(?:היכל|זאפה|בארבי)\s+([א-ת\s-]+)/g,
    /([א-ת\s]+)\s+(?:אולם|היכל|מרכז)/g
  ];

  venuePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(normalizedText)) !== null) {
      const potentialVenue = match[1]?.trim() || match[0].trim();
      if (potentialVenue.length > 4 && potentialVenue.length < 50) {
        results.push({ venue: potentialVenue, confidence: 0.6 });
      }
    }
  });

  return results.sort((a, b) => b.confidence - a.confidence);
}

function extractDateTimeAdvanced(text: string): { date?: string; time?: string; confidence: number } {
  const normalizedText = normalizeHebrewText(text);
  let date, time;
  let confidence = 0;

  // Hebrew months
  const hebrewMonths: { [key: string]: string } = {
    'ינואר': '01', 'פברואר': '02', 'מרץ': '03', 'אפריל': '04',
    'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
    'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12'
  };

  // Date patterns
  const datePatterns = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    /(\d{1,2})\s+ב([א-ת]+)\s+(\d{4})/g
  ];

  datePatterns.forEach(pattern => {
    const match = pattern.exec(normalizedText);
    if (match) {
      if (match[2] && hebrewMonths[match[2]]) {
        // Hebrew month format
        date = `${match[1].padStart(2, '0')}/${hebrewMonths[match[2]]}/${match[3]}`;
        confidence += 0.4;
      } else if (match[2]) {
        // Numeric format
        date = `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
        confidence += 0.3;
      }
    }
  });

  // Time patterns
  const timePatterns = [
    /(?:בשעה|שעה)\s*(\d{1,2}):?(\d{2})/g,
    /(\d{1,2}):(\d{2})/g
  ];

  timePatterns.forEach(pattern => {
    const match = pattern.exec(normalizedText);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        time = `${match[1].padStart(2, '0')}:${match[2]}`;
        confidence += 0.3;
      }
    }
  });

  return { date, time, confidence: Math.min(confidence, 0.9) };
}

function extractSeatingAdvanced(text: string): { row?: string; seat?: string; section?: string; confidence: number } {
  const normalizedText = normalizeHebrewText(text);
  let row, seat, section;
  let confidence = 0;

  // Seating patterns
  const seatingPatterns = {
    row: /(?:שורה|Row)\s*[:=]?\s*([A-Za-z0-9]+)/gi,
    seat: /(?:מקום|מושב|Seat)\s*[:=]?\s*([A-Za-z0-9]+)/gi,
    section: /(?:יציע|גוש|סקטור|Section|Block)\s*[:=]?\s*([A-Za-z0-9]+)/gi
  };

  Object.entries(seatingPatterns).forEach(([key, pattern]) => {
    const match = pattern.exec(normalizedText);
    if (match && match[1]) {
      if (key === 'row') row = match[1].trim();
      else if (key === 'seat') seat = match[1].trim();
      else if (key === 'section') section = match[1].trim();
      confidence += 0.25;
    }
  });

  return { row, seat, section, confidence: Math.min(confidence, 0.9) };
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Load Israeli data
    const data = await loadIsraeliData();

    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!imageFile.type.startsWith('image/') || imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Invalid file type or size too large' },
        { status: 400 }
      );
    }

    console.log(`Processing ticket image: ${imageFile.name} (${imageFile.size} bytes)`);

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = preprocessImage(Buffer.from(imageBuffer));

    // Advanced OpenAI Vision prompt specifically designed for Hebrew tickets
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a specialized Hebrew ticket analysis expert. Extract ALL visible text and information from ticket images with extreme precision.

CRITICAL INSTRUCTIONS:
1. Read EVERY piece of text, including small print, Hebrew and English text
2. Pay special attention to Hebrew text (right-to-left) and mixed Hebrew-English content
3. Identify artist names, venue names, prices, dates, times, and seating information
4. Look for currency symbols (₪, שח, ש"ח) and price indicators (מחיר, עלות, סכום)
5. Find venue indicators (אצטדיון, היכל, זאפה, בארבי, אולם)
6. Extract dates in Hebrew (ינואר, פברואר, etc.) and numeric formats
7. Find seating info (שורה, מקום, מושב, יציע, גוש)
8. Include barcodes and reference numbers

Return a JSON object with this exact structure:
{
  "raw_text": "ALL extracted text exactly as seen",
  "artist": "primary performer name",
  "title": "event title", 
  "venue": "venue name and location",
  "date": "event date in DD/MM/YYYY format",
  "time": "event time in HH:MM format",
  "price": "ticket price as number only",
  "currency": "₪ or other currency symbol",
  "row": "row information",
  "seat": "seat number",
  "section": "section/block information", 
  "gate": "gate number if mentioned",
  "barcode": "barcode or ticket ID",
  "confidence": "confidence score 0-1 for extraction quality",
  "language_detected": "hebrew|english|mixed"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL information from this Hebrew ticket image. Be extremely thorough and precise. Focus especially on Hebrew text and cultural context."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const aiResult = JSON.parse(visionResponse.choices[0].message.content || '{}');
    console.log(`OpenAI extracted ${Object.keys(aiResult).length} fields`);

    // Apply advanced processing to the extracted text
    const rawText = aiResult.raw_text || '';
    
    if (rawText.length < 10) {
      return NextResponse.json({
        error: 'Insufficient text extracted from image',
        extracted_text_length: rawText.length
      }, { status: 400 });
    }

    // Enhanced processing with Israeli context
    const prices = extractPricesAdvanced(rawText);
    const artists = extractArtistAdvanced(rawText, data.artists);
    const venues = extractVenueAdvanced(rawText, data.venues);
    const dateTime = extractDateTimeAdvanced(rawText);
    const seating = extractSeatingAdvanced(rawText);

    // Merge AI results with advanced processing
    const finalResult = {
      // Raw data from AI
      raw_text: rawText.substring(0, 500) + '...', // Truncate for response size
      ai_extraction: {
        artist: aiResult.artist,
        venue: aiResult.venue,
        date: aiResult.date,
        time: aiResult.time,
        price: aiResult.price,
        confidence: aiResult.confidence || 0
      },
      
      // Enhanced processing results
      enhanced_extraction: {
        prices: prices.slice(0, 3), // Top 3 price candidates
        artists: artists.slice(0, 3), // Top 3 artist candidates  
        venues: venues.slice(0, 3), // Top 3 venue candidates
        date_time: dateTime,
        seating: seating
      },

      // Best candidates (merged results)
      final_results: {
        artist: artists.length > 0 ? artists[0].artist : aiResult.artist,
        venue: venues.length > 0 ? venues[0].venue : aiResult.venue,
        price: prices.length > 0 ? prices[0].price : (parseFloat(aiResult.price) || null),
        currency: prices.length > 0 ? prices[0].currency : (aiResult.currency || '₪'),
        date: dateTime.date || aiResult.date,
        time: dateTime.time || aiResult.time,
        row: seating.row || aiResult.row,
        seat: seating.seat || aiResult.seat,
        section: seating.section || aiResult.section,
        barcode: aiResult.barcode,
        overall_confidence: Math.max(
          artists.length > 0 ? artists[0].confidence : 0,
          venues.length > 0 ? venues[0].confidence : 0,
          prices.length > 0 ? prices[0].confidence : 0,
          dateTime.confidence,
          seating.confidence,
          aiResult.confidence || 0
        )
      },

      extraction_metadata: {
        processing_method: 'advanced_hybrid',
        israeli_artists_checked: data.artists.length,
        israeli_venues_checked: data.venues.length,
        text_length: rawText.length,
        extraction_timestamp: new Date().toISOString()
      }
    };

    console.log(`Final extraction results:
    Artist: ${finalResult.final_results.artist} (${artists.length > 0 ? artists[0].confidence.toFixed(2) : 'AI only'})
    Venue: ${finalResult.final_results.venue} (${venues.length > 0 ? venues[0].confidence.toFixed(2) : 'AI only'})
    Price: ${finalResult.final_results.price} ${finalResult.final_results.currency} (${prices.length > 0 ? prices[0].confidence.toFixed(2) : 'AI only'})
    Date: ${finalResult.final_results.date} ${finalResult.final_results.time}
    Seating: Row ${finalResult.final_results.row}, Seat ${finalResult.final_results.seat}, Section ${finalResult.final_results.section}`);

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Error in advanced ticket extraction:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extract ticket information',
        details: error instanceof Error ? error.message : 'Unknown error',
        extraction_method: 'advanced_hybrid'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Advanced Israeli Ticket Extraction API',
      status: 'ready',
      features: [
        'Hebrew text processing',
        'Israeli artist/venue recognition', 
        'Advanced price detection',
        'Multi-language support',
        'Intelligent confidence scoring'
      ],
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: '10MB'
    }
  );
}