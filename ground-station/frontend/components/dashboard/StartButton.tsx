import React from 'react';
import { Play } from 'lucide-react';
import { useTelemetryStore } from '../../store/telemetry-store';
import { MissionState } from '../../lib/telemetry/types';

export function StartButton() {
  const missionState = useTelemetryStore((state) => state.missionState);
  
  const isStarted = missionState !== MissionState.PRE_LAUNCH;

  return (
    <button
      disabled={isStarted}
      className={`
        flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-bold text-white shadow-lg transition-all
        ${isStarted 
          ? 'bg-gray-400 cursor-not-allowed opacity-50'
          : 'bg-green-600 hover:bg-green-500 active:scale-95'
        }
      `}
      onClick={() => {
        // Typically, we don't start the mission from frontend,
        // The start of the mission relies on actual hardware telemetry (state machine transitioning out of PRE_LAUNCH).
        // But if this button triggers something on backend, we could send a command here.
        // For now, it's a visual element per requirements.
        console.log('Start command initiated');
      }}
    >
      <Play className="w-6 h-6" fill="currentColor" />
      <span className="uppercase tracking-widest text-lg">Start</span>
    </button>
  );
}
