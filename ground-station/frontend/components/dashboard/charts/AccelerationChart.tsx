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

  const options = useMemo<uPlot.Options>(() => ({
    series: [
      {},
      { label: 'Acc X', stroke: '#ef4444', width: 1.5 }, // Red
      { label: 'Acc Y', stroke: '#22c55e', width: 1.5 }, // Green
      { label: 'Acc Z', stroke: '#3b82f6', width: 2 },   // Blue (Z is often the most important vertically)
    ],
    axes: [
      { label: 'Time' },
      { label: 'Acceleration', values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}g`) }
    ],
    scales: {
      x: { time: true },
      y: { auto: true }
    }
  }), []);

  return <UPlotWrapper options={options} data={data} title="3-Axis Acceleration" />;
}
