import React from 'react';
import { useTelemetryStore } from '../../store/telemetry-store';
import { MissionState } from '../../lib/telemetry/types';

export function MissionStatusBadge() {
  const missionState = useTelemetryStore((state) => state.missionState);
  const connectionStatus = useTelemetryStore((state) => state.connectionStatus);

  const getStatusColor = () => {
    switch (missionState) {
      case MissionState.PRE_LAUNCH: return 'bg-slate-100 text-slate-700 border-slate-200';
      case MissionState.LIFT_ASCEND: return 'bg-orange-50 text-orange-700 border-orange-200';
      case MissionState.APOGEE: return 'bg-violet-50 text-violet-700 border-violet-200';
      case MissionState.FREE_FALL: return 'bg-red-50 text-red-700 border-red-200';
      case MissionState.AUTOGYRO_DEPLOYED: return 'bg-blue-50 text-blue-700 border-blue-200';
      case MissionState.LANDED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getConnectionDotColor = () => {
    if (connectionStatus === 'connected') return 'bg-emerald-500';
    if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className={`flex min-h-[34px] min-w-[160px] items-center justify-center rounded-md border px-3 py-1.5 text-sm font-bold uppercase tracking-wide ${getStatusColor()}`}>
        {missionState.replace(' / ', ' ')}
      </div>

      <div className="h-7 w-px bg-slate-200" aria-hidden="true" />

      <div className="inline-flex min-h-[32px] items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
        <span className={`h-2 w-2 rounded-full ${getConnectionDotColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
        {connectionStatus}
      </div>
    </div>
  );
}
