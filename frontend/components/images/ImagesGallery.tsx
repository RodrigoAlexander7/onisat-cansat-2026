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
  const hasUpscaled = useMemo(() => entries.some((entry) => entry.upscaledName), [entries]);

  return (
    <div className="flex flex-col gap-6">
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
              <div className="bg-black w-full aspect-video flex items-center justify-center relative">
                <Image
                  src={`/api/image/${encodeURIComponent(selectedName)}`}
                  alt={entry.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
