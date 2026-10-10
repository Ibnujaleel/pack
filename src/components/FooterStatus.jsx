import React from 'react';
import { Info } from 'lucide-react';

export default function FooterStatus({ items = [], packingResult = null, packingError = null }) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  const isPacked = Boolean(packingResult && packingResult.status === 'success');

  return (
    <footer className="w-full bg-[#0c101c] border border-[#1b2337] rounded-2xl p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xl select-none text-xs">
      {/* Left: Dynamic Engine Status */}
      <div className="flex items-center space-x-3">
        {packingError ? (
          <>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="font-semibold text-rose-400">Packing Failed</span>
              <span className="text-rose-300/80">{packingError.message}</span>
            </div>
          </>
        ) : isPacked ? (
          <>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="font-semibold text-emerald-400">Packed Successfully</span>
              <span className="text-slate-300">
                {packingResult.items.length} of {items.length} items placed inside 40×55×20 cm suitcase
                {packingResult.unplacedItems?.length > 0 && ` (${packingResult.unplacedItems.length} unplaced)`}.
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="font-semibold text-blue-400">Ready</span>
              <span className="text-slate-400">
                {items.length === 0
                  ? 'Add items from the catalog to populate your packing list.'
                  : `${items.length} item${items.length === 1 ? '' : 's'} selected (${totalWeight.toFixed(2)} kg). Click "Pack Suitcase" to calculate 3D placement.`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Phase Status Notice */}
      <div className="flex items-center space-x-2 text-slate-400 bg-[#12192b] border border-[#1e2840] px-3 py-1.5 rounded-xl self-start md:self-auto shrink-0">
        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[11px] text-slate-300">
          Phase 5: Real deterministic 3D packing engine active.
        </span>
      </div>
    </footer>
  );
}
