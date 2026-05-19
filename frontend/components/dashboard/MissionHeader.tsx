import React from 'react';
import Image from 'next/image';
import { SummaryCards } from './SummaryCards';
import { MissionStatusBadge } from './MissionStatusBadge';

export function MissionHeader() {
  return (
    <header className="flex-none border-b border-slate-200 bg-white px-4 py-2 shadow-sm md:px-6">
      <div className="overflow-x-auto">
        <div className="flex min-w-[1220px] items-center gap-3">
          <div className="shrink-0">
            <Image
              src="/onisat.png"
              alt="ONISAT"
              width={170}
              height={56}
              priority
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <SummaryCards />
          </div>

          <div className="shrink-0">
            <MissionStatusBadge />
          </div>
        </div>
      </div>
    </header>
  );
}
