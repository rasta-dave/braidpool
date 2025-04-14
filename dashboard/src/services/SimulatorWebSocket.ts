/**
 * SimulatorWebSocket.ts
 *
 * Service to handle WebSocket connections to the Braidpool simulator.
 */

type MessageCallback = (data: any) => void;
type StatusCallback = (
  status: 'connecting' | 'connected' | 'disconnected' | 'error',
  error?: Error
) => void;

class SimulatorWebSocketService {
  private socket: WebSocket | null = null;
  private messageListeners: Map<string, Set<MessageCallback>> = new Map();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2; // Reduced from 5 to 2
  private reconnectDelay = 2000; // Starting delay in ms
  private lastConnectionFailTime = 0;
  private connectionFailCooldown = 60000; // 1 minute cooldown after consecutive failures

  // Check if mock data is enabled
  private useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

  constructor(private wsUrl: string) {}

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    // If mock data is enabled, don't even try to connect
    if (this.useMockData) {
      console.log('📄 Mock data is enabled, WebSocket connection skipped');
      this.notifyStatusChange('disconnected');
      return;
    }

    // Check if we've failed recently and are in cooldown period
    const now = Date.now();
    if (
      this.lastConnectionFailTime > 0 &&
      now - this.lastConnectionFailTime < this.connectionFailCooldown
    ) {
      console.log(
        `⏳ Connection in cooldown period after previous failures. Wait ${Math.round(
          (this.connectionFailCooldown - (now - this.lastConnectionFailTime)) /
            1000
        )}s`
      );
      this.notifyStatusChange(
        'error',
        new Error('Connection in cooldown period after previous failures')
      );
      return;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log('🔌 WebSocket already connected or connecting');
      return;
    }

    this.notifyStatusChange('connecting');
    console.log(`🔄 Connecting to WebSocket at ${this.wsUrl}...`);

    try {
      // Set a timeout to abort connection attempt if it takes too long
      const connectionTimeout = setTimeout(() => {
        console.warn('⌛ WebSocket connection attempt timed out');
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
          this.handleError(new Event('timeout'));
        }
      }, 5000); // 5 second timeout for initial connection

      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = (event) => {
        clearTimeout(connectionTimeout);
        this.handleOpen(event);
      };

      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);

      this.socket.onerror = (event) => {
        clearTimeout(connectionTimeout);
        this.handleError(event);
      };
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      this.notifyStatusChange(
        'error',
        error instanceof Error ? error : new Error(String(error))
      );
      this.recordConnectionFailure();
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
    this.notifyStatusChange('disconnected');
  }

  /**
   * Record a connection failure to track consecutive failures
   */
  private recordConnectionFailure(): void {
    this.lastConnectionFailTime = Date.now();
  }

  /**
   * Subscribe to a specific message type
   */
  public subscribe(messageType: string, callback: MessageCallback): () => void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, new Set());
    }

    this.messageListeners.get(messageType)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.messageListeners.get(messageType)?.delete(callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  public subscribeToStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    console.warn('⚠️ Cannot send message - WebSocket not connected');
    return false;
  }

  /**
   * Check if the WebSocket is currently connected
   */
  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  private handleOpen(event: Event): void {
    console.log('✅ WebSocket connected!');
    this.notifyStatusChange('connected');
    this.reconnectAttempts = 0;
    this.lastConnectionFailTime = 0; // Reset failure tracking on successful connection
  }

  private handleMessage(event: MessageEvent): void {
    console.log('📩 WebSocket message received');

    try {
      const data = JSON.parse(event.data);
      const messageType = data.type || 'unknown';

      console.log(`🔍 Message type: ${messageType}`);

      // Notify all listeners for this message type
      if (this.messageListeners.has(messageType)) {
        this.messageListeners.get(messageType)?.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error(
              `❌ Error in message listener for type ${messageType}:`,
              error
            );
          }
        });
      }

      // Notify 'all' listeners
      if (this.messageListeners.has('all')) {
        this.messageListeners.get('all')?.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('❌ Error in "all" message listener:', error);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error, event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`🔌 WebSocket disconnected: ${event.code} - ${event.reason}`);
    this.notifyStatusChange('disconnected');
    this.socket = null;

    // Record connection failure
    if (event.code !== 1000) {
      // Not a clean close
      this.recordConnectionFailure();
    }

    // Attempt to reconnect unless it was a clean close (code 1000)
    if (event.code !== 1000 && !this.useMockData) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('❌ WebSocket error:', event);
    this.notifyStatusChange('error', new Error('WebSocket connection error'));
    this.recordConnectionFailure();
  }

  private attemptReconnect(): void {
    if (this.useMockData) {
      console.log('📄 Mock data is enabled, skipping reconnection attempt');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`
      );
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(
      `🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Reconnecting...');
      this.connect();
    }, delay);
  }

  private notifyStatusChange(
    status: 'connecting' | 'connected' | 'disconnected' | 'error',
    error?: Error
  ): void {
    this.statusListeners.forEach((callback) => {
      try {
        callback(status, error);
      } catch (callbackError) {
        console.error('❌ Error in status listener:', callbackError);
      }
    });
  }
}

// Create and export a singleton instance
const wsUrl =
  import.meta.env.VITE_SIMULATOR_WS_URL || 'ws://french.braidpool.net:65433';
const simulatorWebSocket = new SimulatorWebSocketService(wsUrl);

export default simulatorWebSocket;
