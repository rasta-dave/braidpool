import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';

const app = express();
const port = 3100;

// Create WebSocket connection to simulator
let ws: any = null;
let isConnected = false;
let latestBlocks: any[] = [];
let networkStats = {
  totalBlocks: 0,
  totalTransactions: 0,
  averageBlockTime: 2.5,
  networkHashrate: 0,
  activeMiners: 0,
};

// Add throttling and caching
let lastUpdateTime = 0;
const MIN_UPDATE_INTERVAL = 2000; // Minimum 2 seconds between updates
let cachedBlocksResponse: any = null;
let cachedStatsResponse: any = null;

function connectToSimulator() {
  console.log('🔄 Connecting to simulator WebSocket...');
  ws = new WebSocket('ws://localhost:65433/ws');

  ws.on('open', () => {
    console.log('✅ Connected to simulator WebSocket!');
    isConnected = true;
  });

  ws.on('message', (data: any) => {
    try {
      const message = JSON.parse(data.toString());

      // Only log message type without details to reduce console output
      console.log('📨 Received message:', message.type);

      // Throttle updates to prevent excessive processing
      const now = Date.now();
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
        return; // Skip this update if it's too soon after the last one
      }

      lastUpdateTime = now;

      if (message.type === 'braid_update') {
        // Transform braid data into block format
        const transformedData = transformBraidToBlocks(message.data);
        latestBlocks = transformedData;

        // Update network stats
        updateNetworkStats(message.data);

        // Invalidate caches
        cachedBlocksResponse = null;
        cachedStatsResponse = null;

        console.log('🔄 Updated blocks data:', latestBlocks.length);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  ws.on('error', (error: any) => {
    console.error('❌ WebSocket error:', error);
    isConnected = false;
  });

  ws.on('close', () => {
    console.log('❌ Disconnected from simulator, attempting to reconnect...');
    isConnected = false;
    setTimeout(connectToSimulator, 5000);
  });
}

function transformBraidToBlocks(braidData: any) {
  const blocks = [];
  const miners = ['Miner1', 'Miner2', 'Miner3', 'Miner4', 'Miner5'];
  let height = 1000;

  if (!braidData || !braidData.cohorts || !braidData.parents) {
    console.warn('⚠️ Invalid braid data received');
    return [];
  }

  // Reduce console output - only log the total blocks being processed
  const totalBlockCount = braidData.cohorts.reduce(
    (sum: number, cohort: any[]) => sum + cohort.length,
    0
  );
  console.log(`📊 Processing ${totalBlockCount} blocks from braid data`);

  // Process each cohort (most recent first)
  for (const cohort of braidData.cohorts.slice().reverse()) {
    for (const hash of cohort) {
      const randomMiner = miners[Math.floor(Math.random() * miners.length)];
      const parents = braidData.parents[hash] || [];

      // Make sure hash has correct format (starting with zeros)
      const formattedHash = hash.startsWith('0000') ? hash : `0000${hash}`;

      blocks.push({
        height: height++,
        hash: formattedHash,
        timestamp: Date.now() - blocks.length * 60000,
        work: (parseInt(hash.substring(0, 8), 16) % 100) + 1000, // Extract some work value from the hash
        parents: parents,
        transactions: Math.floor(Math.random() * 50) + 1, // Random tx count for now
        difficulty: Math.floor(Math.random() * 1000) + 1000, // Random difficulty for now
        miner: randomMiner,
      });
    }
  }

  // Only return the most recent 20 blocks
  return blocks.slice(0, 20);
}

function updateNetworkStats(braidData: any) {
  if (!braidData || !braidData.cohorts) return;

  // Count total blocks from all cohorts
  const totalBlocks = braidData.cohorts.reduce(
    (sum: number, cohort: any[]) => sum + cohort.length,
    0
  );

  networkStats = {
    totalBlocks,
    totalTransactions: totalBlocks * 25, // Estimate: avg 25 txs per block
    averageBlockTime: 2.5,
    networkHashrate: 1500 + Math.floor(Math.random() * 200), // Simulated hashrate with variation
    activeMiners: 5,
  };

  // Simple log output without printing the entire object
  console.log('📊 Updated network stats - total blocks:', totalBlocks);
}

// Connect to simulator on startup
connectToSimulator();

// Setup CORS properly
app.use(
  cors({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Add a diagnostic middleware to log all requests
app.use((req, res, next) => {
  // Only log the path without query parameters to reduce log size
  console.log(`🔍 ${req.method} ${req.path}`);
  next();
});

// API endpoints
app.get('/blocks', (req, res) => {
  // Use cached response if available
  if (cachedBlocksResponse) {
    console.log('📦 Sending cached blocks data:', latestBlocks.length);
    res.json(cachedBlocksResponse);
    return;
  }

  if (latestBlocks.length === 0) {
    console.log('⚠️ No blocks data available, generating mock data');
    // Generate mock data if we don't have real data yet
    const mockBlocks = generateMockBlocks(20);
    cachedBlocksResponse = mockBlocks;
    res.json(mockBlocks);
    return;
  }

  console.log('📦 Sending blocks data:', latestBlocks.length);
  cachedBlocksResponse = latestBlocks;
  res.json(latestBlocks);
});

app.get('/stats', (req, res) => {
  // Use cached response if available
  if (cachedStatsResponse) {
    console.log('📦 Sending cached network stats');
    res.json(cachedStatsResponse);
    return;
  }

  console.log('📦 Sending network stats');
  cachedStatsResponse = networkStats;
  res.json(networkStats);
});

// Block details endpoint - get a specific block by hash or height
app.get('/blocks/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  console.log(`📡 GET block details for: ${identifier.substring(0, 10)}...`);

  // Check if we have any blocks data
  if (latestBlocks.length === 0) {
    console.log('⚠️ No blocks data available, generating mock data');
    const mockBlocks = generateMockBlocks(20);

    // Try to find the block by hash or height
    const block = findBlockByIdentifier(mockBlocks, identifier);

    if (!block) {
      console.log(`⚠️ Block not found with identifier, creating mock block`);
      // Create a mock block with the requested hash
      const mockBlock = createMockBlockForHash(identifier);
      const blockWithTxs = addMockTransactionsToBlock(mockBlock);
      return res.json(blockWithTxs);
    }

    // Add mock transaction data to the block
    const blockWithTxs = addMockTransactionsToBlock(block);
    return res.json(blockWithTxs);
  }

  // Try to find the block in our latest blocks
  const block = findBlockByIdentifier(latestBlocks, identifier);

  if (!block) {
    console.log(`⚠️ Block not found with identifier, creating mock block`);
    // Create a mock block with the requested hash
    const mockBlock = createMockBlockForHash(identifier);
    const blockWithTxs = addMockTransactionsToBlock(mockBlock);
    return res.json(blockWithTxs);
  }

  // Add mock transaction data to the block
  const blockWithTxs = addMockTransactionsToBlock(block);
  return res.json(blockWithTxs);
});

// Function to create a mock block for a given hash
function createMockBlockForHash(hash: string) {
  const miners = ['Miner1', 'Miner2', 'Miner3', 'Miner4', 'Miner5'];

  return {
    hash: hash,
    height: 1000 + Math.floor(Math.random() * 100),
    timestamp: Date.now() - Math.floor(Math.random() * 1000000),
    work: Math.floor(Math.random() * 100) + 1000,
    parents: [
      `0000${Math.random().toString(16).slice(2, 14)}`,
      `0000${Math.random().toString(16).slice(2, 14)}`,
    ],
    transactions: Math.floor(Math.random() * 50) + 1,
    difficulty: Math.floor(Math.random() * 1000) + 1000,
    miner: miners[Math.floor(Math.random() * miners.length)],
    size: Math.floor(Math.random() * 1000) + 500,
    weight: Math.floor(Math.random() * 3000) + 1500,
  };
}

// Generate mock transaction data for a specific block
function addMockTransactionsToBlock(block: any) {
  const txCount = block.transactions || Math.floor(Math.random() * 30) + 1;
  const transactions = [];

  for (let i = 0; i < txCount; i++) {
    transactions.push({
      txid: `${block.hash.substring(0, 8)}${Math.random()
        .toString(16)
        .slice(2, 10)}`,
      value: Math.random() * 2.5,
      size: Math.floor(Math.random() * 500) + 200,
      fee: (Math.random() * 0.0005 + 0.0001).toFixed(8),
      timestamp: block.timestamp - Math.floor(Math.random() * 300000),
      inputs: Math.floor(Math.random() * 3) + 1,
      outputs: Math.floor(Math.random() * 3) + 1,
    });
  }

  return {
    ...block,
    transactionData: transactions,
    totalFees: transactions
      .reduce((sum: number, tx: any) => sum + parseFloat(tx.fee), 0)
      .toFixed(8),
    totalValue: transactions
      .reduce((sum: number, tx: any) => sum + tx.value, 0)
      .toFixed(8),
  };
}

// Find a block by hash or height
function findBlockByIdentifier(blocks: any[], identifier: string) {
  // Try to parse as height (number)
  const height = parseInt(identifier);
  if (!isNaN(height)) {
    return blocks.find((block) => block.height === height);
  }

  // Search by hash - normalize and try different matching strategies
  const normalizedIdentifier = identifier.toLowerCase().replace(/^0+/, '');

  // Reduce logging - just a brief message
  console.log(
    `🔍 Searching for block with hash: ${normalizedIdentifier.substring(
      0,
      10
    )}...`
  );

  // First try exact match
  let block = blocks.find((block) => block.hash === identifier);

  // If not found, try with normalized hash
  if (!block) {
    block = blocks.find((block) => {
      const normalizedBlockHash = block.hash.toLowerCase().replace(/^0+/, '');
      return normalizedBlockHash === normalizedIdentifier;
    });
  }

  // If still not found, try with partial match (identifier is part of hash)
  if (!block) {
    block = blocks.find((block) => {
      return block.hash.toLowerCase().includes(normalizedIdentifier);
    });
  }

  // If still not found, try if hash begins with identifier
  if (!block) {
    block = blocks.find((block) => {
      const normalizedBlockHash = block.hash.toLowerCase().replace(/^0+/, '');
      return normalizedBlockHash.startsWith(normalizedIdentifier);
    });
  }

  // Just log if found or not, without the full hash
  if (block) {
    console.log(`✅ Found matching block`);
  }

  return block;
}

// Fallback mock data generator
const generateMockBlocks = (count: number) => {
  const blocks = [];
  let height = 1000;
  let work = 1000;
  const miners = ['Miner1', 'Miner2', 'Miner3', 'Miner4', 'Miner5'];

  console.log(`🧩 Generating ${count} mock blocks`);

  for (let i = 0; i < count; i++) {
    // Generate consistent format hash starting with 0000 for mock blocks
    const randomHex = Math.random().toString(16).slice(2, 14).padEnd(12, '0');
    const mockHash = `0000${randomHex}${i.toString(16).padStart(4, '0')}`;

    blocks.push({
      height: height + i,
      hash: mockHash,
      timestamp: Date.now() - i * 60000,
      work: work + Math.random() * 100,
      parents: [
        `0000${Math.random().toString(16).slice(2, 14)}`,
        `0000${Math.random().toString(16).slice(2, 14)}`,
      ],
      transactions: Math.floor(Math.random() * 50) + 1,
      difficulty: Math.floor(Math.random() * 1000) + 1000,
      miner: miners[Math.floor(Math.random() * miners.length)],
    });
  }

  console.log(`✅ Generated ${count} mock blocks successfully`);
  return blocks;
};

// Start the server
app.listen(port, () => {
  console.log(`🚀 Mock API server running at http://localhost:${port}`);
});
