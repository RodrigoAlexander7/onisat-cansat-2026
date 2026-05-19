import { create } from 'zustand';
import { ProcessedTelemetry, MissionState, StateMarker } from '../lib/telemetry/types';
import { TELEMETRY_CONSTANTS } from '../lib/telemetry/constants';

interface WindowState {
  min: number | null;
  max: number | null;
}

export interface ImageState {
  imageId: number | null;
  totalFrags: number;
  receivedFrags: number;
  totalBytes: number;
  bytesReceived: number;
  isComplete: boolean;
  isPartial: boolean;
  path: string | null;
}

interface TelemetryState {
  // Data
  history: ProcessedTelemetry[];
  currentPacket: ProcessedTelemetry | null;
  
  // Mission Status
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  missionState: MissionState;
  markers: StateMarker[];
  
  // Image State
  imageState: ImageState;
  
  // Chart sync state
  sharedWindow: WindowState;
  
  // Actions
  addPacket: (packet: ProcessedTelemetry, newState: MissionState) => void;
  addPackets: (items: Array<{ packet: ProcessedTelemetry; newState: MissionState }>) => void;
  setConnectionStatus: (status: TelemetryState['connectionStatus']) => void;
  setSharedWindow: (min: number | null, max: number | null) => void;
  updateImageProgress: (data: any) => void;
  setImageComplete: (data: any) => void;
  reset: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  history: [],
  currentPacket: null,
  
  connectionStatus: 'disconnected',
  missionState: MissionState.PRE_LAUNCH,
  markers: [],
  
  imageState: {
    imageId: null,
    totalFrags: 0,
    receivedFrags: 0,
    totalBytes: 0,
    bytesReceived: 0,
    isComplete: false,
    isPartial: false,
    path: null,
  },
  
  sharedWindow: { min: null, max: null },
  
  addPacket: (packet, newState) => {
    get().addPackets([{ packet, newState }]);
  },

  addPackets: (items) => set((state) => {
    if (items.length === 0) {
      return state;
    }

    const packets = items.map((item) => item.packet);
    let newHistory = state.history.concat(packets);

    // Enforce max length
    if (newHistory.length > TELEMETRY_CONSTANTS.MAX_HISTORY_LENGTH) {
      newHistory = newHistory.slice(-TELEMETRY_CONSTANTS.MAX_HISTORY_LENGTH);
    }

    let missionState = state.missionState;
    let markers = state.markers;

    for (const item of items) {
      if (missionState !== item.newState) {
        missionState = item.newState;
        markers = [...markers, { time: item.packet.timestamp_ms, state: missionState }];
      }
    }

    return {
      history: newHistory,
      currentPacket: packets[packets.length - 1],
      missionState,
      markers
    };
  }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setSharedWindow: (min, max) => set({ sharedWindow: { min, max } }),

  updateImageProgress: (data) => set((state) => ({
    imageState: {
      ...state.imageState,
      imageId: data.image_id,
      totalFrags: data.total_frags ?? state.imageState.totalFrags,
      receivedFrags: data.received_frags ?? state.imageState.receivedFrags,
      totalBytes: data.total_bytes ?? state.imageState.totalBytes,
      bytesReceived: data.bytes_received ?? state.imageState.bytesReceived,
      isComplete: false,
      isPartial: false,
    }
  })),

  setImageComplete: (data) => set((state) => ({
    imageState: {
      ...state.imageState,
      imageId: data.image_id,
      isComplete: true,
      isPartial: data.is_partial,
      path: data.path,
    }
  })),
  
  reset: () => set({
    history: [],
    currentPacket: null,
    connectionStatus: 'disconnected',
    missionState: MissionState.PRE_LAUNCH,
    markers: [],
    imageState: {
      imageId: null,
      totalFrags: 0,
      receivedFrags: 0,
      totalBytes: 0,
      bytesReceived: 0,
      isComplete: false,
      isPartial: false,
      path: null,
    },
    sharedWindow: { min: null, max: null }
  })
}));
