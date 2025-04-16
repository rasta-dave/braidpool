import { BraidData } from '../../types/braid';
import { Bead, BlockHeader, Transaction } from '../../types/Bead';
import { PUBLIC_API_URL, DEFAULT_API_PARAMS } from '../../config/api';

/**
 * Public API client for the Blockchain Explorer
 * Handles communication with the VPS at french.braidpool.net
 */
export class PublicApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(
    baseUrl: string = PUBLIC_API_URL,
    timeout: number = DEFAULT_API_PARAMS.timeout,
    retries: number = DEFAULT_API_PARAMS.retries
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retries = retries;
    console.log('🔌 Public API client initialized with URL:', this.baseUrl);
  }

  /**
   * Generic method to handle API requests with retries and error handling
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
      } catch (error: any) {
        console.warn(
          `🔄 Attempt ${attempt + 1}/${this.retries} failed:`,
          error.message
        );
        lastError = error;

        // Don't retry if it was aborted due to timeout
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${this.timeout}ms`);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Unknown error during API request');
  }

  /**
   * Fetch the current braid structure from the test_data endpoint
   * and transform it to match the expected BraidData format
   */
  async getBraidData(): Promise<BraidData> {
    try {
      console.log('🔄 Fetching braid data from /test_data endpoint...');

      // Connect to the /test_data endpoint
      const testData = await this.fetchWithRetry<any>(
        `${this.baseUrl}/test_data`
      );

      // Validate the response data
      if (!testData) {
        throw new Error('API returned empty data');
      }

      // Check for required properties
      const requiredProps = ['parents', 'children'];
      const missingProps = requiredProps.filter((prop) => !testData[prop]);

      if (missingProps.length > 0) {
        console.error(
          '❌ API response missing required properties:',
          missingProps
        );
        console.error('Response data:', testData);
        throw new Error(
          `API response missing required properties: ${missingProps.join(', ')}`
        );
      }

      // Check that parents and children are objects
      if (
        typeof testData.parents !== 'object' ||
        typeof testData.children !== 'object'
      ) {
        console.error(
          '❌ API response has invalid data types for parents/children'
        );
        throw new Error('Invalid data types in API response');
      }

      console.log('✅ Successfully fetched data from test_data endpoint', {
        bead_count: testData.bead_count || 'N/A',
        parents_count: Object.keys(testData.parents || {}).length,
        children_count: Object.keys(testData.children || {}).length,
        cohorts: testData.cohorts?.length || 'N/A',
        highest_work_path: testData.highest_work_path?.length || 'N/A',
      });

      // Convert to the expected BraidData format
      const braidData: BraidData = {
        description: 'Braidpool DAG structure from test_data endpoint',
        parents: testData.parents,
        children: testData.children,
        // Calculate tips as beads with no children
        tips: this.findTips(testData.parents, testData.children),
        cohorts: testData.cohorts || [],
        work: testData.work || {},
        highest_work_path: testData.highest_work_path || [],
        bead_count: testData.bead_count || Object.keys(testData.parents).length,
      };

      // Add sample debugging output
      console.log(
        '🔍 Sample parents:',
        Object.entries(braidData.parents).slice(0, 2)
      );
      console.log(
        '🔍 Sample children:',
        Object.entries(braidData.children).slice(0, 2)
      );

      if (braidData.cohorts.length > 0) {
        console.log('🔍 First cohort sample:', braidData.cohorts[0]);
      } else {
        console.warn('⚠️ No cohorts data available from API');
      }

      return braidData;
    } catch (error: any) {
      // Provide detailed error information
      console.error('❌ Error fetching braid data:', error);
      console.error(`⚠️ API endpoint: ${this.baseUrl}/test_data`);
      console.error(`⚠️ Error details: ${error.message}`);

      // Throw the error to be handled by the component
      throw new Error(`Failed to fetch data from API: ${error.message}`);
    }
  }

  /**
   * Utility method to find tips (beads with no children)
   */
  private findTips(
    parents: Record<string, number[]>,
    children: Record<string, number[]>
  ): number[] {
    return Object.keys(parents)
      .filter((id) => !children[id] || children[id].length === 0)
      .map((id) => parseInt(id));
  }

  /**
   * Fetch details for a specific bead by hash
   */
  async getBeadByHash(hash: string): Promise<Bead> {
    try {
      console.log(`🔄 Fetching bead with hash: ${hash}`);

      // For initial development, simulate API call
      // TODO: Replace with actual API call
      // return await this.fetchWithRetry<Bead>(`${this.baseUrl}/bead/${hash}`);

      // Temporary mock data
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Create the block header
      const header: BlockHeader = {
        version: 1,
        prevBlockHash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        merkleRoot:
          '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        timestamp: Date.now() / 1000,
        bits: 486604799,
        nonce: 2083236893,
      };

      // Mock empty transaction for development
      const emptyTx: Transaction = {
        txid: '0'.repeat(64),
        version: 1,
        lockTime: 0,
        size: 250,
        weight: 1000,
        inputs: [],
        outputs: [],
      };

      // Mock data for development
      const mockBead: Bead = {
        blockHeader: header,
        beadHash: hash,
        coinbaseTransaction: {
          transaction: emptyTx,
          merkleProof: { txIndex: 0, siblings: [] },
        },
        payoutUpdateTransaction: {
          transaction: emptyTx,
          merkleProof: { txIndex: 0, siblings: [] },
        },
        lesserDifficultyTarget: 0x1d00ffff,
        parents: [],
        transactions: [],
        observedTimeAtNode: Date.now() / 1000,
      };

      console.log(`✅ Retrieved bead ${hash} (mock data)`);
      return mockBead;
    } catch (error) {
      console.error(`❌ Error fetching bead ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats() {
    try {
      console.log('🔄 Fetching network statistics...');

      // For initial development, simulate API call
      // TODO: Replace with actual API call
      // return await this.fetchWithRetry(`${this.baseUrl}/stats`);

      // Mock data for development
      await new Promise((resolve) => setTimeout(resolve, 700)); // Simulate network delay

      const stats = {
        totalBeads: 1254,
        lastUpdate: new Date().toISOString(),
        networkHashrate: 45.7, // TH/s
        activeMiners: 32,
        averageConfirmationTime: 8.3, // minutes
        beadsPerCohortRatio: 2.38, // Close to ideal 2.42
        difficulty: 87334291,
        totalTransactions: 15420,
        cohortFormationRate: 4.2, // per hour
      };

      console.log('✅ Retrieved network statistics (mock data)');
      return stats;
    } catch (error) {
      console.error('❌ Error fetching network statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent beads
   */
  async getRecentBeads(limit: number = 10) {
    try {
      console.log(`🔄 Fetching ${limit} recent beads...`);

      // For initial development, simulate API call
      // TODO: Replace with actual API call
      // return await this.fetchWithRetry(`${this.baseUrl}/beads/recent?limit=${limit}`);

      // Mock data for development
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate network delay

      // Generate mock beads for development
      const recentBeads = Array(limit)
        .fill(null)
        .map((_, i) => {
          const timestamp = Date.now() / 1000 - i * 600; // 10 minutes apart

          return {
            beadHash: `0000${Math.random().toString(16).slice(2, 14)}${i}`,
            timestamp,
            miner: ['MinerA', 'MinerB', 'MinerC', 'MinerD'][
              Math.floor(Math.random() * 4)
            ],
            workValue: (Math.random() * 200 + 800).toFixed(2),
            transactionCount: Math.floor(Math.random() * 400) + 100,
            beadsInCohort: Math.floor(Math.random() * 3) + 1,
            formsCohort: Math.random() > 0.7, // 30% chance of forming a cohort
          };
        });

      console.log(
        `✅ Retrieved ${recentBeads.length} recent beads (mock data)`
      );
      return recentBeads;
    } catch (error) {
      console.error('❌ Error fetching recent beads:', error);
      throw error;
    }
  }

  /**
   * Search for beads by hash prefix
   */
  async searchBeads(query: string): Promise<Bead[]> {
    try {
      console.log(`🔍 Searching for beads matching: ${query}`);

      // For initial development, simulate API call
      // TODO: Replace with actual API call
      // return await this.fetchWithRetry<Bead[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);

      // Mock data for development
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate network delay

      // Create a mock transaction
      const emptyTx: Transaction = {
        txid: '0'.repeat(64),
        version: 1,
        lockTime: 0,
        size: 250,
        weight: 1000,
        inputs: [],
        outputs: [],
      };

      // Generate some mock beads for development
      const mockBeads: Bead[] = Array(3)
        .fill(null)
        .map((_, i) => {
          const beadHash = `${query}${i}abc${Math.random()
            .toString(16)
            .slice(2, 8)}`;
          const timestamp = Date.now() / 1000 - i * 600;

          return {
            blockHeader: {
              version: 1,
              prevBlockHash:
                '0000000000000000000000000000000000000000000000000000000000000000',
              merkleRoot:
                '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
              timestamp,
              bits: 486604799,
              nonce: 2083236893 + i,
            },
            beadHash,
            coinbaseTransaction: {
              transaction: emptyTx,
              merkleProof: { txIndex: 0, siblings: [] },
            },
            payoutUpdateTransaction: {
              transaction: emptyTx,
              merkleProof: { txIndex: 0, siblings: [] },
            },
            lesserDifficultyTarget: 0x1d00ffff,
            parents: [],
            transactions: [],
            observedTimeAtNode: timestamp,
          };
        });

      console.log(
        `✅ Found ${mockBeads.length} beads matching "${query}" (mock data)`
      );
      return mockBeads;
    } catch (error) {
      console.error(
        `❌ Error searching for beads with query "${query}":`,
        error
      );
      throw error;
    }
  }
}

// Export singleton instance for use throughout the app
export const publicApiClient = new PublicApiClient();

export default publicApiClient;
