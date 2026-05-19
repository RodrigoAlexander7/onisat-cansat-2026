import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ path: string }> }) {
  const { path: imagePath } = await params;
  
  // process.cwd() is usually the frontend directory
  const safeName = path.basename(decodeURIComponent(imagePath));
  const imagesDir = path.join(process.cwd(), '..', 'ground_estation', 'received_images');
  const backendPath = path.join(imagesDir, safeName);
  
  if (!fs.existsSync(backendPath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const imageBuffer = fs.readFileSync(backendPath);
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-cache',
    },
  });
}
