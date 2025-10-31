/**
 * Test script for barcode detection
 * This simulates the OCR extraction process to test barcode detection
 */

const path = require('path');
const fs = require('fs');

// Simulate barcode detection patterns (same as in route.ts)
const barcodePatterns = [
  /\b\d{12,13}\b/g,           // EAN-13, UPC-A (12-13 digits)
  /\b[A-Z0-9]{8,20}\b/g,      // Alphanumeric codes (8-20 characters)
  /\b\d{8,}\b/g,              // Long numeric strings (8+ digits)
];

function detectBarcode(text) {
  console.log('\n🔍 Testing barcode detection...');
  console.log('Full text length:', text.length, 'characters');
  
  let detectedBarcode = null;
  
  for (const pattern of barcodePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Find the longest match (most likely to be the real barcode)
      detectedBarcode = matches.reduce((a, b) => a.length > b.length ? a : b);
      console.log(` Pattern matched (${pattern}): ${detectedBarcode}`);
      console.log(`   All matches for this pattern:`, matches);
      break;
    }
  }
  
  if (detectedBarcode) {
    console.log(`\n BARCODE DETECTED: ${detectedBarcode}`);
    console.log(`   Length: ${detectedBarcode.length} characters`);
    console.log(`   Type: ${/^\d+$/.test(detectedBarcode) ? 'Numeric' : 'Alphanumeric'}`);
  } else {
    console.log('\n❌ No barcode detected');
  }
  
  return detectedBarcode;
}

// Test with sample ticket text (OCR-like output)
const testCases = [
  {
    name: 'Israeli Concert Ticket (Leaan)',
    text: `
      היכל מנורה מבטחים
      עומר אדם
      תאריך: 15.03.2026
      שעה: 21:00
      אזור: VIP שורה: 5 מקום: 12
      ברקוד: 9780123456789
      מחיר: 450 ש"ח
      www.leaan.co.il
    `
  },
  {
    name: 'Eventim Ticket with Alphanumeric Code',
    text: `
      EVENTIM ISRAEL
      Shlomo Artzi Concert
      Date: 20.05.2026
      Venue: Park Hayarkon
      Barcode: AB12CD34EF56GH
      Section: Gold
      Price: 380 ILS
    `
  },
  {
    name: 'Theater Ticket with Long Numeric Code',
    text: `
      תיאטרון הבימה
      הצגה: חתונה של רחל
      תאריך: 10.02.2026
      מספר כרטיס: 20261234567890
      מחיר: 220 ש"ח
    `
  },
  {
    name: 'Ticket with No Barcode',
    text: `
      היכל התרבות
      הופעה: להקת משינה
      תאריך: 25.12.2025
      מחיר: 180 ש"ח
      כרטיס כללי
    `
  },
  {
    name: 'Real EAN-13 Barcode',
    text: `
      CONCERT TICKET
      Artist: Omer Adam
      Barcode: 5901234123457
      Venue: Menorah Arena
      Date: 15/03/2026
    `
  }
];

console.log('=' .repeat(80));
console.log('🎫 BARCODE DETECTION TEST SUITE');
console.log('=' .repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log('='.repeat(80));
  console.log('Input text:', testCase.text.trim().substring(0, 100) + '...');
  
  const barcode = detectBarcode(testCase.text);
  
  console.log('\nResult:', barcode ? `✅ SUCCESS - ${barcode}` : '❌ FAILED - No barcode');
});

console.log('\n' + '='.repeat(80));
console.log('🏁 TEST SUITE COMPLETE');
console.log('='.repeat(80));

// Test the patterns individually
console.log('\n\n📊 PATTERN ANALYSIS:');
console.log('='.repeat(80));

const sampleText = '9780123456789 AB12CD34EF56GH 20261234567890 123';

console.log('Sample text:', sampleText);
console.log('\nPattern 1 (12-13 digits):');
console.log('  Pattern:', barcodePatterns[0]);
console.log('  Matches:', sampleText.match(barcodePatterns[0]) || 'None');

console.log('\nPattern 2 (Alphanumeric 8-20):');
console.log('  Pattern:', barcodePatterns[1]);
console.log('  Matches:', sampleText.match(barcodePatterns[1]) || 'None');

console.log('\nPattern 3 (Long numeric 8+):');
console.log('  Pattern:', barcodePatterns[2]);
console.log('  Matches:', sampleText.match(barcodePatterns[2]) || 'None');

console.log('\n✨ Test complete! Check the results above.\n');
