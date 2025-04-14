import { BraidData } from '../../types/braid';
import { Bead, BlockHeader, Transaction, BeadParent } from '../../types/Bead';
import { PUBLIC_API_URL, DEFAULT_API_PARAMS } from '../../config/api';

// Define interface for the test_data endpoint response
interface TestData {
  bead_count: number;
  children: Record<string, string[]>;
  cohorts: string[][];
  highest_work_path: string[];
  parents: Record<string, string[]>;
  work: Record<string, number>;
}

/**
 * Public API client for the Blockchain Explorer
 * Handles communication with the VPS at french.braidpool.net
 */
export class PublicApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private testData: TestData | null = null;
  private testDataFetchPromise: Promise<TestData> | null = null;
  private lastFetchTime: number = 0;
  private cacheTTL: number = 300000; // 5 minutes cache TTL
  private processingBatch: boolean = false;

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

        console.log(
          `🔄 Fetching data from ${url}... (Attempt ${attempt + 1}/${
            this.retries
          })`
        );
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully fetched data from ${url}`);
        return data;
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
   * Fetch test data from the simulator
   * This is the main data source for all our endpoints
   */
  private async fetchTestData(): Promise<TestData> {
    const now = Date.now();
    const isCacheFresh =
      this.testData && now - this.lastFetchTime < this.cacheTTL;

    // Return cached data if we already fetched it and it's not expired
    if (isCacheFresh && this.testData) {
      console.log(
        `📦 Using cached test data from ${new Date(
          this.lastFetchTime
        ).toLocaleTimeString()}`
      );
      return this.testData;
    }

    // If already fetching, wait for that promise rather than starting a new request
    if (this.testDataFetchPromise) {
      console.log(`⏳ Waiting for in-progress test data fetch...`);

      // Add a timeout to ensure we don't wait forever for an in-progress request
      try {
        const timeoutPromise = new Promise<TestData>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timed out waiting for in-progress fetch'));
          }, 10000); // 10 second timeout for waiting
        });

        // Race between the in-progress fetch and our timeout
        return await Promise.race([this.testDataFetchPromise, timeoutPromise]);
      } catch (error) {
        console.error('❌ Timeout waiting for in-progress fetch', error);
        // Cancel the in-progress promise
        this.testDataFetchPromise = null;

        // Return stale cache if available
        if (this.testData) {
          console.log('📦 Returning stale cached data due to fetch timeout');
          return this.testData;
        }

        // If no cache, throw an error
        throw error;
      }
    }

    try {
      console.log('🔄 Fetching test data from simulator...');

      // Create a new fetch promise and handle the possible null case
      const fetchPromise = (async () => {
        // Check if the URL already ends with test_data
        const url = this.baseUrl.endsWith('test_data')
          ? this.baseUrl
          : `${this.baseUrl}/test_data`;
        console.log(`🌐 Using URL: ${url}`);

        const data = await this.fetchWithRetry<TestData>(url);

        // If we get an extremely large dataset, we might need to process it in chunks
        // or reduce its size
        if (data && data.bead_count > 10000) {
          console.log(
            `⚠️ Large dataset detected (${data.bead_count} beads), truncating for performance`
          );

          // Limit the data size to improve performance
          // Keep only the first 5000 items for each large collection
          const truncateSize = 5000;

          // Helper to safely truncate an object's entries for work dictionary
          const truncateWorkEntries = (obj: Record<string, number>) => {
            const result: Record<string, number> = {};
            let entryCount = 0;

            for (const [key, value] of Object.entries(obj)) {
              result[key] = value;
              entryCount++;

              // If we've added more than truncateSize entries, stop
              if (entryCount >= truncateSize) {
                console.log(
                  `🔪 Truncated object from ${
                    Object.keys(obj).length
                  } to ${truncateSize} entries`
                );
                break;
              }
            }

            return result;
          };

          // Helper to safely truncate an object's entries for string arrays
          const truncateCollectionEntries = (obj: Record<string, string[]>) => {
            const result: Record<string, string[]> = {};
            let entryCount = 0;

            for (const [key, value] of Object.entries(obj)) {
              result[key] = value;
              entryCount++;

              // If we've added more than truncateSize entries, stop
              if (entryCount >= truncateSize) {
                console.log(
                  `🔪 Truncated object from ${
                    Object.keys(obj).length
                  } to ${truncateSize} entries`
                );
                break;
              }
            }

            return result;
          };

          // Truncate children and parents - which contain string arrays
          if (Object.keys(data.children).length > truncateSize) {
            data.children = truncateCollectionEntries(data.children);
          }

          if (Object.keys(data.parents).length > truncateSize) {
            data.parents = truncateCollectionEntries(data.parents);
          }

          // Truncate work object - which contains numbers
          if (Object.keys(data.work).length > truncateSize) {
            data.work = truncateWorkEntries(data.work);
          }

          // Truncate highest_work_path if very long
          if (data.highest_work_path.length > truncateSize) {
            data.highest_work_path = data.highest_work_path.slice(
              0,
              truncateSize
            );
            console.log(
              `🔪 Truncated highest_work_path from ${data.highest_work_path.length} to ${truncateSize} entries`
            );
          }

          // Truncate cohorts if very numerous
          if (data.cohorts.length > truncateSize) {
            data.cohorts = data.cohorts.slice(0, truncateSize);
            console.log(
              `🔪 Truncated cohorts from ${data.cohorts.length} to ${truncateSize} entries`
            );
          }
        }

        // Update cache time and store data
        this.lastFetchTime = Date.now();
        this.testData = data;

        console.log(`✅ Retrieved test data with ${data.bead_count} beads`);
        return data;
      })();

      // Store the promise
      this.testDataFetchPromise = fetchPromise;

      // Get data from the promise
      const result = await fetchPromise;

      // Clear the promise after it's complete
      this.testDataFetchPromise = null;

      return result;
    } catch (error) {
      // Clear the promise on error
      this.testDataFetchPromise = null;
      console.error('❌ Error fetching test data:', error);

      // Return cached data if available, even if stale, rather than failing completely
      if (this.testData) {
        console.log('📦 Returning stale cached data due to fetch error');
        return this.testData;
      }

      throw error;
    }
  }

  /**
   * Convert string hash to numeric id
   * For our visualization, we need numeric IDs, so we'll use a simple hash function
   */
  private hashToId(hash: string): number {
    // Take the last 8 characters of the hash and convert to a number
    return parseInt(hash.slice(-8), 16);
  }

  /**
   * Fetch the current braid structure
   */
  async getBraidData(): Promise<BraidData> {
    try {
      console.log('🔄 Fetching braid data from API...');

      const testData = await this.fetchTestData();

      // Convert string hash data to number data for the BraidData interface
      const parents: Record<string, number[]> = {};
      const children: Record<string, number[]> = {};
      const cohorts: number[][] = [];
      const tips: number[] = [];

      // Convert parents map
      Object.entries(testData.parents).forEach(([bead, parentHashes]) => {
        const beadId = this.hashToId(bead);
        parents[beadId] = parentHashes.map((parentHash) =>
          this.hashToId(parentHash)
        );
      });

      // Convert children map
      Object.entries(testData.children).forEach(([bead, childHashes]) => {
        const beadId = this.hashToId(bead);
        children[beadId] = childHashes.map((childHash) =>
          this.hashToId(childHash)
        );
      });

      // Convert cohorts
      testData.cohorts.forEach((cohort) => {
        cohorts.push(cohort.map((beadHash) => this.hashToId(beadHash)));
      });

      // Find tips
      this.findTips(testData).forEach((tipHash) => {
        tips.push(this.hashToId(tipHash));
      });

      // Create the BraidData object
      const braidData: BraidData = {
        parents,
        children,
        cohorts,
        tips,
        description: `Simulated braid with ${testData.bead_count} beads`,
      };

      console.log('✅ Braid data transformed successfully');
      return braidData;
    } catch (error) {
      console.error('❌ Error transforming braid data:', error);
      throw error;
    }
  }

  /**
   * Find tip beads (those with no children)
   */
  private findTips(testData: TestData): string[] {
    const allBeads = new Set(Object.keys(testData.parents));
    const nonTips = new Set();

    // Any bead that appears as a child is not a tip
    Object.values(testData.children).forEach((children) => {
      children.forEach((child) => nonTips.add(child));
    });

    // Tips are beads that have parents but are not children of any bead
    return Array.from(allBeads).filter((bead) => !nonTips.has(bead));
  }

  /**
   * Fetch details for a specific bead by hash
   */
  async getBeadByHash(hash: string): Promise<Bead> {
    try {
      console.log(`🔄 Fetching bead with hash: ${hash} from API...`);

      const testData = await this.fetchTestData();

      // Check if the bead exists
      if (
        !testData.parents[hash] &&
        !Object.values(testData.children).some((children) =>
          children.includes(hash)
        )
      ) {
        throw new Error(`Bead with hash ${hash} not found`);
      }

      // Convert to Bead format
      const parentsList: BeadParent[] = (testData.parents[hash] || []).map(
        (parentHash) => ({
          beadHash: parentHash,
          timestamp: Date.now() - Math.floor(Math.random() * 60000), // Random time in the last minute
        })
      );

      // Create a minimal blockHeader
      const blockHeader: BlockHeader = {
        version: 1,
        prevBlockHash:
          parentsList[0]?.beadHash ||
          '0000000000000000000000000000000000000000000000000000000000000000',
        merkleRoot:
          '0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: Date.now() - Math.floor(Math.random() * 3600000), // Random time in the last hour
        bits: 0,
        nonce: 0,
      };

      const bead: Bead = {
        blockHeader,
        beadHash: hash,
        coinbaseTransaction: {
          transaction: {
            txid: '0000000000000000000000000000000000000000000000000000000000000000',
            version: 1,
            lockTime: 0,
            size: 0,
            weight: 0,
            inputs: [],
            outputs: [],
          },
          merkleProof: {
            txIndex: 0,
            siblings: [],
          },
        },
        payoutUpdateTransaction: {
          transaction: {
            txid: '0000000000000000000000000000000000000000000000000000000000000000',
            version: 1,
            lockTime: 0,
            size: 0,
            weight: 0,
            inputs: [],
            outputs: [],
          },
          merkleProof: {
            txIndex: 0,
            siblings: [],
          },
        },
        lesserDifficultyTarget: testData.work[hash] || 0,
        parents: parentsList,
        transactions: [],
        observedTimeAtNode: Date.now(),
        isTip: !testData.children[hash] || testData.children[hash].length === 0,
        isGenesis:
          !testData.parents[hash] || testData.parents[hash].length === 0,
      };

      console.log(`✅ Retrieved bead ${hash} from test data`);
      return bead;
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
      console.log('🔄 Fetching network statistics from API...');

      const testData = await this.fetchTestData();

      // Extract basic stats from test data
      const stats = {
        beadCount: testData.bead_count,
        cohortCount: testData.cohorts.length,
        tipCount: this.findTips(testData).length,
        highestWorkPathLength: testData.highest_work_path.length,
        // Other stats would be calculated or mocked here
        networkHashrate: Math.floor(Math.random() * 1000) + 'PH/s', // Mock data
        activeMiners: Math.floor(Math.random() * 100), // Mock data
        difficulty: Math.floor(Math.random() * 1000000), // Mock data
        lastUpdated: new Date().toISOString(),
      };

      console.log('✅ Generated network statistics from test data');
      return stats;
    } catch (error) {
      console.error('❌ Error generating network statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent beads
   */
  async getRecentBeads(limit: number = 10) {
    try {
      console.log(`🔄 Fetching ${limit} recent beads from API...`);

      const testData = await this.fetchTestData();

      // We don't have "recent" in test data, so we'll use the highest work path
      const recentBeadHashes = testData.highest_work_path.slice(0, limit);

      const recentBeads = recentBeadHashes.map((hash) => ({
        beadHash: hash,
        timestamp: Date.now() - Math.floor(Math.random() * 3600000), // Random time in the last hour
        miner: 'Simulator',
        workValue: testData.work[hash] || 0,
        transactionCount: Math.floor(Math.random() * 10), // Mock transaction count
        beadsInCohort: 0, // We'd calculate this if needed
        formsCohort: false,
      }));

      console.log(
        `✅ Generated ${recentBeads.length} recent beads from test data`
      );
      return recentBeads;
    } catch (error) {
      console.error('❌ Error generating recent beads:', error);
      throw error;
    }
  }

  /**
   * Search for beads by hash prefix
   */
  async searchBeads(query: string): Promise<Bead[]> {
    try {
      console.log(`🔍 Searching for beads matching: ${query} from API...`);

      const testData = await this.fetchTestData();

      // Search for beads with hash starting with the query
      const matchingHashes = Object.keys(testData.parents)
        .filter((hash) => hash.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10); // Limit to 10 results

      // Convert to Bead format
      const results = await Promise.all(
        matchingHashes.map((hash) => this.getBeadByHash(hash))
      );

      console.log(
        `✅ Found ${results.length} beads matching "${query}" from test data`
      );
      return results;
    } catch (error) {
      console.error(`❌ Error searching for beads matching "${query}":`, error);
      throw error;
    }
  }

  /**
   * Simple health check for the API
   */
  async checkHealth(): Promise<boolean> {
    try {
      console.log('🔍 Checking API health...');
      // Instead of checking /hello, check test_data directly
      const url = this.baseUrl.endsWith('test_data')
        ? this.baseUrl
        : `${this.baseUrl}/test_data`;
      console.log(`🌐 Health check URL: ${url}`);

      // For health check, use a lower timeout to avoid blocking the UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for health check

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      const success = response.ok;
      console.log(
        `${success ? '✅' : '❌'} API health check ${
          success ? 'successful' : 'failed'
        }`
      );
      return success;
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance for use throughout the app
export const publicApiClient = new PublicApiClient();

export default publicApiClient;
