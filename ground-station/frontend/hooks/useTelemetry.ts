import { useEffect, useRef, useCallback } from 'react';
import { useTelemetryStore } from '../store/telemetry-store';
import { TELEMETRY_CONSTANTS } from '../lib/telemetry/constants';
import { CanSatStateMachine } from '../lib/telemetry/stateMachine';
import { RawTelemetryPacket, MissionState } from '../lib/telemetry/types';

const FLUSH_INTERVAL_MS = 100;

export function useTelemetry() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const pendingPacketsRef = useRef<Array<{ packet: RawTelemetryPacket; newState: MissionState }>>([]);
  const hasFlushedRef = useRef(false);
  const stateMachineRef = useRef(new CanSatStateMachine());
  const setConnectionStatus = useTelemetryStore((state) => state.setConnectionStatus);
  const addPackets = useTelemetryStore((state) => state.addPackets);
  const updateImageProgress = useTelemetryStore((state) => state.updateImageProgress);
  const setImageComplete = useTelemetryStore((state) => state.setImageComplete);
  const reset = useTelemetryStore((state) => state.reset);

  const flushPendingPackets = useCallback(() => {
    if (pendingPacketsRef.current.length === 0) return;

    const batch = pendingPacketsRef.current;
    pendingPacketsRef.current = [];
    addPackets(batch);
  }, [addPackets]);

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
        const rawData = JSON.parse(event.data);
        
        if (rawData.type === 'image_start' || rawData.type === 'image_progress') {
          updateImageProgress(rawData);
          return;
        } else if (rawData.type === 'image_complete') {
          setImageComplete(rawData);
          return;
        } else if (rawData.type && rawData.type !== 'telemetry') {
          return;
        }

        const data = rawData as RawTelemetryPacket;
        // Process telemetry (could add smoothing here if needed)
        const newState = stateMachineRef.current.evaluate(data);
        pendingPacketsRef.current.push({ packet: data, newState });

        if (!hasFlushedRef.current) {
          hasFlushedRef.current = true;
          flushPendingPackets();
        }
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
  }, [flushPendingPackets, setConnectionStatus, setImageComplete, updateImageProgress]);

  useEffect(() => {
    connect();

    flushTimerRef.current = window.setInterval(flushPendingPackets, FLUSH_INTERVAL_MS);

    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      if (flushTimerRef.current !== null) {
        window.clearInterval(flushTimerRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop on unmount
        wsRef.current.close();
      }
    };
  }, [connect, flushPendingPackets]);

  const resetMission = useCallback(() => {
    reset();
    pendingPacketsRef.current = [];
    hasFlushedRef.current = false;
    stateMachineRef.current.reset();
  }, [reset]);

  return { resetMission };
}
