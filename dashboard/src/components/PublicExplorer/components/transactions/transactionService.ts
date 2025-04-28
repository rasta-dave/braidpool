import { BraidTransaction } from './BraidTransaction';

export class TransactionService {
  private apiUrl = 'http://localhost:3100'; // Default to local API
  private transactionCache = new Map<string, BraidTransaction>();

  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  async getTransaction(txid: string): Promise<BraidTransaction> {
    // Check if the transaction ID is valid
    if (!txid || txid.trim() === '') {
      console.error('🚨 Invalid transaction ID:', txid);
      throw new Error('Invalid transaction ID');
    }

    // Format transaction ID consistently (some might have leading zeros)
    const formattedTxid = txid.trim();

    console.log('🔍 Looking for transaction:', formattedTxid);

    // Check cache first
    if (this.transactionCache.has(formattedTxid)) {
      console.log('💾 Using cached transaction:', formattedTxid);
      return this.transactionCache.get(formattedTxid)!;
    }

    console.log('🔄 Fetching transaction from API:', formattedTxid);
    console.log('🌐 API URL:', `${this.apiUrl}/tx/${formattedTxid}`);

    try {
      const response = await fetch(`${this.apiUrl}/tx/${formattedTxid}`);

      if (!response.ok) {
        console.error('❌ HTTP error:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BraidTransaction = await response.json();
      console.log('✅ Transaction data received:', data.txid);

      this.processTxData(data);
      this.transactionCache.set(formattedTxid, data);

      return data;
    } catch (error) {
      console.error('❌ Error fetching transaction:', error);
      throw new Error(
        `Could not fetch transaction ${formattedTxid}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private processTxData(tx: BraidTransaction): void {
    console.log('Processing transaction data:', tx.txid);

    // Calculate derived values
    if (tx.weight && !tx.feePerVsize && tx.fee != null) {
      tx.feePerVsize = tx.fee / (tx.weight / 4);
    }

    // Set defaults for view management
    tx['@vinLimit'] = 10;
    tx['@voutLimit'] = 10;

    // Check for large amounts
    tx.largeInput = tx.vin.some(
      (vin) => vin?.prevout?.value && vin.prevout.value > 1000000000
    );
    tx.largeOutput = tx.vout.some((vout) => vout?.value > 1000000000);

    // Mark transaction as confirmed if it has a block_height
    if (!tx.status) {
      tx.status = {
        confirmed: !!tx.height,
        block_height: tx.height,
        block_time: tx.timestamp,
      };
    }
  }
}
