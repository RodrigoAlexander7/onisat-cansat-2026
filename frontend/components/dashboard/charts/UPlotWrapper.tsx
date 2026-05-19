import React, { useEffect, useRef, useMemo, useState } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { Info } from 'lucide-react';
import { useTelemetryStore } from '../../../store/telemetry-store';

export interface SensorInfo {
  legend: string;
  color: string;
  unit: string;
  sensor: string;
}

interface UPlotWrapperProps {
  options: Omit<uPlot.Options, 'width' | 'height'>;
  data: uPlot.AlignedData;
  title: string;
  sensors?: SensorInfo[];
}

// Ensure all charts sync their cursors
const syncCursor = uPlot.sync('dash-sync');

const FALLBACK_WIDTH = 400;
const FALLBACK_HEIGHT = 250;
const PIXELS_PER_POINT = 7;
const MAX_PLOT_WIDTH = 12000;
const AXIS_SIDE_RIGHT = 1;
const AXIS_SIDE_BOTTOM = 2;
const AXIS_SIDE_LEFT = 3;

export function UPlotWrapper({ options, data, title, sensors }: UPlotWrapperProps) {
  const chartHostRef = useRef<HTMLDivElement>(null);
  const leftStickyRef = useRef<HTMLCanvasElement>(null);
  const rightStickyRef = useRef<HTMLCanvasElement>(null);
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

    const axisLabelMeta: Array<{
      label: string;
      side: number;
      stroke: uPlot.Axis['stroke'];
      axisIdx: number;
      font?: string;
    }> = [];

    const axes = (options.axes && options.axes.length > 0 ? options.axes : fallbackAxes).map(
      (axis, index) => {
        const side = axis.side ?? (index === 0 ? AXIS_SIDE_BOTTOM : AXIS_SIDE_LEFT);
        const labelText = typeof axis.label === 'string' ? axis.label : null;

        if ((side === AXIS_SIDE_LEFT || side === AXIS_SIDE_RIGHT) && labelText) {
          axisLabelMeta.push({
            label: labelText,
            side,
            stroke: axis.stroke,
            axisIdx: index,
            font: axis.labelFont ?? axis.font,
          });
        }

        return {
          ...axis,
          side,
          label: (side === AXIS_SIDE_LEFT || side === AXIS_SIDE_RIGHT)
            ? ''
            : (axis.label ?? (index === 0 ? 'Time' : 'Value')),
          stroke: axis.stroke ?? '#6b7280',
          grid: {
            stroke: 'rgba(107, 114, 128, 0.2)',
            ...(axis.grid || {}),
          },
        };
      }
    );

    return {
      ...(options as uPlot.Options),
      axes,
      width: plotWidth,
      height: size.height,
      cursor: {
        ...options.cursor,
        sync: { key: syncCursor.key, setSeries: true }
      },
      hooks: {
        ...options.hooks,
        drawAxes: [
          ...(options.hooks?.drawAxes || []),
          (u) => {
            if (axisLabelMeta.length === 0) return;

            const ctx = u.ctx;
            ctx.save();

            for (const meta of axisLabelMeta) {
              let fillStyle = meta.stroke ?? '#6b7280';
              if (typeof fillStyle === 'function') {
                fillStyle = fillStyle(u, meta.axisIdx) ?? '#6b7280';
              }
              ctx.fillStyle = fillStyle as CanvasRenderingContext2D['fillStyle'];
              
              if (meta.font) {
                ctx.font = meta.font;
              }

              const y = Math.max(12, u.bbox.top - 6);

              if (meta.side === AXIS_SIDE_LEFT) {
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                ctx.fillText(meta.label, u.bbox.left - 6, y);
              } else if (meta.side === AXIS_SIDE_RIGHT) {
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText(meta.label, u.bbox.left + u.bbox.width + 6, y);
              }
            }

            ctx.restore();
          }
        ],
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

             // Update fixed axis overlays
             const leftCanvas = leftStickyRef.current;
             const rightCanvas = rightStickyRef.current;
             const sourceCanvas = u.ctx.canvas;
             
             const r = window.devicePixelRatio || 1;
             const leftWidthCss = u.bbox.left;
             const rightWidthCss = (sourceCanvas.width / r) - (u.bbox.left + u.bbox.width);

             if (leftCanvas) {
               if (leftWidthCss > 0) {
                 leftCanvas.style.display = 'block';
                 leftCanvas.width = leftWidthCss * r;
                 leftCanvas.height = sourceCanvas.height;
                 leftCanvas.style.width = `${leftWidthCss}px`;
                 leftCanvas.style.height = `${sourceCanvas.height / r}px`;
                 const leftCtx = leftCanvas.getContext('2d');
                 if (leftCtx) {
                   leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
                   leftCtx.drawImage(sourceCanvas, 0, 0, leftCanvas.width, leftCanvas.height, 0, 0, leftCanvas.width, leftCanvas.height);
                 }
               } else {
                 leftCanvas.style.display = 'none';
               }
             }

             if (rightCanvas) {
               if (rightWidthCss > 0) {
                 rightCanvas.style.display = 'block';
                 rightCanvas.width = rightWidthCss * r;
                 rightCanvas.height = sourceCanvas.height;
                 rightCanvas.style.width = `${rightWidthCss}px`;
                 rightCanvas.style.height = `${sourceCanvas.height / r}px`;
                 const rightCtx = rightCanvas.getContext('2d');
                 if (rightCtx) {
                   rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
                   const srcX = sourceCanvas.width - rightCanvas.width;
                   rightCtx.drawImage(sourceCanvas, srcX, 0, rightCanvas.width, rightCanvas.height, 0, 0, rightCanvas.width, rightCanvas.height);
                 }
               } else {
                 rightCanvas.style.display = 'none';
               }
             }
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
    <div className="flex flex-col w-full h-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 relative">
      <div className="flex items-center gap-2 mb-2 flex-none">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
        {sensors && sensors.length > 0 && (
          <div className="relative group flex items-center">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-max bg-gray-800 text-white text-xs rounded-md shadow-lg p-2">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="px-2 py-1 text-left font-semibold">Legend</th>
                    <th className="px-2 py-1 text-left font-semibold">Sensor</th>
                    <th className="px-2 py-1 text-left font-semibold">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((s, idx) => (
                    <tr key={idx} className="border-b border-gray-700 last:border-0">
                      <td className="px-2 py-1 flex items-center gap-2">
                        <span className="w-3 h-3 inline-block rounded-full" style={{ backgroundColor: s.color }}></span>
                        {s.legend}
                      </td>
                      <td className="px-2 py-1">{s.sensor}</td>
                      <td className="px-2 py-1">{s.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow w-full min-w-0 relative">
        <div
          className="absolute inset-0 overflow-x-auto overflow-y-hidden"
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

        {/* Fixed overlays that capture the axes from the uPlot canvas */}
        <canvas ref={leftStickyRef} className="absolute left-0 top-0 z-10 bg-white pointer-events-none" style={{ display: 'none' }} />
        <canvas ref={rightStickyRef} className="absolute right-0 top-0 z-10 bg-white pointer-events-none" style={{ display: 'none' }} />
      </div>
    </div>
  );
}
