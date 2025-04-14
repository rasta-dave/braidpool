import { useEffect, useState, useCallback, useRef } from 'react';
import simulatorWebSocket from '../services/SimulatorWebSocket';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseSimulatorWebSocketOptions {
  autoConnect?: boolean;
  messageTypes?: string[];
  fallbackToMock?: boolean;
}

interface UseSimulatorWebSocketResult<T> {
  status: WebSocketStatus;
  data: T | null;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  send: (data: any) => boolean;
  isConnected: () => boolean;
}

// Check if mock data is enabled in environment
const MOCK_DATA_ENABLED = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Hook to interact with the simulator WebSocket
 *
 * @param options Configuration options
 * @returns WebSocket state and methods
 */
export function useSimulatorWebSocket<T = any>(
  options: UseSimulatorWebSocketOptions = {}
): UseSimulatorWebSocketResult<T> {
  const {
    autoConnect = true,
    messageTypes = ['all'],
    fallbackToMock = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track if we're in mock mode
  const isMockMode = useRef(MOCK_DATA_ENABLED);
  // Use a ref to track connection attempts
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 2;

  // Handler for WebSocket messages
  const handleMessage = useCallback((receivedData: any) => {
    console.log('💾 Received data in hook:', receivedData);
    setData(receivedData);
  }, []);

  // Handler for WebSocket status changes
  const handleStatus = useCallback(
    (newStatus: WebSocketStatus, statusError?: Error) => {
      console.log(`🔄 WebSocket status changed to ${newStatus}`);
      setStatus(newStatus);

      if (statusError) {
        console.error('❌ WebSocket error:', statusError);
        setError(statusError);

        // If we've had too many errors and fallback is enabled, switch to mock mode
        if (fallbackToMock && !isMockMode.current) {
          connectionAttempts.current += 1;

          if (connectionAttempts.current >= maxConnectionAttempts) {
            console.warn(
              '⚠️ WebSocket error, falling back to HTTP API:',
              statusError
            );
            isMockMode.current = true;
            localStorage.setItem('useMockData', 'true');
          }
        }
      } else if (newStatus === 'connected') {
        setError(null);
        connectionAttempts.current = 0;
      }
    },
    [fallbackToMock]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isMockMode.current) {
      console.log('📄 Using mock data, skipping WebSocket connection');
      return;
    }
    simulatorWebSocket.connect();
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    simulatorWebSocket.disconnect();
  }, []);

  // Subscribe to WebSocket events on mount
  useEffect(() => {
    // Check stored preference for mock data
    const storedPreference = localStorage.getItem('useMockData');
    if (storedPreference === 'true') {
      isMockMode.current = true;
    }

    // If in mock mode, don't attempt to connect
    if (isMockMode.current) {
      console.log('📄 Using mock data, skipping WebSocket connection');
      setStatus('disconnected');
      return () => {}; // Empty cleanup
    }

    // Subscribe to status changes
    const statusUnsubscribe =
      simulatorWebSocket.subscribeToStatus(handleStatus);

    // Subscribe to message types
    const messageUnsubscribes = messageTypes.map((type) =>
      simulatorWebSocket.subscribe(type, handleMessage)
    );

    // Connect if autoConnect is true
    if (autoConnect) {
      simulatorWebSocket.connect();
    }

    // Cleanup subscriptions on unmount
    return () => {
      statusUnsubscribe();
      messageUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [autoConnect, handleMessage, handleStatus, messageTypes]);

  return {
    status,
    data,
    error,
    connect,
    disconnect,
    send: simulatorWebSocket.send.bind(simulatorWebSocket),
    isConnected: simulatorWebSocket.isConnected.bind(simulatorWebSocket),
  };
}

export default useSimulatorWebSocket;
