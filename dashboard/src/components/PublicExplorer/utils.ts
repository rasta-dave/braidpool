/**
 * Utility functions for the PublicExplorer components
 */

/**
 * Formats a Unix timestamp into a readable date string
 */
export function formatTimestamp(
  timestamp: number,
  shortFormat: boolean = false
): string {
  const date = new Date(timestamp);

  if (shortFormat) {
    return date.toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleString();
}

/**
 * Formats a Bitcoin value (in satoshis) into a BTC value with appropriate units
 */
export function formatBtcValue(satoshis: number): string {
  const btc = satoshis / 100000000;
  return `${btc.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })} BTC`;
}

/**
 * Formats a number adding commas for readability
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null) return 'N/A';
  return num.toLocaleString();
}

/**
 * Truncates a string (like a hash) for display purposes
 */
export function truncateString(str: string, visibleChars: number = 8): string {
  if (str.length <= visibleChars * 2) return str;
  return `${str.substring(0, visibleChars)}...${str.substring(
    str.length - visibleChars
  )}`;
}

/**
 * Format a large number with appropriate suffix (K, M, G, etc.)
 */
export function formatLargeNumber(num: number): string {
  if (num === null || num === undefined) return '0';

  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}G`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;

  return num.toString();
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

/**
 * Format hash difficulty to readable format
 */
export function formatDifficulty(difficulty: number): string {
  if (difficulty < 1000) return difficulty.toFixed(2);
  if (difficulty < 1000000) return `${(difficulty / 1000).toFixed(2)}K`;
  if (difficulty < 1000000000) return `${(difficulty / 1000000).toFixed(2)}M`;
  if (difficulty < 1000000000000)
    return `${(difficulty / 1000000000).toFixed(2)}B`;
  if (difficulty < 1000000000000000)
    return `${(difficulty / 1000000000000).toFixed(2)}T`;
  return `${(difficulty / 1000000000000000).toFixed(2)}P`;
}

/**
 * Calculate time difference from now in a human-readable format
 */
export function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}
