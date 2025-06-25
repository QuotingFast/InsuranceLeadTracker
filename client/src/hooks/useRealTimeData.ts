import { useState, useEffect } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { useQueryClient } from '@tanstack/react-query';

interface RealTimeData {
  isConnected: boolean;
  hasNewAlerts: boolean;
  lastUpdate: Date | null;
}

export function useRealTimeData() {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    isConnected: false,
    hasNewAlerts: false,
    lastUpdate: null
  });

  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    setRealTimeData(prev => ({
      ...prev,
      isConnected
    }));
  }, [isConnected]);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
      setRealTimeData(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_lead':
        // Invalidate leads queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/leads/recent'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        break;

      case 'sms_sent':
        // Invalidate SMS stats
        queryClient.invalidateQueries({ queryKey: ['/api/sms/status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        break;

      case 'sms_status_update':
        // Update SMS delivery stats
        queryClient.invalidateQueries({ queryKey: ['/api/sms/status'] });
        break;

      case 'quote_viewed':
        // Update quote analytics
        queryClient.invalidateQueries({ queryKey: ['/api/quotes/analytics'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        break;

      case 'custom_sms_sent':
        // Refresh custom SMS status
        console.log('Custom SMS sent:', message.data);
        break;

      case 'emergency_stop':
        // Update emergency stop status
        queryClient.invalidateQueries({ queryKey: ['/api/emergency/status'] });
        setRealTimeData(prev => ({
          ...prev,
          hasNewAlerts: true
        }));
        break;

      case 'system_alert':
        // New system alert
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        setRealTimeData(prev => ({
          ...prev,
          hasNewAlerts: true
        }));
        break;

      case 'opt_out':
        // Update opt-out stats
        queryClient.invalidateQueries({ queryKey: ['/api/optouts/stats'] });
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const clearAlerts = () => {
    setRealTimeData(prev => ({
      ...prev,
      hasNewAlerts: false
    }));
  };

  return {
    ...realTimeData,
    clearAlerts
  };
}
