import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const POWER_EXTRACTORS: DataExtractor[] = [
  (p) => p.power_ina226,
  (p) => p.current_ina226,
];

export function VoltageCurrentChart() {
  const data = useChartData(POWER_EXTRACTORS);

  const options = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => ({
    series: [
      {},
      { label: 'Power', stroke: '#eab308', width: 2 }, // Yellow
      { label: 'Current', stroke: '#14b8a6', width: 2, scale: 'current' }, // Teal
    ],
    axes: [
      { label: 'Elapsed (s)', values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}s`) },
      { label: 'Power', scale: 'y', values: (_u, vals) => vals.map((v) => `${v.toFixed(2)}W`) },
      { label: 'Current', scale: 'current', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(2)}A`), grid: { show: false } }
    ],
    scales: {
      x: { time: false },
      y: { auto: true },
      current: { auto: true }
    }
  }), []);

  return (
    <UPlotWrapper 
      options={options} 
      data={data} 
      title="Power Systems" 
      sensors={[
        { legend: 'Power', color: '#eab308', unit: 'W', sensor: 'INA226' },
        { legend: 'Current', color: '#14b8a6', unit: 'A', sensor: 'INA226' }
      ]}
    />
  );
}
