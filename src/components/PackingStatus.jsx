import React from 'react';
import { CheckCircle2, AlertCircle, Box, Scale } from 'lucide-react';

export default function PackingStatus({ items = [] }) {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);

  return (
    <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex flex-col shadow-xl select-none">
      <h2 className="text-sm font-semibold tracking-wide text-white mb-3">Packing Status</h2>

      <div className="flex flex-col space-y-3.5">
        {/* Items Packed Count & Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Box className="w-3.5 h-3.5 text-slate-500" />
              <span>Items Packed</span>
            </span>
            <span className="font-mono text-slate-300 font-medium">
              0 / {items.length}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#161e31] overflow-hidden">
            <div className="w-0 h-full bg-blue-500 rounded-full transition-all duration-300" />
          </div>
        </div>

        {/* Validation Neutral State */}
        <div className="flex items-start space-x-2.5 pt-1">
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
              items.length > 0
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                : 'bg-[#141d30] border-[#202c46] text-slate-400'
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

        {/* Total Weight & Unplaced Items */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#182033]">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            <span>Total Weight</span>
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {totalWeight.toFixed(2)} kg
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#182033]">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Unplaced Items</span>
          </span>
          <span className="font-mono text-slate-400 font-medium">0</span>
        </div>
      </div>
    </div>
  );
}
