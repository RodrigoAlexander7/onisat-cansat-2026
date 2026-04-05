import { create } from 'zustand';
import { ProcessedTelemetry, MissionState, StateMarker } from '../lib/telemetry/types';
import { TELEMETRY_CONSTANTS } from '../lib/telemetry/constants';

interface WindowState {
  min: number | null;
  max: number | null;
}

interface TelemetryState {
  // Data
  history: ProcessedTelemetry[];
  currentPacket: ProcessedTelemetry | null;
  
  // Mission Status
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  missionState: MissionState;
  markers: StateMarker[];
  
  // Chart sync state
  sharedWindow: WindowState;
  
  // Actions
  addPacket: (packet: ProcessedTelemetry, newState: MissionState) => void;
  setConnectionStatus: (status: TelemetryState['connectionStatus']) => void;
  setSharedWindow: (min: number | null, max: number | null) => void;
  reset: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  history: [],
  currentPacket: null,
  
  connectionStatus: 'disconnected',
  missionState: MissionState.PRE_LAUNCH,
  markers: [],
  
  sharedWindow: { min: null, max: null },
  
  addPacket: (packet, newState) => set((state) => {
    const newHistory = [...state.history, packet];
    // Enforce max length
    if (newHistory.length > TELEMETRY_CONSTANTS.MAX_HISTORY_LENGTH) {
      newHistory.shift();
    }
    
    const updates: Partial<TelemetryState> = {
      history: newHistory,
      currentPacket: packet,
    };
    
    // Check if state changed
    if (state.missionState !== newState) {
      updates.missionState = newState;
      updates.markers = [...state.markers, { time: packet.time, state: newState }];
    }
    
    return updates;
  }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setSharedWindow: (min, max) => set({ sharedWindow: { min, max } }),
  
  reset: () => set({
    history: [],
    currentPacket: null,
    connectionStatus: 'disconnected',
    missionState: MissionState.PRE_LAUNCH,
    markers: [],
    sharedWindow: { min: null, max: null }
  })
}));
