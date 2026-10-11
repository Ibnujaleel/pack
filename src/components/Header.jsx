import React from 'react';
import { ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';

export default function Header({
  onReturnToDashboard,
  onSignOut,
  user
}) {
  return (
    <header className="w-full bg-[#0b0f19] border-b border-[#1b2234] px-4 lg:px-6 py-3 flex items-center justify-between select-none">
      {/* Left: Product Title or Portal Return */}
      <div className="flex items-center space-x-3.5">
        {onReturnToDashboard && (
          <button
            type="button"
            onClick={onReturnToDashboard}
            title="Return to The Visa Guy travel dashboard"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Visa Portal</span>
          </button>
        )}

        <div className="relative w-8 h-8 rounded-lg bg-[#0e1424] border border-[#1e273e] flex items-center justify-center shadow-lg ring-1 ring-white/10 overflow-hidden p-0.5">
          <img src="/logo.svg" alt="StowAway 3D Logo" className="w-full h-full object-contain" />
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

      {/* Right: Traveler Status & Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {user ? (
          <>
            {/* Traveler & Journey Badge */}
            <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-200 bg-[#111726] border border-[#1e273d] px-3 py-1.5 rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{user.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300">Dubai → London (UK)</span>
            </div>

            {/* Visa Sanctioned Pill */}
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Sanctioned</span>
            </div>

            {/* Sign Out */}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out of Portal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 bg-[#111726] border border-[#1e273d] px-3 py-1.5 rounded-full shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">Running locally in browser</span>
          </div>
        )}
      </div>
    </header>
  );
}
