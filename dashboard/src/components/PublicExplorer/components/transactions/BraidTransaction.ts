export interface BraidTransaction {
  // Core transaction properties
  txid: string;
  hash: string;
  version: number;
  size: number;
  weight: number;
  locktime: number;

  // Braidpool specific properties
  height: number;
  timestamp: number;
  work: number;
  parents: string[];
  miner: string;

  // Fee-related properties
  fee: number;
  feePerVsize: number;
  effectiveFeePerVsize?: number;
  adjustedFeePerVsize?: number;
  feeDelta?: number;

  // Block and status related properties
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };

  // Transaction content
  vin: BraidVin[];
  vout: BraidVout[];

  // Stats and calculations
  sigops?: number;
  adjustedVsize?: number;

  // CPFP-related properties
  ancestors?: Ancestor[];
  descendants?: Ancestor[];
  bestDescendant?: Ancestor;
  cpfpChecked?: boolean;

  // RBF-related data
  rbfReplaceable?: boolean;
  replacedBy?: string;
  replaces?: string[];

  // Flags
  flags?: bigint;

  // Acceleration-related properties
  acceleration?: boolean;
  acceleratedBy?: string;
  acceleratedAt?: number;

  // Additional data
  _outspends?: Outspend[];
  _channels?: any;
  _unblinded?: any;
  firstSeen?: number;

  // UI helpers
  '@vinLimit'?: number;
  '@vinLoaded'?: boolean;
  '@voutLimit'?: number;
  isNew?: boolean;
  changed?: string[];
  price?: number;
  addressValue?: number;
  largeInput?: boolean;
  largeOutput?: boolean;
}

export interface BraidVin {
  txid: string;
  vout: number;
  prevout?: BraidVout;
  scriptsig: string;
  scriptsig_asm: string;
  is_coinbase: boolean;
  sequence: number;
}

export interface BraidVout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address?: string;
  value: number;
}

export interface Outspend {
  spent: boolean;
  txid?: string;
  vin?: number;
}

export interface Ancestor {
  txid: string;
  weight: number;
  fee: number;
}
