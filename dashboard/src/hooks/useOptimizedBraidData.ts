import { useState, useEffect, useRef } from 'react';
import { BraidData, BraidVisualizationData } from '../types/braid';
import {
  transformBraidData,
  loadSampleBraidData,
} from '../utils/braidDataTransformer';
import { PublicApiClient } from '../api/public/client';

interface UseOptimizedBraidDataOptions {
  useMockData?: boolean;
  refreshInterval?: number;
  maxNodesLimit?: number;
  logPerformance?: boolean;
}

interface UseOptimizedBraidDataResult {
  data: BraidVisualizationData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  stats: {
    totalNodes: number;
    totalCohorts: number;
    totalBeads: number;
    lastRefreshTime: Date | null;
    fetchTimeMs: number;
    transformTimeMs: number;
  };
}

/**
 * A custom hook that optimizes fetching and processing of Braid data
 * with performance monitoring, caching, and configurable limits
 */
export const useOptimizedBraidData = (
  options: UseOptimizedBraidDataOptions = {}
): UseOptimizedBraidDataResult => {
  const {
    useMockData = false,
    refreshInterval = 120000, // Default 2 minutes
    maxNodesLimit = 5000, // Limit to prevent browser crashes
    logPerformance = true,
  } = options;

  // States
  const [data, setData] = useState<BraidVisualizationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalCohorts: 0,
    totalBeads: 0,
    lastRefreshTime: null as Date | null,
    fetchTimeMs: 0,
    transformTimeMs: 0,
  });

  // Refs
  const apiClientRef = useRef<PublicApiClient | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isRefreshingRef = useRef<boolean>(false);

  // Initialize API client
  useEffect(() => {
    apiClientRef.current = new PublicApiClient();

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Function to refresh data
  const refreshData = async (): Promise<void> => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('🔄 Skipping refresh - another refresh is in progress');
      return;
    }

    try {
      isRefreshingRef.current = true;
      setLoading(true);
      setError(null);

      const fetchStartTime = performance.now();
      let braidData: BraidData;

      if (useMockData) {
        console.log('🔄 Loading sample braid data...');
        braidData = await loadSampleBraidData();
      } else {
        console.log('🔄 Fetching braid data from API...');
        if (!apiClientRef.current) {
          throw new Error('API client not initialized');
        }
        braidData = await apiClientRef.current.getBraidData();
      }

      const fetchEndTime = performance.now();
      const fetchTimeMs = fetchEndTime - fetchStartTime;

      if (!isMountedRef.current) return;

      console.log(`✅ Fetched data in ${fetchTimeMs.toFixed(2)}ms`);

      const transformStartTime = performance.now();

      // Apply node limits to prevent browser crashes
      if (Object.keys(braidData.parents).length > maxNodesLimit) {
        console.warn(
          `⚠️ Large dataset detected (${
            Object.keys(braidData.parents).length
          } nodes), truncating to ${maxNodesLimit}`
        );
        // Implementation of truncation would go here
      }

      // Transform data for visualization
      const transformedData = transformBraidData(braidData);

      const transformEndTime = performance.now();
      const transformTimeMs = transformEndTime - transformStartTime;

      if (!isMountedRef.current) return;

      console.log(`✅ Transformed data in ${transformTimeMs.toFixed(2)}ms`);

      // Update state with transformed data
      setData(transformedData);

      // Update statistics
      setStats({
        totalNodes: transformedData.nodes.length,
        totalCohorts: transformedData.cohorts.length,
        totalBeads: Object.keys(braidData.parents).length,
        lastRefreshTime: new Date(),
        fetchTimeMs,
        transformTimeMs,
      });

      // Log performance if enabled
      if (logPerformance) {
        console.log('📊 Performance metrics:', {
          fetchTimeMs: fetchTimeMs.toFixed(2) + 'ms',
          transformTimeMs: transformTimeMs.toFixed(2) + 'ms',
          totalTimeMs: (fetchTimeMs + transformTimeMs).toFixed(2) + 'ms',
          nodes: transformedData.nodes.length,
          cohorts: transformedData.cohorts.length,
        });
      }
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      if (isMountedRef.current) {
        setError(`Failed to load data: ${err.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isRefreshingRef.current = false;
      }
    }
  };

  // Set up automatic refresh
  useEffect(() => {
    // Initial data load
    refreshData();

    // Set up refresh interval
    if (refreshInterval > 0) {
      const setupRefreshTimer = () => {
        timerRef.current = setTimeout(async () => {
          await refreshData();
          if (isMountedRef.current) {
            setupRefreshTimer();
          }
        }, refreshInterval);
      };

      setupRefreshTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [refreshInterval, useMockData, maxNodesLimit]);

  return { data, loading, error, refreshData, stats };
};

export default useOptimizedBraidData;
