import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const ACCEL_EXTRACTORS: DataExtractor[] = [
  (p) => p.accel_x,
  (p) => p.accel_y,
  (p) => p.accel_z,
];

export function AccelerationChart() {
  const data = useChartData(ACCEL_EXTRACTORS);

  const options = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => ({
    series: [
      {},
      { label: 'Acc X', stroke: '#ef4444', width: 1.5 }, // Red
      { label: 'Acc Y', stroke: '#22c55e', width: 1.5 }, // Green
      { label: 'Acc Z', stroke: '#3b82f6', width: 2 },   // Blue (Z is often the most important vertically)
    ],
    axes: [
      { label: 'Elapsed (s)', values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}s`) },
      { label: 'Acceleration', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}g`) }
    ],
    scales: {
      x: { time: false },
      y: { auto: true }
    }
  }), []);

  return (
    <UPlotWrapper 
      options={options} 
      data={data} 
      title="3-Axis Acceleration" 
      sensors={[
        { legend: 'Acc X', color: '#ef4444', unit: 'm/s²', sensor: 'BMI160' },
        { legend: 'Acc Y', color: '#22c55e', unit: 'm/s²', sensor: 'BMI160' },
        { legend: 'Acc Z', color: '#3b82f6', unit: 'm/s²', sensor: 'BMI160' }
      ]}
    />
  );
}
