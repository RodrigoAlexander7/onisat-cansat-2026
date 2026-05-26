import fs from 'fs';
import path from 'path';
import { ImagesGallery, type ImageEntry } from '@/components/images/ImagesGallery';

export const dynamic = 'force-dynamic';

function getImagesDir() {
  return path.join(process.cwd(), '..', 'ground_estation', 'received_images');
}

function readMissingCount(imagesDir: string, name: string) {
  const match = name.match(/^image_(\d+)\.partial\.jpg$/);
  if (!match) {
    return null;
  }
  const missingPath = path.join(imagesDir, `image_${match[1]}.missing.txt`);
  if (!fs.existsSync(missingPath)) {
    return null;
  }
  const content = fs.readFileSync(missingPath, 'utf-8').trim();
  if (!content) {
    return 0;
  }
  return content.split(',').filter(Boolean).length;
}

export default function ImagesPage() {
  const imagesDir = getImagesDir();
  let entries: ImageEntry[] = [];

  if (fs.existsSync(imagesDir)) {
    entries = fs
      .readdirSync(imagesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.jpg'))
      .map((entry) => {
        const fullPath = path.join(imagesDir, entry.name);
        const stat = fs.statSync(fullPath);
        return {
          name: entry.name,
          sizeBytes: stat.size,
          modifiedMs: stat.mtimeMs,
          isPartial: entry.name.includes('.partial.'),
          missingCount: readMissingCount(imagesDir, entry.name),
          upscaledName: null,
        };
      })
      .sort((a, b) => b.modifiedMs - a.modifiedMs);
  }

  entries = entries.map((entry) => {
    const upscaledName = entry.name.replace(/\.jpg$/i, '.upscaled.jpg');
    const upscaledPath = path.join(imagesDir, upscaledName);
    return {
      ...entry,
      upscaledName: fs.existsSync(upscaledPath) ? upscaledName : null,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0033a0]">Imagenes recibidas</h1>
          <span className="text-sm font-semibold text-gray-600">{entries.length} archivos</span>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-gray-500">
            No hay imagenes en received_images.
          </div>
        ) : (
          <ImagesGallery entries={entries} />
        )}
      </div>
    </div>
  );
}
