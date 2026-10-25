import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionBadge = () => {
  const { connectionStatus } = useSocket();

  if (connectionStatus === 'connected') {
    return (
      <div
        title="Real-time live queue synchronization active"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-semantic-successBg text-semantic-success border border-semantic-success/20 shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse-dot" />
        <span className="hidden sm:inline">Live Sync</span>
        <Wifi className="w-3.5 h-3.5 sm:hidden" />
      </div>
    );
  }

  if (connectionStatus === 'reconnecting') {
    return (
      <div
        title="Reconnecting to real-time updates..."
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-semantic-warningBg text-semantic-warning border border-semantic-warning/20 shadow-sm"
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Reconnecting</span>
      </div>
    );
  }

  return (
    <div
      title="Real-time connection offline. Click to refresh."
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-semantic-dangerBg text-semantic-danger border border-semantic-danger/20 shadow-sm"
    >
      <WifiOff className="w-3 h-3" />
      <span className="hidden sm:inline">Offline</span>
    </div>
  );
};

export default ConnectionBadge;
