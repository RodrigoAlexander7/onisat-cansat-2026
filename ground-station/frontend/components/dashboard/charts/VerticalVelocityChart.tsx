import React, { useMemo } from 'react';
import uPlot from 'uplot';
import { UPlotWrapper } from './UPlotWrapper';
import { DataExtractor, useChartData } from './useChartData';

const VELOCITY_Z_EXTRACTORS: DataExtractor[] = [(p) => p.velocity_z];

export function VerticalVelocityChart() {
  const data = useChartData(VELOCITY_Z_EXTRACTORS);

  const options = useMemo<uPlot.Options>(() => ({
    series: [
      {},
      { label: 'Vel Z', stroke: '#10b981', width: 2, fill: 'rgba(16, 185, 129, 0.1)' } // Emerald
    ],
    axes: [
      { label: 'Time' },
      { label: 'Vertical Velocity', values: (_u, vals) => vals.map((v) => `${v.toFixed(1)}m/s`) }
    ],
    scales: {
      x: { time: true },
      y: { auto: true }
    }
  }), []);

  return <UPlotWrapper options={options} data={data} title="Vertical Velocity" />;
}
