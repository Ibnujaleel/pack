import React from 'react';
import { Play, RotateCcw, RefreshCw, Trash2 } from 'lucide-react';

export default function PackControls({
  itemCount = 0,
  isPacked = false,
  hasError = false,
  isAnimating = false,
  onPack,
  onReplay,
  onResetPacking,
  onClearItems,
}) {
  return (
    <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl select-none">
      <h2 className="text-sm font-semibold tracking-wide text-white mb-3">Controls</h2>

      <div className="flex flex-col space-y-2.5">
        {/* Main Pack Button */}
        <button
          type="button"
          onClick={onPack}
          disabled={itemCount === 0 || isAnimating}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            itemCount > 0 && !isAnimating
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-600/25 active:scale-[0.98]'
              : 'bg-blue-600/30 border border-blue-500/20 text-blue-300/40 cursor-not-allowed shadow-inner'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isPacked ? 'Repack Suitcase' : 'Pack Suitcase'}</span>
        </button>

        {/* Secondary Row: Reset & Replay */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onResetPacking}
            disabled={!isPacked && !hasError}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
              isPacked || hasError
                ? 'bg-[#141b2c] border-[#222e47] text-slate-200 hover:bg-[#1a233a] hover:text-white cursor-pointer active:scale-[0.98]'
                : 'bg-[#141b2c] border-[#1e273d] text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onReplay}
            disabled={!isPacked || isAnimating}
            title={isPacked ? 'Replay packing sequence' : 'Pack suitcase to replay'}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
              isPacked && !isAnimating
                ? 'bg-[#141b2c] border-[#222e47] text-slate-200 hover:bg-[#1a233a] hover:text-white cursor-pointer active:scale-[0.98]'
                : 'bg-[#141b2c] border-[#1e273d] text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnimating ? 'animate-spin text-blue-400' : ''}`} />
            <span>Replay</span>
          </button>
        </div>

        {/* Clear Items Button */}
        <button
          type="button"
          onClick={onClearItems}
          disabled={itemCount === 0}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border text-xs font-medium transition-all ${
            itemCount > 0
              ? 'bg-[#141b2c] border-[#222e47] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 cursor-pointer active:scale-[0.98]'
              : 'bg-[#141b2c] border-[#1e273d] text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Items</span>
        </button>
      </div>
    </div>
  );
}
