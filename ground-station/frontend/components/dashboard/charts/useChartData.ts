import { useMemo } from 'react';
import { useTelemetryStore } from '../../../store/telemetry-store';
import { AlignedData } from 'uplot';
import { ProcessedTelemetry } from '../../../lib/telemetry/types';

export type DataExtractor = (packet: ProcessedTelemetry) => number | null;
const MAX_RENDER_POINTS = 1500;

export function useChartData(extractors: DataExtractor[]): AlignedData {
  const history = useTelemetryStore((state) => state.history);

  const data = useMemo(() => {
    const times: number[] = [];
    const seriesData: number[][] = extractors.map(() => []);
    const step = Math.max(1, Math.ceil(history.length / MAX_RENDER_POINTS));

    for (let idx = 0; idx < history.length; idx += step) {
      const packet = history[idx];
      times.push(packet.time / 1000); // uPlot expects unix timestamp in seconds

      for (let i = 0; i < extractors.length; i++) {
        seriesData[i].push(extractors[i](packet) ?? 0);
      }
    }

    return [times, ...seriesData] as AlignedData;
  }, [history, extractors]);

  return data;
}
