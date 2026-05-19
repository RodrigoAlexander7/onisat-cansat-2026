import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ path: string }> }) {
  const { path: imagePath } = await params;
  
  // process.cwd() is usually the frontend directory
  const backendPath = path.join(process.cwd(), '../backend/received_images', imagePath);
  
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
