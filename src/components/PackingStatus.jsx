import React from 'react';
import { CheckCircle2, AlertCircle, Box, Scale, XCircle, AlertTriangle } from 'lucide-react';

export default function PackingStatus({ items = [], packingResult = null, packingError = null }) {
  const isPacked = Boolean(packingResult && packingResult.status === 'success');
  const placedCount = isPacked ? packingResult.items.length : 0;
  const unplacedList = isPacked ? (packingResult.unplacedItems || []) : [];
  const unplacedCount = unplacedList.length;

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  const packedWeight = isPacked
    ? items
        .filter((it) => packingResult.items.some((p) => p.id === it.id))
        .reduce((sum, it) => sum + (it.weight || 0), 0)
    : 0;

  const progressPercent = items.length > 0 ? Math.round((placedCount / items.length) * 100) : 0;

  return (
    <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl select-none">
      <h2 className="text-sm font-semibold tracking-wide text-white mb-3">Packing Status</h2>

      <div className="flex flex-col space-y-3.5">
        {/* Items Packed Count & Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Box className="w-3.5 h-3.5 text-slate-500" />
              <span>Items Packed</span>
            </span>
            <span className="font-mono text-slate-300 font-medium">
              {placedCount} / {items.length} {items.length > 0 && `(${progressPercent}%)`}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#161e31] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                unplacedCount > 0 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Validation / Error State */}
        {packingError ? (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start space-x-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-rose-300">
                {packingError.code || 'PACKING_ERROR'}
              </span>
              <span className="text-[11px] text-rose-200/80 leading-tight mt-0.5">
                {packingError.message}
              </span>
            </div>
          </div>
        ) : isPacked ? (
          <div className="flex items-start space-x-2.5 pt-1">
            <div className="w-5 h-5 rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-emerald-300">Validation Passed</span>
              <span className="text-[11px] text-slate-400">
                Bounds & overlap rules strictly satisfied
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-2.5 pt-1">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                items.length > 0
                  ? 'bg-blue-950/40 border-blue-800/40 text-blue-400'
                  : 'bg-[#141d30] border-[#202c46] text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-300">Validation</span>
              <span className="text-[11px] text-slate-500">
                {items.length > 0 ? 'Ready to pack' : 'Awaiting items'}
              </span>
            </div>
          </div>
        )}

        {/* Total Weight */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#182033]">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            <span>Total Weight</span>
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {isPacked ? `${packedWeight.toFixed(2)} / ${totalWeight.toFixed(2)} kg` : `${totalWeight.toFixed(2)} kg`}
          </span>
        </div>

        {/* Unplaced Items Section */}
        <div className="flex flex-col pt-1 border-t border-[#182033]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <AlertCircle className={`w-3.5 h-3.5 ${unplacedCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>Unplaced Items</span>
            </span>
            <span
              className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${
                unplacedCount > 0
                  ? 'bg-amber-950/60 border border-amber-600/40 text-amber-300'
                  : 'text-slate-400'
              }`}
            >
              {unplacedCount}
            </span>
          </div>

          {/* List specific unplaced items and their engine reasons */}
          {unplacedList.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {unplacedList.map((unplaced, idx) => (
                <div
                  key={unplaced.id || idx}
                  className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-800/30 text-[11px] flex flex-col"
                >
                  <div className="flex items-center space-x-1 font-mono font-medium text-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{unplaced.id}</span>
                  </div>
                  <span className="text-[10px] text-amber-300/80 mt-0.5 pl-4">
                    {unplaced.reason || 'Capacity exceeded'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
