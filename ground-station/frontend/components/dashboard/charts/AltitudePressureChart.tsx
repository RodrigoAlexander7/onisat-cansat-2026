import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const ALTITUDE_PRESSURE_EXTRACTORS: DataExtractor[] = [
  (p) => p.alt_ms5611,
  (p) => p.alt_bme280,
  (p) => p.pressure,
];

export function AltitudePressureChart() {
  const data = useChartData(ALTITUDE_PRESSURE_EXTRACTORS);

  const options = useMemo<uPlot.Options>(() => ({
    series: [
      {},
      { label: 'Alt MS5611', stroke: '#3b82f6', width: 2 }, // Blue
      { label: 'Alt BME280', stroke: '#8b5cf6', width: 2 }, // Purple
      { label: 'Pressure', stroke: '#ef4444', width: 2, scale: 'pressure' }, // Red
    ],
    axes: [
      { label: 'Time' },
      { label: 'Altitude', scale: 'y', values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}m`) },
      { label: 'Pressure', scale: 'pressure', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}hPa`), grid: { show: false } }
    ],
    scales: {
      x: { time: true },
      y: { auto: true },
      pressure: { auto: true }
    }
  }), []);

  return <UPlotWrapper options={options} data={data} title="Altitude & Pressure" />;
}
