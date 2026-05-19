import { useCallback } from 'react';
import { useTelemetryStore } from '../store/telemetry-store';

export function useSynchronizedChartWindow() {
  const { sharedWindow, setSharedWindow } = useTelemetryStore();

  const handleWindowChange = useCallback((min: number | null, max: number | null) => {
    // Only update if changed to avoid unnecessary re-renders
    if (sharedWindow.min !== min || sharedWindow.max !== max) {
      setSharedWindow(min, max);
    }
  }, [sharedWindow.min, sharedWindow.max, setSharedWindow]);

  return { sharedWindow, handleWindowChange };
}
