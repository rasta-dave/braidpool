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
  timeout: 60000, // 60 seconds timeout (increased from 15s)
  retries: 3, // Number of retries on failure
};

// Update frequency (ms)
export const UPDATE_INTERVALS = {
  braid: 120000, // Update braid data every 2 minutes (increased from 1 min)
  stats: 60000, // Update network stats every minute (increased from 30s)
  notifications: 30000, // Check for notifications every 30 seconds (increased from 15s)
};
