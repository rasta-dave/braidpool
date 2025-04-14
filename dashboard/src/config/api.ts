/**
 * API Configuration for Braidpool
 */

// VPS API URL for the public blockchain explorer
export const PUBLIC_API_URL =
  import.meta.env.VITE_PUBLIC_API_URL || 'https://french.braidpool.net/api';

// Internal API URL for the private dashboard
export const PRIVATE_API_URL =
  import.meta.env.VITE_PRIVATE_API_URL || 'http://localhost:8000/api';

// Default API parameters
export const DEFAULT_API_PARAMS = {
  timeout: 15000, // 15 seconds timeout
  retries: 3, // Number of retries on failure
};

// Update frequency (ms)
export const UPDATE_INTERVALS = {
  braid: 60000, // Update braid data every minute
  stats: 30000, // Update network stats every 30 seconds
  notifications: 15000, // Check for notifications every 15 seconds
};
