/**
 * WebSocket Hook
 * Custom React hook for WebSocket connections
 */
import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  count?: number;
  timestamp?: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: WebSocketMessage | null;
  reconnect: () => void;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export const useWebSocket = (
  shortCode: string,
  userId?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      // Build WebSocket URL
      const wsUrl = userId
        ? `${WS_BASE_URL}/api/v1/ws/${shortCode}?user_id=${userId}`
        : `${WS_BASE_URL}/api/v1/ws/${shortCode}`;

      console.log(`[WEBSOCKET] Connecting to ${wsUrl}`);

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log('[WEBSOCKET] Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        if (onConnect) {
          onConnect();
        }

        // Send initial ping
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      };

      // Listen for messages
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WEBSOCKET] Message received:', message);

          setLastMessage(message);

          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('[WEBSOCKET] Error parsing message:', error);
        }
      };

      // Connection closed
      ws.onclose = (event) => {
        console.log('[WEBSOCKET] Disconnected', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (onDisconnect) {
          onDisconnect();
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `[WEBSOCKET] Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.log('[WEBSOCKET] Max reconnection attempts reached');
        }
      };

      // Connection error
      ws.onerror = (error) => {
        console.error('[WEBSOCKET] Error:', error);

        if (onError) {
          onError(error);
        }
      };

    } catch (error) {
      console.error('[WEBSOCKET] Connection error:', error);
    }
  }, [shortCode, userId, onConnect, onDisconnect, onMessage, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WEBSOCKET] Cannot send message - not connected');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Heartbeat ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping', timestamp: Date.now() });
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    sendMessage,
    lastMessage,
    reconnect
  };
};

/**
 * Custom hook specifically for leaderboard WebSocket updates
 */
interface UseLeaderboardWebSocketOptions {
  onNewScore?: (scoreData: any) => void;
  onLeaderboardUpdate?: (leaderboardData: any) => void;
  onPlayerCountUpdate?: (count: number) => void;
}

export const useLeaderboardWebSocket = (
  shortCode: string,
  options: UseLeaderboardWebSocketOptions = {}
) => {
  const { onNewScore, onLeaderboardUpdate, onPlayerCountUpdate } = options;

  const [activePlayers, setActivePlayers] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const { isConnected, sendMessage, lastMessage } = useWebSocket(shortCode, undefined, {
    onMessage: (message) => {
      switch (message.type) {
        case 'connected':
          setActivePlayers(message.data?.active_players || 0);
          break;

        case 'player_count':
          const count = message.count || 0;
          setActivePlayers(count);
          if (onPlayerCountUpdate) {
            onPlayerCountUpdate(count);
          }
          break;

        case 'new_score':
          if (onNewScore) {
            onNewScore(message.data);
          }
          break;

        case 'leaderboard_update':
          if (message.data?.entries) {
            setLeaderboardData(message.data.entries);
            if (onLeaderboardUpdate) {
              onLeaderboardUpdate(message.data);
            }
          }
          break;

        case 'game_start':
          // Player started - could show notification
          break;

        case 'game_complete':
          // Player completed - could show notification
          break;
      }
    }
  });

  return {
    isConnected,
    activePlayers,
    leaderboardData,
    sendMessage
  };
};
