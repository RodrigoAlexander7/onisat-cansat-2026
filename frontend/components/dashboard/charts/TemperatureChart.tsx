import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const TEMPERATURE_EXTRACTORS: DataExtractor[] = [(p) => p.temp_bme280];

export function TemperatureChart() {
  const data = useChartData(TEMPERATURE_EXTRACTORS);

  const options = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => ({
    series: [
      {},
      { label: 'Temperature', stroke: '#f59e0b', width: 2, fill: 'rgba(245, 158, 11, 0.1)' } // Amber
    ],
    axes: [
      { label: 'Elapsed (s)', values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}s`) },
      { label: 'Temperature', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}°C`) }
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
      title="Temperature" 
      sensors={[
        { legend: 'Temperature', color: '#f59e0b', unit: '°C', sensor: 'BME280' }
      ]}
    />
  );
}
