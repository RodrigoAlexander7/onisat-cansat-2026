import React from 'react';
import { useTelemetryStore } from '../../store/telemetry-store';
import { MissionState } from '../../lib/telemetry/types';

function MetricCard({ title, value, unit }: { title: string, value: string | number, unit?: string }) {
  return (
    <div className="bg-white border text-gray-800 border-gray-200 rounded-lg p-3 shadow-sm flex items-center space-x-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline space-x-1">
          <span className="text-lg font-bold font-mono">{value}</span>
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export function SummaryCards() {
  const currentPacket = useTelemetryStore((state) => state.currentPacket);
  const missionState = useTelemetryStore((state) => state.missionState);

  const elapsedFormat = currentPacket?.time
    ? (() => {
    const t = new Date(currentPacket.time);
    const hrs = String(t.getUTCHours()).padStart(2, '0');
    const mins = String(t.getUTCMinutes()).padStart(2, '0');
    const secs = String(t.getUTCSeconds()).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
      })()
    : '00:00:00';

  // Fallback defaults
  const press = currentPacket?.pressure?.toFixed(1) ?? '--';
  const temp = currentPacket?.temperature?.toFixed(1) ?? '--';
  const velZ = currentPacket?.velocity_z?.toFixed(1) ?? '--';
  const acc = currentPacket ? Math.sqrt(
    Math.pow(currentPacket.accel_x, 2) + 
    Math.pow(currentPacket.accel_y, 2) + 
    Math.pow(currentPacket.accel_z, 2)
  ).toFixed(1) : '--';
  
  const pkts = currentPacket?.packets_received ?? '--';
  const volt = currentPacket?.voltage?.toFixed(2) ?? '--';

  return (
    <div className="flex space-x-6">
      {/* Group 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Pressure" value={press} unit="hPa" />
        <MetricCard title="Temperature" value={temp} unit="°C" />
        <MetricCard title="Vert Vel (Z)" value={velZ} unit="m/s" />
        <MetricCard title="Acceleration" value={acc} unit="m/s²" />
      </div>

      {/* Group 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Status" value={missionState === MissionState.PRE_LAUNCH ? 'IDLE' : missionState.substring(0, 8)} unit="" />
        <MetricCard title="Packets" value={pkts} unit="" />
        <MetricCard title="Voltage" value={volt} unit="V" />
        <MetricCard title="Elapsed" value={elapsedFormat} unit="" />
      </div>
    </div>
  );
}
