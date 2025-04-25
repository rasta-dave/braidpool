/**
 * Formats a Unix timestamp into a readable date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
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
 * Truncates a string (like a hash) for display purposes
 */
export function truncateString(str: string, visibleChars: number = 8): string {
  if (str.length <= visibleChars * 2) return str;
  return `${str.substring(0, visibleChars)}...${str.substring(
    str.length - visibleChars
  )}`;
}
