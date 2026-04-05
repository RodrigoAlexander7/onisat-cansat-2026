import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const POWER_EXTRACTORS: DataExtractor[] = [
  (p) => p.voltage,
  (p) => p.current,
];

export function VoltageCurrentChart() {
  const data = useChartData(POWER_EXTRACTORS);

  const options = useMemo<uPlot.Options>(() => ({
    series: [
      {},
      { label: 'Voltage', stroke: '#eab308', width: 2 }, // Yellow
      { label: 'Current', stroke: '#14b8a6', width: 2, scale: 'current' }, // Teal
    ],
    axes: [
      { label: 'Time' },
      { label: 'Voltage', scale: 'y', values: (_u, vals) => vals.map((v) => `${v.toFixed(2)}V`) },
      { label: 'Current', scale: 'current', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}mA`), grid: { show: false } }
    ],
    scales: {
      x: { time: true },
      y: { auto: true },
      current: { auto: true }
    }
  }), []);

  return <UPlotWrapper options={options} data={data} title="Power Systems" />;
}
