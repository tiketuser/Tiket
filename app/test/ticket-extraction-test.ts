/**
 * Comprehensive test harness for advanced ticket extraction system
 * This file tests the new AI-powered Hebrew ticket extraction
 */

interface ExtractionTestResult {
  success: boolean;
  artist?: string;
  venue?: string;
  price?: number;
  currency?: string;
  date?: string;
  time?: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

export class TicketExtractionTester {
  
  /**
   * Test the advanced extraction API with various ticket images
   */
  static async testExtractionAPI(imageFile: File): Promise<ExtractionTestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🎫 Testing extraction for: ${imageFile.name}`);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/tickets/extract', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error ${response.status}: ${error.error}`);
      }
      
      const result = await response.json();
      const processingTime = Date.now() - startTime;
      
      // Log detailed results
      console.log(`✅ Extraction Results for ${imageFile.name}:`, {
        '🎭 Artist': result.final_results?.artist || 'לא זוהה',
        '🏛️ Venue': result.final_results?.venue || 'לא זוהה',  
        '💰 Price': result.final_results?.price ? `${result.final_results.price} ${result.final_results.currency}` : 'לא זוהה',
        '📅 Date': result.final_results?.date || 'לא זוהה',
        '🕐 Time': result.final_results?.time || 'לא זוהה',
        '💺 Seating': `Row: ${result.final_results?.row || 'N/A'}, Seat: ${result.final_results?.seat || 'N/A'}`,
        '📊 Confidence': `${Math.round((result.final_results?.overall_confidence || 0) * 100)}%`,
        '⏱️ Processing': `${processingTime}ms`,
        '🔍 Israeli Artists Checked': result.extraction_metadata?.israeli_artists_checked || 0,
        '🏢 Israeli Venues Checked': result.extraction_metadata?.israeli_venues_checked || 0
      });
      
      // Log candidates if available
      if (result.enhanced_extraction) {
        console.log(`🎯 Top Artist Candidates:`, result.enhanced_extraction.artists?.slice(0, 3));
        console.log(`🏛️ Top Venue Candidates:`, result.enhanced_extraction.venues?.slice(0, 3));
        console.log(`💰 Price Candidates:`, result.enhanced_extraction.prices?.slice(0, 3));
      }
      
      return {
        success: true,
        artist: result.final_results?.artist,
        venue: result.final_results?.venue,
        price: result.final_results?.price,
        currency: result.final_results?.currency,
        date: result.final_results?.date,
        time: result.final_results?.time,
        confidence: result.final_results?.overall_confidence || 0,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Extraction failed for ${imageFile.name}:`, error);
      
      return {
        success: false,
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Test API availability and basic functionality
   */
  static async testAPIHealth(): Promise<boolean> {
    try {
      console.log('🔍 Testing API health...');
      
      const response = await fetch('/api/tickets/extract', {
        method: 'GET'
      });
      
      if (response.ok) {
        const info = await response.json();
        console.log('✅ API Health Check:', info);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ API Health Check Failed:', error);
      return false;
    }
  }
  
  /**
   * Run comprehensive extraction tests
   */
  static async runComprehensiveTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Ticket Extraction Tests...');
    
    // Test API health first
    const isHealthy = await this.testAPIHealth();
    if (!isHealthy) {
      console.error('❌ API is not healthy, aborting tests');
      return;
    }
    
    console.log('✅ API is healthy, proceeding with extraction tests...');
    
    // Note: In a real environment, we would load test images
    // For now, we'll just show the testing framework
    console.log(`
📋 Test Framework Ready:
- Advanced Hebrew text processing
- Israeli artist/venue recognition  
- Multi-confidence scoring
- Detailed result logging
- Performance monitoring

🎯 To test with real images:
1. Upload ticket images through the UI
2. Enable AI enhancement checkbox
3. Watch browser console for detailed results
4. Look for extraction confidence scores and processing times

🔍 Key Metrics to Watch:
- Artist extraction accuracy (target: >85%)  
- Venue detection rate (target: >80%)
- Price extraction precision (target: >90%)
- Overall confidence scores (target: >70%)
- Processing time (target: <3 seconds)
    `);
  }
}

// Auto-run tests when loaded
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    TicketExtractionTester.runComprehensiveTests();
  }, 1000);
}