import React, { useEffect, useRef, useMemo, useState } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { useTelemetryStore } from '../../../store/telemetry-store';

interface UPlotWrapperProps {
  options: uPlot.Options;
  data: uPlot.AlignedData;
  title: string;
}

// Ensure all charts sync their cursors
const syncCursor = uPlot.sync('dash-sync');

const FALLBACK_WIDTH = 400;
const FALLBACK_HEIGHT = 250;
const PIXELS_PER_POINT = 3;
const MAX_PLOT_WIDTH = 12000;

export function UPlotWrapper({ options, data, title }: UPlotWrapperProps) {
  const chartHostRef = useRef<HTMLDivElement>(null);
  const autoFollowRef = useRef(true);
  const markers = useTelemetryStore((state) => state.markers);
  const [size, setSize] = useState({ width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT });
  const pointCount = data[0]?.length ?? 0;
  const plotWidth = useMemo(() => {
    const dataDrivenWidth = pointCount * PIXELS_PER_POINT;
    return Math.min(MAX_PLOT_WIDTH, Math.max(size.width, dataDrivenWidth));
  }, [pointCount, size.width]);

  useEffect(() => {
    if (!chartHostRef.current) return;

    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = Math.max(300, Math.floor(entry.contentRect.width));
      const nextHeight = Math.max(170, Math.floor(entry.contentRect.height));

      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setSize((prev) => {
          if (prev.width === nextWidth && prev.height === nextHeight) {
            return prev;
          }

          return { width: nextWidth, height: nextHeight };
        });
      });
    });

    observer.observe(chartHostRef.current);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!chartHostRef.current || !autoFollowRef.current) return;
    chartHostRef.current.scrollLeft = chartHostRef.current.scrollWidth;
  }, [plotWidth, data]);
  
  // Memoize options to prevent frequent re-renders of the chart instance
  const mergedOptions = useMemo<uPlot.Options>(() => {
    const fallbackAxes: uPlot.Axis[] = [
      { label: 'Time' },
      { label: 'Value' },
    ];

    const axes = (options.axes && options.axes.length > 0 ? options.axes : fallbackAxes).map(
      (axis, index) => ({
        ...axis,
        label: axis.label ?? (index === 0 ? 'Time' : 'Value'),
        stroke: axis.stroke ?? '#6b7280',
        grid: {
          stroke: 'rgba(107, 114, 128, 0.2)',
          ...(axis.grid || {}),
        },
      })
    );

    return {
      ...options,
      axes,
      width: plotWidth,
      height: size.height,
      cursor: {
        ...options.cursor,
        sync: { key: syncCursor.key, setSeries: true }
      },
      hooks: {
        ...options.hooks,
        draw: [
          ...(options.hooks?.draw || []),
          (u) => {
             const ctx = u.ctx;
             ctx.save();
             ctx.beginPath();
             ctx.lineWidth = 1;
             ctx.setLineDash([5, 5]);
             ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red-500
             for (const marker of markers) {
                // marker.time is ms, we feed seconds to uplot
                const xPos = u.valToPos(marker.time / 1000, 'x', true);
                if (xPos >= u.bbox.left && xPos <= u.bbox.left + u.bbox.width) {
                   ctx.moveTo(xPos, u.bbox.top);
                   ctx.lineTo(xPos, u.bbox.top + u.bbox.height);
                   
                   ctx.fillStyle = 'rgba(239, 68, 68, 1)';
                   ctx.font = 'bold 10px sans-serif';
                   ctx.fillText(marker.state, xPos + 4, u.bbox.top + 14);
                }
             }
             ctx.stroke();
             ctx.restore();
          }
        ],
        setSelect: [
          ...(options.hooks?.setSelect || [])
        ],
        setScale: [
           ...(options.hooks?.setScale || [])
        ]
      }
    };
  }, [options, markers, plotWidth, size.height]);

  return (
    <div className="flex flex-col w-full h-full bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex-none">{title}</h3>
      <div
        className="flex-grow w-full min-w-0 overflow-x-auto overflow-y-hidden relative"
        ref={chartHostRef}
        onScroll={(event) => {
          const viewport = event.currentTarget;
          const distanceToRight = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft;
          autoFollowRef.current = distanceToRight < 24;
        }}
      >
        <div style={{ width: `${plotWidth}px`, height: '100%' }}>
          <UplotReact
            options={mergedOptions}
            data={data}
          />
        </div>
      </div>
    </div>
  );
}
