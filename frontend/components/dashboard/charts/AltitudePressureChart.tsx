import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const ALTITUDE_PRESSURE_EXTRACTORS: DataExtractor[] = [
  (p) => p.alt_ms5611 ?? null,
  (p) => p.pres_ms5611 ?? null,
];

export function AltitudePressureChart() {
  const data = useChartData(ALTITUDE_PRESSURE_EXTRACTORS);

  const options = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => ({
    series: [
      {},
      { label: 'Alt MS5611', stroke: '#3b82f6', width: 2 }, // Blue
      { label: 'Pressure', stroke: '#ef4444', width: 2, scale: 'pressure' }, // Red
    ],
    axes: [
      { label: 'Elapsed (s)', values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}s`) },
      { label: 'Altitude', scale: 'y', values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}m`) },
      { label: 'Pressure', scale: 'pressure', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}Pa`), grid: { show: false } }
    ],
    scales: {
      x: { time: false },
      y: { auto: true },
      pressure: { auto: true }
    }
  }), []);

  return (
    <UPlotWrapper 
      options={options} 
      data={data} 
      title="Altitude & Pressure" 
      sensors={[
        { legend: 'Alt MS5611', color: '#3b82f6', unit: 'm', sensor: 'MS5611' },
        { legend: 'Pressure', color: '#ef4444', unit: 'Pa', sensor: 'MS5611' }
      ]}
    />
  );
}
