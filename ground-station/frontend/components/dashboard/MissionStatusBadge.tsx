import React from 'react';
import { useTelemetryStore } from '../../store/telemetry-store';
import { MissionState } from '../../lib/telemetry/types';

export function MissionStatusBadge() {
  const missionState = useTelemetryStore((state) => state.missionState);
  const connectionStatus = useTelemetryStore((state) => state.connectionStatus);

  const getStatusColor = () => {
    switch (missionState) {
      case MissionState.PRE_LAUNCH: return 'bg-gray-200 text-gray-700 border-gray-300';
      case MissionState.LIFT_ASCEND: return 'bg-orange-100 text-orange-800 border-orange-300';
      case MissionState.APOGEE: return 'bg-purple-100 text-purple-800 border-purple-300';
      case MissionState.FREE_FALL: return 'bg-red-100 text-red-800 border-red-300';
      case MissionState.AUTOGYRO_DEPLOYED: return 'bg-blue-100 text-blue-800 border-blue-300';
      case MissionState.LANDED: return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className={`flex items-center justify-center px-4 py-2 rounded-full border ${getStatusColor()} font-bold uppercase tracking-wide shadow-sm`}>
        {missionState}
      </div>
      <div className="flex items-center justify-end space-x-2 px-2 text-xs font-semibold text-gray-500">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <span className="uppercase">{connectionStatus}</span>
      </div>
    </div>
  );
}
