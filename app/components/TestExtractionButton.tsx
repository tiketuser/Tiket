/**
 * Test button component for manual ticket extraction testing
 */
'use client';

import { useState } from 'react';
import { TicketExtractionTester } from '../test/ticket-extraction-test';

export default function TestExtractionButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  const handleTest = async () => {
    setIsLoading(true);
    setResults('');
    
    console.log('🧪 Manual extraction test started...');
    
    try {
      // Test API health first
      await TicketExtractionTester.testAPIHealth();
      
      setResults('API is healthy! Upload a ticket image to test extraction.');
      console.log('✅ Test completed - check browser console for detailed results');
      
    } catch (error) {
      console.error('Test failed:', error);
      setResults(`Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-2">🧪 Advanced Extraction Test</h3>
      <p className="text-sm text-gray-600 mb-3">
        Test the new advanced Hebrew ticket extraction system
      </p>
      
      <button 
        onClick={handleTest}
        disabled={isLoading}
        className="btn btn-primary btn-sm"
      >
        {isLoading ? 'Testing...' : 'Test Advanced Extraction'}
      </button>
      
      {results && (
        <div className="mt-3 p-2 bg-white rounded text-sm">
          <strong>Results:</strong> {results}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        💡 Tip: Enable AI enhancement and upload a Hebrew ticket to see detailed extraction results in browser console
      </div>
    </div>
  );
}