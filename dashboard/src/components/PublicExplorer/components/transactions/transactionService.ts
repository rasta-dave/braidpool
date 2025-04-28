import { BraidTransaction } from './BraidTransaction';

export class TransactionService {
  private apiUrl = 'http://localhost:3100'; // Default to local API
  private transactionCache = new Map<string, BraidTransaction>();

  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  async getTransaction(txid: string): Promise<BraidTransaction> {
    // Check cache first
    if (this.transactionCache.has(txid)) {
      console.log('Using cached transaction:', txid);
      return this.transactionCache.get(txid)!;
    }

    console.log('Fetching transaction:', txid);

    try {
      const response = await fetch(`${this.apiUrl}/tx/${txid}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BraidTransaction = await response.json();
      this.processTxData(data);
      this.transactionCache.set(txid, data);

      console.log('Transaction data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(
        `Could not fetch transaction ${txid}: ${
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
