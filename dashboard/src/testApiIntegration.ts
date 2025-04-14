/**
 * API Integration Test Script
 *
 * This file provides a simple command-line way to test the Braidpool API integration.
 * Run with: `npx ts-node src/testApiIntegration.ts`
 */

import { PublicApiClient } from './api/public/client';
import { PUBLIC_API_URL } from './config/api';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

/**
 * Print colored output to console
 */
function print(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test API endpoints one by one
 */
async function testApiEndpoints() {
  print('🚀 BRAIDPOOL API INTEGRATION TEST', 'bright');
  print(`API Endpoint: ${PUBLIC_API_URL}`, 'cyan');
  print('----------------------------------------', 'bright');

  const client = new PublicApiClient();

  // Run tests in sequence
  try {
    // 1. Test getBraidData
    print('\n🔄 Testing getBraidData()', 'bright');
    const startBraid = performance.now();
    try {
      const braidData = await client.getBraidData();
      const duration = Math.round(performance.now() - startBraid);
      print(`✅ SUCCESS (${duration}ms)`, 'green');
      print(`  - Got ${Object.keys(braidData.parents).length} nodes`);
      print(`  - Got ${braidData.cohorts.length} cohorts`);
    } catch (error: any) {
      print(`❌ FAILED: ${error.message}`, 'red');
    }

    // 2. Test getNetworkStats
    print('\n🔄 Testing getNetworkStats()', 'bright');
    const startStats = performance.now();
    try {
      const stats = (await client.getNetworkStats()) as {
        networkHashrate: number;
        activeMiners: number;
        totalBeads: number;
      };
      const duration = Math.round(performance.now() - startStats);
      print(`✅ SUCCESS (${duration}ms)`, 'green');
      print(`  - Network hashrate: ${stats.networkHashrate} TH/s`);
      print(`  - Active miners: ${stats.activeMiners}`);
      print(`  - Total beads: ${stats.totalBeads}`);
    } catch (error: any) {
      print(`❌ FAILED: ${error.message}`, 'red');
    }

    // 3. Test getRecentBeads
    print('\n🔄 Testing getRecentBeads(5)', 'bright');
    const startBeads = performance.now();
    try {
      const beads = await client.getRecentBeads(5);
      const duration = Math.round(performance.now() - startBeads);
      print(`✅ SUCCESS (${duration}ms)`, 'green');
      print(`  - Retrieved ${beads.length} beads`);
      if (beads.length > 0) {
        print(`  - Latest bead hash: ${beads[0].beadHash}`);
      }
    } catch (error: any) {
      print(`❌ FAILED: ${error.message}`, 'red');
    }

    // 4. Test searchBeads
    print('\n🔄 Testing searchBeads("000")', 'bright');
    const startSearch = performance.now();
    try {
      const results = await client.searchBeads('000');
      const duration = Math.round(performance.now() - startSearch);
      print(`✅ SUCCESS (${duration}ms)`, 'green');
      print(`  - Found ${results.length} matching beads`);
    } catch (error: any) {
      print(`❌ FAILED: ${error.message}`, 'red');
    }

    // 5. Test getBeadByHash (using a sample hash)
    print(
      '\n🔄 Testing getBeadByHash("0000000000000000000000000000000000000000000000000000000000000000")',
      'bright'
    );
    const startBead = performance.now();
    try {
      const bead = await client.getBeadByHash(
        '0000000000000000000000000000000000000000000000000000000000000000'
      );
      const duration = Math.round(performance.now() - startBead);
      print(`✅ SUCCESS (${duration}ms)`, 'green');
      print(`  - Retrieved bead with hash: ${bead.beadHash}`);
    } catch (error: any) {
      print(`❌ FAILED: ${error.message}`, 'red');
    }

    print('\n----------------------------------------', 'bright');
    print('🏁 API Integration Test Complete!', 'bright');
    print(
      '\nIf some tests failed but showed fallback data, it means the real API endpoint may not be available'
    );
    print(
      'but the client is correctly falling back to demo data as expected.',
      'yellow'
    );
  } catch (error: any) {
    print(`💥 Fatal error during tests: ${error.message}`, 'red');
  }
}

// Run the tests
testApiEndpoints();

// Export for importing in other files
export { testApiEndpoints };
