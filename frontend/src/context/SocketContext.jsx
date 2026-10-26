import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

let rawSocketUrl = (
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') ||
  'http://localhost:5000'
).trim();
if (rawSocketUrl.endsWith('/')) rawSocketUrl = rawSocketUrl.slice(0, -1);
const SOCKET_URL = rawSocketUrl;

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'connected' | 'reconnecting' | 'offline'
  const socketRef = useRef(null);
  const activeRoomsRef = useRef(new Set());

  // Initialize or re-authenticate socket on token change
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token: token || null },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', socket.id);
      setConnectionStatus('connected');

      // Re-join any previously tracked queue rooms on reconnection
      activeRoomsRef.current.forEach((room) => {
        socket.emit('join:queue', room);
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected the socket explicitly
        socket.connect();
      }
      setConnectionStatus('offline');
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket Connection Error]:', error.message);
      setConnectionStatus('reconnecting');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Join a specific queue room
  const joinQueueRoom = useCallback((queueSessionId) => {
    if (!queueSessionId) return;
    activeRoomsRef.current.add(queueSessionId);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join:queue', queueSessionId);
    }
  }, []);

  // Leave a specific queue room
  const leaveQueueRoom = useCallback((queueSessionId) => {
    if (!queueSessionId) return;
    activeRoomsRef.current.delete(queueSessionId);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave:queue', queueSessionId);
    }
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connectionStatus,
      joinQueueRoom,
      leaveQueueRoom,
      isConnected: connectionStatus === 'connected',
    }),
    [connectionStatus, joinQueueRoom, leaveQueueRoom]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
