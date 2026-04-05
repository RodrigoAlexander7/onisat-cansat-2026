'use client';

import React from 'react';
import { MissionHeader } from '../components/dashboard/MissionHeader';
import { ChartGrid } from '../components/dashboard/ChartGrid';
import { useTelemetry } from '../hooks/useTelemetry';

export default function DashboardPage() {
  // Initialize the WebSocket connection and state machine on mount
  useTelemetry();

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gray-50 font-sans">
      <MissionHeader />
      <ChartGrid />
    </div>
  );
}
