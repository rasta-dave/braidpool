/**
 * API Testing Utilities
 *
 * This file contains utilities to test the API implementation
 * and ensure it's working as expected before full integration.
 */

import { PUBLIC_API_URL } from '../config/api';
import { PublicApiClient } from '../api/public/client';

/**
 * Test the public API endpoints
 * @returns Results of testing each endpoint
 */
export async function testPublicApi() {
  console.log('🧪 Starting API endpoint tests...');

  // Initialize client
  const apiClient = new PublicApiClient();

  // Start with empty results object
  const results = {
    apiEndpoint: PUBLIC_API_URL,
    tests: {} as Record<
      string,
      {
        success: boolean;
        data?: any;
        error?: string;
        duration: number;
      }
    >,
  };

  // Test functions
  const tests = [
    { name: 'getBraidData', fn: () => apiClient.getBraidData() },
    { name: 'getNetworkStats', fn: () => apiClient.getNetworkStats() },
    { name: 'getRecentBeads', fn: () => apiClient.getRecentBeads(5) },
    { name: 'searchBeads', fn: () => apiClient.searchBeads('000') },
    {
      name: 'getBeadByHash',
      fn: () =>
        apiClient.getBeadByHash(
          '0000000000000000000000000000000000000000000000000000000000000000'
        ),
    },
  ];

  // Run each test
  for (const test of tests) {
    console.log(`🔄 Testing ${test.name}...`);

    const startTime = performance.now();

    try {
      // Run the test
      const data = await test.fn();

      // Calculate time taken
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Store success result
      results.tests[test.name] = {
        success: true,
        data: data,
        duration,
      };

      console.log(`✅ ${test.name} - Success (${duration}ms)`);
    } catch (error: any) {
      // Calculate time taken
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Store error result
      results.tests[test.name] = {
        success: false,
        error: error.message,
        duration,
      };

      console.log(`❌ ${test.name} - Failed: ${error.message} (${duration}ms)`);
    }
  }

  // Log overall results
  const successCount = Object.values(results.tests).filter(
    (r) => r.success
  ).length;
  const totalTests = tests.length;

  console.log(
    `🏁 API Test Results: ${successCount}/${totalTests} endpoints successful`
  );

  return results;
}

/**
 * Display test results in the console in a formatted way
 */
export function displayTestResults(
  results: ReturnType<typeof testPublicApi> extends Promise<infer T> ? T : never
) {
  console.group('📊 API Test Results');
  console.log(`🔗 API Endpoint: ${results.apiEndpoint}`);

  console.group('Test Results');

  Object.entries(results.tests).forEach(([testName, result]) => {
    if (result.success) {
      console.group(`✅ ${testName} (${result.duration}ms)`);
      console.log('Response data:', result.data);
      console.groupEnd();
    } else {
      console.group(`❌ ${testName} (${result.duration}ms)`);
      console.log('Error:', result.error);
      console.groupEnd();
    }
  });

  console.groupEnd();

  // Overall summary
  const successCount = Object.values(results.tests).filter(
    (r) => r.success
  ).length;
  const totalTests = Object.keys(results.tests).length;
  console.log(`🏁 Summary: ${successCount}/${totalTests} endpoints successful`);

  console.groupEnd();
}

/**
 * Run API tests and display results
 * Usage: Import and call this function from the browser console
 * Example: import { runApiTests } from './utils/apiTestUtils'; runApiTests();
 */
export async function runApiTests() {
  const results = await testPublicApi();
  displayTestResults(results);
  return results;
}
