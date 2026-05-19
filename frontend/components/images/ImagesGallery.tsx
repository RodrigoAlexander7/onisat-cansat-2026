'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

export type ImageEntry = {
  name: string;
  sizeBytes: number;
  modifiedMs: number;
  isPartial: boolean;
  missingCount: number | null;
  upscaledName: string | null;
};

export function ImagesGallery({ entries }: { entries: ImageEntry[] }) {
  const [useUpscale, setUseUpscale] = useState(false);
  const [selected, setSelected] = useState<ImageEntry | null>(null);
  const hasUpscaled = useMemo(() => entries.some((entry) => entry.upscaledName), [entries]);
  const selectedName = useMemo(() => {
    if (!selected) {
      return null;
    }
    return useUpscale && selected.upscaledName ? selected.upscaledName : selected.name;
  }, [selected, useUpscale]);

  return (
    <div className="flex flex-col gap-6">
      {selected && selectedName ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-6xl aspect-video bg-black rounded shadow-lg overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={`/api/image/${encodeURIComponent(selectedName)}`}
              alt={selected.name}
              fill
              sizes="(min-width: 1280px) 80vw, 100vw"
              className="object-contain"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 bg-white/90 text-gray-900 text-xs font-bold px-3 py-1 rounded shadow"
            >
              Cerrar
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 flex flex-wrap gap-3">
              <span>{selected.name}</span>
              <span>{(selected.sizeBytes / 1024).toFixed(1)} KB</span>
              <span>{new Date(selected.modifiedMs).toLocaleString('es-MX')}</span>
              <span>{selected.isPartial ? 'PARCIAL' : 'COMPLETA'}</span>
              <span>
                Faltantes: {selected.missingCount === null ? '--' : selected.missingCount}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">{entries.length} archivos</span>
        <button
          type="button"
          onClick={() => setUseUpscale((prev) => !prev)}
          disabled={!hasUpscaled}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition ${
            hasUpscaled
              ? 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {useUpscale ? 'Upscale ON' : 'Upscale OFF'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {entries.map((entry) => {
          const sizeKB = (entry.sizeBytes / 1024).toFixed(1);
          const modified = new Date(entry.modifiedMs).toLocaleString('es-MX');
          const typeLabel = entry.isPartial ? 'PARCIAL' : 'COMPLETA';
          const selectedName = useUpscale && entry.upscaledName ? entry.upscaledName : entry.name;

          return (
            <div
              key={entry.name}
              className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => setSelected(entry)}
                className="bg-black w-full aspect-video flex items-center justify-center relative"
              >
                <Image
                  src={`/api/image/${encodeURIComponent(selectedName)}`}
                  alt={entry.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
              </button>
              <div className="p-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{entry.name}</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      entry.isPartial ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {typeLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>Tamano: {sizeKB} KB</span>
                  <span>Modificada: {modified}</span>
                  <span>Bytes: {entry.sizeBytes}</span>
                  <span>
                    Faltantes: {entry.missingCount === null ? '--' : entry.missingCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="text-xs font-semibold text-[#0033a0] hover:underline self-start"
                >
                  Ver en grande
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
