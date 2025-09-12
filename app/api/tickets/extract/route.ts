import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log('Processing ticket image with OpenAI Vision...');

    // Call OpenAI Vision API with Hebrew-specific prompt
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured information from ticket images, especially Hebrew tickets.
          
          Analyze the ticket image and extract ALL relevant information into a JSON object with these exact fields:
          - artist: string (performer/artist name, in original language)
          - title: string (event title, in original language)  
          - venue: string (venue name and location)
          - date: string (event date in DD/MM/YYYY format)
          - time: string (event time in HH:MM format)
          - price: number (ticket price as number only)
          - currency: string (currency symbol or code like ₪, שח, $, USD, etc.)
          - seat: string (seat number if available)
          - row: string (row information if available)
          - section: string (section/area if available)
          - barcode: string (any barcode or ticket ID)
          - gate: string (entrance gate if mentioned)
          - confidence: number (0-1, how confident you are in the extraction)
          
          For Hebrew text: preserve the original Hebrew characters.
          For dates: look for patterns like DD/MM/YYYY, DD.MM.YYYY, or Hebrew date formats.
          For prices: look for numbers with currency symbols (₪, שח, $, etc.) or context words like "מחיר", "price", "סכום".
          For venue: look for venue names, addresses, cities in Hebrew or English.
          
          If a field cannot be found, set it to null. Be very careful with price extraction - only extract if you're confident it's the ticket price.
          
          Return ONLY valid JSON, no additional text.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all ticket information from this image into the specified JSON format. Pay special attention to Hebrew text and price information."
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
      max_tokens: 1000,
    });

    const extractedData = JSON.parse(visionResponse.choices[0].message.content || '{}');
    
    console.log('OpenAI Vision extraction result:', extractedData);

    // Add metadata
    const result = {
      ...extractedData,
      extractionMethod: 'openai_vision',
      extractedAt: new Date().toISOString(),
      processingTime: Date.now() - Date.now(), // We could track this properly
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in ticket extraction:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extract ticket information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Ticket extraction API',
      status: 'ready',
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: '10MB'
    }
  );
}