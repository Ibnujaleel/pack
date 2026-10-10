import React from 'react';
import { Play, RotateCcw, RefreshCw, Trash2 } from 'lucide-react';

export default function PackControls({ itemCount = 0, onClearItems }) {
  return (
    <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl select-none">
      <h2 className="text-sm font-semibold tracking-wide text-white mb-3">Controls</h2>

      <div className="flex flex-col space-y-2.5">
        {/* Main Pack Button (Placeholder for future phases) */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-blue-600/40 border border-blue-500/30 text-blue-200/50 text-sm font-medium cursor-not-allowed shadow-inner transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Pack</span>
        </button>

        {/* Secondary Row: Reset & Replay (Placeholders) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#141b2c] border border-[#1e273d] text-slate-500 text-xs font-medium cursor-not-allowed transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            disabled
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#141b2c] border border-[#1e273d] text-slate-500 text-xs font-medium cursor-not-allowed transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
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
              ? 'bg-[#141b2c] border-[#222e47] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 cursor-pointer'
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
