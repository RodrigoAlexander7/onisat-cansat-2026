'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTelemetryStore } from '@/store/telemetry-store';
import { useTelemetry } from '@/hooks/useTelemetry';

const CanSatModel = dynamic(() => import('./CanSatModel').then(mod => mod.CanSatModel), { 
  ssr: false,
  loading: () => <div className="flex w-full h-full justify-center items-center text-gray-400 font-semibold">Loading 3D Render...</div>
});

export function RenderDashboard() {
  useTelemetry(); // Start WebSocket connection
  const currentPacket = useTelemetryStore((state) => state.currentPacket);
  const missionState = useTelemetryStore((state) => state.missionState);
  const imageState = useTelemetryStore((state) => state.imageState);

  const alt = currentPacket?.alt_ms5611?.toFixed(0) ?? '--';
  const velZ = currentPacket?.velocity_z?.toFixed(0) ?? '--';
  const gyroZ = currentPacket?.gyro_z ? (currentPacket.gyro_z / 6).toFixed(0) : '--';
  
  const stateStr = missionState || 'UNKNOWN';

  // Stats
  const received = currentPacket?.packets_received ?? 0;
  const lost = currentPacket?.packets_lost ?? 0;
  const transmitted = currentPacket?.packets_transmitted ?? 0;
  const successRate = transmitted > 0 ? ((received / transmitted) * 100).toFixed(1) : '100.0';

  const bytes = imageState.bytesReceived || 0;
  const total = imageState.totalBytes || 1;
  const percent = imageState.isComplete ? 100 : Math.min(100, Math.round((bytes / total) * 100));
  const percentStr = `${percent}%`;
  const bytesKB = (bytes / 1024).toFixed(0);
  const totalKB = imageState.totalBytes ? (imageState.totalBytes / 1024).toFixed(0) : '--';

  const [useUpscale, setUseUpscale] = useState(false);
  const hasUpscaled = Boolean(imageState.upscaledPath);
  const displayPath = useMemo(() => {
    if (useUpscale && imageState.upscaledPath) {
      return imageState.upscaledPath;
    }
    return imageState.path;
  }, [imageState.path, imageState.upscaledPath, useUpscale]);

  // Provide some mock values or best effort for the remaining UI fields
  const captureAltitude = currentPacket?.alt_ms5611 ? `${currentPacket.alt_ms5611.toFixed(0)} m` : '515 m';
  const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' CST';
  
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col lg:flex-row p-6 font-sans gap-8">
      
      {/* Left Column */}
      <div className="flex-1 flex flex-col min-w-0 lg:min-w-[60%]">
        
        {/* Header Left */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[#0033a0]">Last Processed Image Transmitted</h2>
            <div className="bg-[#046c4e] text-white text-xs font-bold px-2 py-1 rounded tracking-wide">
              STABLE LINK
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUseUpscale((prev) => !prev)}
            disabled={!hasUpscaled}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition ${
              hasUpscaled
                ? 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {useUpscale ? 'Upscale ON' : 'Upscale OFF'}
          </button>
        </div>

        {/* Image Display */}
        <div className="w-full aspect-video bg-black flex items-center justify-center overflow-hidden rounded shadow-sm border border-gray-200 mb-4 relative">
          {displayPath ? (
            <Image
              src={`/api/image/${encodeURIComponent(displayPath)}`}
              alt="Transmitted"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="text-gray-500 font-mono text-sm flex flex-col items-center">
              <span>NO IMAGE RECEIVED</span>
              <span>Waiting for transmission...</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col mb-8">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-bold text-gray-600 tracking-wide">{percent}% COMPLETE</span>
            <span className="text-xs font-bold text-gray-500">{imageState.isComplete ? `${totalKB} KB` : `${bytesKB} KB`} / {totalKB} KB</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#0033a0] transition-all duration-300"
              style={{ width: percentStr }}
            />
          </div>
        </div>

        {/* Bottom Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Image Capture Metadata */}
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 text-[#0033a0]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              <h3 className="font-bold text-xs text-gray-700 tracking-wide">IMAGE CAPTURE METADATA</h3>
            </div>
            <MetadataRow label="Capture Altitude" value={captureAltitude} />
            <MetadataRow label="Capture Time" value={currentTimeStr} />
            <MetadataRow label="Reception Time" value={currentTimeStr} />
            <div className="flex justify-between items-start text-xs">
              <span className="text-gray-400 font-medium">Transmission Duration<br/><span className="text-[10px]">(current image)</span></span>
              <span className="font-bold text-gray-800">10 s</span>
            </div>
          </div>

          {/* Card 2: Radio Link */}
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 text-[#b45309]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>
              <h3 className="font-bold text-xs text-gray-700 tracking-wide uppercase">RADIO LINK</h3>
            </div>
            <MetadataRow label="Packets Received" value={received.toString()} />
            <MetadataRow label="Packets Lost" value={lost.toString()} valueColor="text-red-600" />
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs font-medium">Success Rate</span>
                <span className="font-bold text-xs text-gray-800">{successRate}%</span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#046c4e]" style={{ width: `${successRate}%` }} />
              </div>
            </div>
          </div>

          {/* Card 3: Mission Timing */}
          <div className="bg-white p-4 rounded shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-[#0033a0]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <h3 className="font-bold text-xs text-gray-700 tracking-wide uppercase">Mission Timing</h3>
              </div>
              <div className="mb-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Processing End</span>
                <div className="flex items-baseline gap-1 text-[#0033a0]">
                  <span className="text-2xl font-bold">07</span>
                  <span className="text-[10px] font-bold uppercase">Seconds</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Landing Time</span>
                <div className="flex items-baseline gap-1 text-[#f97316]">
                  <span className="text-2xl font-bold">20</span>
                  <span className="text-[10px] font-bold uppercase">Seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-[400px] flex flex-col shrink-0">
        
        {/* Header Right */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0033a0] tracking-tight">ONISAT</h1>
          <div className="flex items-center text-[#046c4e] font-bold text-xs tracking-wide uppercase">
            <span className="mr-1 text-xl leading-none">&bull;</span> LIVE 3D Rendering
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="w-full aspect-square bg-white shadow-sm mb-6 flex justify-center items-center relative overflow-hidden border border-gray-100 rounded">
          <div className="absolute inset-0">
            <CanSatModel packet={currentPacket} />
          </div>
        </div>

        {/* Metrics */}
        <div className="w-full flex flex-col gap-2 mb-6">
          <MetricRow label="CURRENT ALTITUDE" value={`${alt} m`} />
          <MetricRow label="VERTICAL SPEED" value={`${velZ} m/s`} />
          <MetricRow label="SPIN RATE (GYRO Z)" value={`${gyroZ} RPM`} />
        </div>

        {/* Mission State */}
        <div className="w-full flex justify-between items-center border-t border-gray-300 pt-5 pb-6">
          <span className="font-bold text-gray-800 text-lg">Mission State</span>
          <span className="font-bold text-[#f97316] text-lg tracking-wider uppercase">{stateStr}</span>
        </div>

      </div>

    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#e5e7eb] px-4 py-3 flex justify-between items-center rounded-sm">
      <span className="font-bold text-gray-600 text-[11px] tracking-wide">{label}</span>
      <span className="font-bold text-[#0033a0] text-sm">{value}</span>
    </div>
  );
}

function MetadataRow({ label, value, valueColor = "text-gray-800" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className={`font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}
