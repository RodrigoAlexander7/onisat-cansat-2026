import React from 'react';
import { SummaryCards } from './SummaryCards';
import { StartButton } from './StartButton';
import { MissionStatusBadge } from './MissionStatusBadge';

export function MissionHeader() {
  return (
    <header className="flex-none bg-white border-b shadow-sm h-[120px] px-6 py-4 flex items-center justify-between">
      {/* Left / Center: Summary Cards + Start */}
      <div className="flex items-center space-x-6">
        <SummaryCards />
        <StartButton />
      </div>

      {/* Right: Branding and State */}
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">ONISAT</h1>
            <p className="text-sm font-semibold tracking-widest text-blue-600 uppercase">Mission Control</p>
          </div>
          <MissionStatusBadge />
        </div>
      </div>
    </header>
  );
}
