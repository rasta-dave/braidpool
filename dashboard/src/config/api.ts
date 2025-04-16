/**
 * API Configuration for Braidpool
 */

// Public API URL (for the explorer)
export const PUBLIC_API_URL =
  import.meta.env.VITE_PUBLIC_API_URL || 'http://french.braidpool.net:65433';

// Private API URL (for the dashboard)
export const PRIVATE_API_URL =
  import.meta.env.VITE_PRIVATE_API_URL || 'http://localhost:5000';

// Default API parameters
export const DEFAULT_API_PARAMS = {
  timeout: 10000, // 10 seconds
  retries: 3,
};

// Update frequency (ms)
export const UPDATE_INTERVALS = {
  braid: 60000, // Update braid data every minute
  stats: 30000, // Update network stats every 30 seconds
  notifications: 15000, // Check for notifications every 15 seconds
};
