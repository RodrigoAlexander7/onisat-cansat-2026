import React from 'react';
import { useTelemetryStore } from '../../store/telemetry-store';

function MetricCard({ title, value, unit }: { title: string, value: string | number, unit?: string }) {
  return (
    <div className="min-h-[58px] min-w-[108px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <div className="mt-1 flex items-baseline gap-1 text-slate-900">
        <span className="text-base font-bold font-mono leading-none md:text-lg">{value}</span>
        {unit && <span className="text-[10px] font-medium text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export function SummaryCards() {
  const currentPacket = useTelemetryStore((state) => state.currentPacket);

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
  const alt = currentPacket?.alt_ms5611?.toFixed(1) ?? '--';
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
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-1.5">
          <MetricCard title="Altitude" value={alt} unit="m" />
          <MetricCard title="Pressure" value={press} unit="hPa" />
          <MetricCard title="Temperature" value={temp} unit="°C" />
          <MetricCard title="Vert Vel (Z)" value={velZ} unit="m/s" />
        </div>

        <div className="h-10 w-px bg-slate-200" aria-hidden="true" />

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 p-1.5">
          <MetricCard title="Acceleration" value={acc} unit="m/s²" />
          <MetricCard title="Voltage" value={volt} unit="V" />
          <MetricCard title="Packets" value={pkts} />
          <MetricCard title="Elapsed" value={elapsedFormat} />
        </div>
      </div>
    </div>
  );
}
