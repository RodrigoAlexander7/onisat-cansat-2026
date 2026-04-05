import { useEffect, useRef, useCallback } from 'react';
import { useTelemetryStore } from '../store/telemetry-store';
import { TELEMETRY_CONSTANTS } from '../lib/telemetry/constants';
import { CanSatStateMachine } from '../lib/telemetry/stateMachine';
import { RawTelemetryPacket } from '../lib/telemetry/types';

export function useTelemetry() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const stateMachineRef = useRef(new CanSatStateMachine());
  const setConnectionStatus = useTelemetryStore((state) => state.setConnectionStatus);
  const addPacket = useTelemetryStore((state) => state.addPacket);
  const reset = useTelemetryStore((state) => state.reset);

  const connect = useCallback(function connectWebSocket() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const ws = new WebSocket(TELEMETRY_CONSTANTS.WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: RawTelemetryPacket = JSON.parse(event.data);
        // Process telemetry (could add smoothing here if needed)
        const newState = stateMachineRef.current.evaluate(data);
        addPacket(data, newState);
      } catch (err) {
        console.error('Failed to parse telemetry packet:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      // Attempt reconnect after 3s
      reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      setConnectionStatus('error');
    };
  }, [addPacket, setConnectionStatus]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const resetMission = useCallback(() => {
    reset();
    stateMachineRef.current.reset();
  }, [reset]);

  return { resetMission };
}
