import React from 'react';

export default function Header() {
  return (
    <header className="w-full bg-[#0b0f19] border-b border-[#1b2234] px-4 lg:px-6 py-3 flex items-center justify-between select-none">
      {/* Left: Logo & Product Titles */}
      <div className="flex items-center space-x-3.5">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/15">
          {/* Isometric Cube Logo SVG */}
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
            <path d="m3.27 6.96 8.73 4.91 8.73-4.91" />
            <path d="M12 22V12" />
          </svg>
        </div>

        <div className="flex items-baseline space-x-2.5">
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
            StowAway <span className="text-blue-400 ml-1">3D</span>
          </h1>
          <span className="text-xs font-medium text-slate-400 hidden sm:inline-block border-l border-slate-700/60 pl-2.5">
            3D Packing Assistant
          </span>
        </div>
      </div>

      {/* Right: Local Status Indicator */}
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 bg-[#111726] border border-[#1e273d] px-3 py-1.5 rounded-full shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-300">Running locally in browser</span>
      </div>
    </header>
  );
}
