import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const GYRO_Z_EXTRACTORS: DataExtractor[] = [(p) => p.gyro_z];

export function GyroZChart() {
  const data = useChartData(GYRO_Z_EXTRACTORS);

  const options = useMemo<Omit<uPlot.Options, 'width' | 'height'>>(() => ({
    series: [
      {},
      { label: 'Gyro Z', stroke: '#6366f1', width: 2, fill: 'rgba(99, 102, 241, 0.1)' } // Indigo
    ],
    axes: [
      { label: 'Elapsed (s)', values: (_u, vals) => vals.map((v) => `${v.toFixed(0)}s`) },
      { label: 'Spin Rate', side: 1, values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}rpm`) }
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
      title="Gyro Z (Spin)" 
      sensors={[
        { legend: 'Gyro Z', color: '#6366f1', unit: '°/s', sensor: 'BMI160' }
      ]}
    />
  );
}
