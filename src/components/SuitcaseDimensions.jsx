import React from 'react';
import { Briefcase } from 'lucide-react';

export default function SuitcaseDimensions() {
  return (
    <div className="bg-[#0e1322] border border-[#1b2337] rounded-2xl p-4 flex items-center space-x-3.5 shadow-xl select-none">
      <div className="w-10 h-10 rounded-xl bg-[#141d30] border border-[#202c46] flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
        <Briefcase className="w-5 h-5 stroke-[1.75]" />
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Suitcase Dimensions
        </span>
        <span className="text-sm font-bold tracking-tight text-white font-mono mt-0.5">
          40 × 55 × 20 cm
        </span>
        <span className="text-[10px] text-slate-500">
          Internal dimensions (W × D × H)
        </span>
      </div>
    </div>
  );
}
