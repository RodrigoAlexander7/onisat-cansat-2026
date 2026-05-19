import React from 'react';
import { AltitudePressureChart } from './charts/AltitudePressureChart';
import { TemperatureChart } from './charts/TemperatureChart';
import { VerticalVelocityChart } from './charts/VerticalVelocityChart';
import { AccelerationChart } from './charts/AccelerationChart';
import { GyroZChart } from './charts/GyroZChart';
import { VoltageCurrentChart } from './charts/VoltageCurrentChart';

export function ChartGrid() {
  return (
    <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-0 bg-gray-50 overflow-hidden">
      <div className="min-h-0 flex">
        <AltitudePressureChart />
      </div>
      <div className="min-h-0 flex">
        <TemperatureChart />
      </div>
      <div className="min-h-0 flex">
        <VerticalVelocityChart />
      </div>
      
      <div className="min-h-0 flex">
        <AccelerationChart />
      </div>
      <div className="min-h-0 flex">
        <GyroZChart />
      </div>
      <div className="min-h-0 flex">
        <VoltageCurrentChart />
      </div>
    </div>
  );
}
