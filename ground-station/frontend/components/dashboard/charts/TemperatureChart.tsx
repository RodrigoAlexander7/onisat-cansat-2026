import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const TEMPERATURE_EXTRACTORS: DataExtractor[] = [(p) => p.temperature];

export function TemperatureChart() {
  const data = useChartData(TEMPERATURE_EXTRACTORS);

  const options = useMemo<uPlot.Options>(() => ({
    series: [
      {},
      { label: 'Temperature', stroke: '#f59e0b', width: 2, fill: 'rgba(245, 158, 11, 0.1)' } // Amber
    ],
    axes: [
      { label: 'Time' },
      { label: 'Temperature', values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}°C`) }
    ],
    scales: {
      x: { time: true },
      y: { auto: true }
    }
  }), []);

  return <UPlotWrapper options={options} data={data} title="Temperature" />;
}
