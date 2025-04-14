import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { PublicApiClient } from '../../../api/public/client';
import { PUBLIC_API_URL } from '../../../config/api';

// Initialize API client
const publicApiClient = new PublicApiClient();

// Define endpoint status type
type EndpointStatus = {
  name: string;
  path: string;
  status: 'success' | 'error' | 'loading';
  error?: string;
  responseTime?: number;
};

const MOCK_DATA_ENABLED = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Component to display API connection status and provide retry functionality
 */
const ApiStatusIndicator: React.FC = () => {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Braid Data', path: '/braid', status: 'loading' },
    { name: 'Network Stats', path: '/stats', status: 'loading' },
    { name: 'Recent Beads', path: '/beads/recent', status: 'loading' },
    { name: 'Search', path: '/search', status: 'loading' },
    { name: 'Bead Details', path: '/bead/:hash', status: 'loading' },
  ]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [useMockData, setUseMockData] = useState(MOCK_DATA_ENABLED);
  const [checkAbortController, setCheckAbortController] =
    useState<AbortController | null>(null);

  // Test all endpoints
  const checkApiStatus = async () => {
    // If already checking, cancel the previous check
    if (checkAbortController) {
      console.log('🛑 Canceling previous API check');
      checkAbortController.abort();
    }

    // Create a new abort controller for this check
    const controller = new AbortController();
    setCheckAbortController(controller);

    setIsChecking(true);

    // Update all endpoints to loading state
    setEndpoints((prev) =>
      prev.map((endpoint) => ({
        ...endpoint,
        status: 'loading',
        error: undefined,
        responseTime: undefined,
      }))
    );

    try {
      // First, do a simple health check
      console.log('🔍 Checking API health...');
      const isApiHealthy = await publicApiClient.checkHealth();

      if (!isApiHealthy && !useMockData) {
        console.warn(
          '⚠️ API health check failed, using mock data if available'
        );
        setEndpoints((prev) =>
          prev.map((endpoint) => ({
            ...endpoint,
            status: 'error',
            error: 'API unavailable',
          }))
        );
        setLastChecked(new Date());
        setIsChecking(false);
        return;
      }

      // Check endpoints if the API is healthy or we're using mock data
      await Promise.all([
        checkEndpoint('Braid Data', async () => {
          const startTime = performance.now();
          await publicApiClient.getBraidData();
          return Math.round(performance.now() - startTime);
        }),
        checkEndpoint('Network Stats', async () => {
          const startTime = performance.now();
          await publicApiClient.getNetworkStats();
          return Math.round(performance.now() - startTime);
        }),
        checkEndpoint('Recent Beads', async () => {
          const startTime = performance.now();
          await publicApiClient.getRecentBeads(1);
          return Math.round(performance.now() - startTime);
        }),
        checkEndpoint('Search', async () => {
          const startTime = performance.now();
          await publicApiClient.searchBeads('000');
          return Math.round(performance.now() - startTime);
        }),
        checkEndpoint('Bead Details', async () => {
          const startTime = performance.now();
          try {
            // First try with a realistic hash from test data
            const testData = await publicApiClient.getBraidData();
            // Get the first bead hash from the test data
            const beadHashes = Object.keys(testData.parents);
            if (beadHashes.length > 0) {
              const hash = beadHashes[0];
              await publicApiClient.getBeadByHash(hash);
              return Math.round(performance.now() - startTime);
            }
            // Return a fallback time if we didn't return above
            return Math.round(performance.now() - startTime);
          } catch {
            // Fallback to a dummy hash if we can't get a real one
            await publicApiClient.getBeadByHash(
              '0000000000000000000000000000000000000000000000000000000000000000'
            );
            return Math.round(performance.now() - startTime);
          }
        }),
      ]);
    } catch (error) {
      console.error('❌ Error during API status check:', error);
    } finally {
      setCheckAbortController(null);
      setLastChecked(new Date());
      setIsChecking(false);
    }
  };

  // Helper function to check a single endpoint
  const checkEndpoint = async (
    name: string,
    checkFn: () => Promise<number>
  ) => {
    try {
      const responseTime = await checkFn();
      updateEndpointStatus(name, 'success', undefined, responseTime);
    } catch (error: any) {
      updateEndpointStatus(name, 'error', String(error));
    }
  };

  // Update status of a specific endpoint
  const updateEndpointStatus = (
    name: string,
    status: 'success' | 'error' | 'loading',
    error?: string,
    responseTime?: number
  ) => {
    setEndpoints((prev) =>
      prev.map((endpoint) =>
        endpoint.name === name
          ? { ...endpoint, status, error, responseTime }
          : endpoint
      )
    );
  };

  // Handle mock data toggle
  const handleToggleMockData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useMock = event.target.checked;
    setUseMockData(useMock);
    localStorage.setItem('useMockData', String(useMock));

    // Re-check API status
    checkApiStatus();
  };

  // Check API status on component mount
  useEffect(() => {
    // Check for stored preference
    const storedPreference = localStorage.getItem('useMockData');
    if (storedPreference !== null) {
      setUseMockData(storedPreference === 'true');
    }

    // Set up periodic health checks
    const checkInterval = setInterval(() => {
      // Only do periodic checks if not already checking and not in mock mode
      if (!isChecking && !useMockData) {
        checkApiStatus();
      }
    }, 60000); // Check API health every minute

    // Initial check
    checkApiStatus();

    // Cleanup function to abort any in-progress checks when unmounting
    return () => {
      if (checkAbortController) {
        checkAbortController.abort();
      }
      clearInterval(checkInterval);
    };
  }, []); // Empty dependency array to run only on mount

  // Count statuses
  const successCount = endpoints.filter((e) => e.status === 'success').length;
  const errorCount = endpoints.filter((e) => e.status === 'error').length;
  const loadingCount = endpoints.filter((e) => e.status === 'loading').length;

  // Calculate overall status
  let overallStatus = 'unknown';
  if (loadingCount > 0) {
    overallStatus = 'checking';
  } else if (errorCount === 0) {
    overallStatus = 'online';
  } else if (successCount === 0) {
    overallStatus = 'offline';
  } else {
    overallStatus = 'partial';
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' sx={{ mr: 2 }}>
          API Connection Status
        </Typography>

        {/* Overall status indicator */}
        {overallStatus === 'online' && (
          <Chip
            icon={<CheckCircleOutlineIcon />}
            label='All Endpoints Online'
            color='success'
            variant='outlined'
            size='small'
          />
        )}

        {overallStatus === 'offline' && (
          <Chip
            icon={<ErrorOutlineIcon />}
            label='API Offline'
            color='error'
            variant='outlined'
            size='small'
          />
        )}

        {overallStatus === 'partial' && (
          <Chip
            icon={<ErrorOutlineIcon />}
            label={`${errorCount} of ${endpoints.length} Endpoints Failing`}
            color='warning'
            variant='outlined'
            size='small'
          />
        )}

        {overallStatus === 'checking' && (
          <Chip
            icon={<CircularProgress size={16} />}
            label='Checking Connection'
            color='primary'
            variant='outlined'
            size='small'
          />
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Mock data toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={useMockData}
              onChange={handleToggleMockData}
              color='primary'
            />
          }
          label='Use Mock Data'
          sx={{ mr: 2 }}
        />

        {/* Last checked time */}
        {lastChecked && (
          <Typography variant='caption' color='text.secondary' sx={{ mr: 2 }}>
            Last checked: {lastChecked.toLocaleTimeString()}
          </Typography>
        )}

        {/* Refresh button */}
        <Button
          variant='outlined'
          size='small'
          startIcon={
            isChecking ? <CircularProgress size={16} /> : <RefreshIcon />
          }
          onClick={checkApiStatus}
          disabled={isChecking}>
          {isChecking ? 'Checking...' : 'Check Now'}
        </Button>
      </Box>

      {/* Display API connection issues warning if needed */}
      {errorCount > 0 && (
        <Alert
          severity={errorCount === endpoints.length ? 'error' : 'warning'}
          sx={{ mb: 2 }}>
          <AlertTitle>
            {errorCount === endpoints.length
              ? 'API Connection Issues'
              : 'Some API Endpoints Failing'}
          </AlertTitle>
          {errorCount === endpoints.length
            ? 'The API is not responding. The explorer will use mock data if available.'
            : 'Some API endpoints are not responding. The explorer may not display all data correctly.'}
        </Alert>
      )}

      {/* Endpoint list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {endpoints.map((endpoint) => (
          <Box
            key={endpoint.name}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}>
            <Typography
              variant='body2'
              sx={{ width: '150px', fontWeight: 'bold' }}>
              {endpoint.name}
            </Typography>

            <Typography
              variant='body2'
              sx={{ color: 'text.secondary', width: '150px' }}>
              {endpoint.path}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            {endpoint.status === 'success' && (
              <>
                <Chip
                  label='Success'
                  color='success'
                  size='small'
                  sx={{ mr: 1 }}
                />
                {endpoint.responseTime && (
                  <Typography variant='caption' color='text.secondary'>
                    {endpoint.responseTime}ms
                  </Typography>
                )}
              </>
            )}

            {endpoint.status === 'error' && (
              <>
                <Chip
                  label='Failed'
                  color='error'
                  size='small'
                  sx={{ mr: 1 }}
                />
                <Typography variant='caption' color='error'>
                  {endpoint.error}
                </Typography>
              </>
            )}

            {endpoint.status === 'loading' && (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            )}
          </Box>
        ))}
      </Box>

      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mt: 2, display: 'block' }}>
        API Endpoint: {PUBLIC_API_URL} — Connection attempts will retry 3 times
        with exponential backoff before failing.
      </Typography>
    </Box>
  );
};

export default ApiStatusIndicator;
