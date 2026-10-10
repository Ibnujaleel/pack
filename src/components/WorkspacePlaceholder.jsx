import React from 'react';
import { Box, Camera, Maximize2, Layers } from 'lucide-react';

export default function WorkspacePlaceholder() {
  return (
    <div className="relative flex-1 min-h-[480px] lg:min-h-[580px] bg-[#0a0e19] border border-[#1b2337] rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-2xl select-none">
      {/* Perspective Grid Background */}
      <div className="absolute inset-0 perspective-grid opacity-80 pointer-events-none" />

      {/* Subtle radial spotlight over the center */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0%,transparent_70%)]" />

      {/* Top Right: 3D Coordinate Orientation Gizmo */}
      <div className="absolute top-4 right-4 z-10 flex items-center justify-center p-2 rounded-xl bg-[#0f1524]/80 border border-[#1d273e] backdrop-blur-md shadow-lg">
        <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none">
          {/* Coordinate Axis Origin at (50, 55) */}
          {/* Z Axis (Up - Blue) */}
          <line x1="50" y1="55" x2="50" y2="15" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="50,10 46,18 54,18" fill="#3b82f6" />
          <text x="50" y="8" fill="#60a5fa" fontSize="10" fontWeight="bold" textAnchor="middle">Z</text>

          {/* X Axis (Right-Down - Red) */}
          <line x1="50" y1="55" x2="85" y2="72" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="89,74 80,68 83,76" fill="#ef4444" />
          <text x="91" y="84" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">X</text>

          {/* Y Axis (Left-Down - Green) */}
          <line x1="50" y1="55" x2="15" y2="72" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="11,74 17,76 20,68" fill="#10b981" />
          <text x="9" y="84" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">Y</text>

          {/* Origin Dot */}
          <circle cx="50" cy="55" r="3" fill="#94a3b8" />
        </svg>
      </div>

      {/* Center: Open Suitcase Silhouette & Placeholder Graphics */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-md text-center">
        {/* Isometric Suitcase Illustration */}
        <div className="relative w-64 h-56 sm:w-80 sm:h-64 mb-6 flex items-center justify-center">
          <svg className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]" viewBox="0 0 320 260" fill="none">
            {/* Soft shadow below suitcase */}
            <ellipse cx="160" cy="225" rx="115" ry="25" fill="#03060c" opacity="0.8" />
            
            {/* Open Lid (leaning back) */}
            <path
              d="M75 140 L70 50 C69 40 78 30 90 28 L230 20 C242 19 252 27 253 38 L255 125 Z"
              fill="#131929"
              stroke="#2c3a57"
              strokeWidth="2.5"
            />
            {/* Inner Lid lining */}
            <path
              d="M85 132 L82 52 C81 44 88 38 96 37 L224 30 C232 29 240 35 241 43 L243 120 Z"
              fill="#0e1422"
              stroke="#222e47"
              strokeWidth="1.5"
            />
            <line x1="95" y1="65" x2="230" y2="58" stroke="#1c263c" strokeWidth="2" strokeDasharray="4 3" />

            {/* Suitcase Main Base Body */}
            <rect
              x="55"
              y="130"
              width="210"
              height="85"
              rx="18"
              fill="#171f33"
              stroke="#334366"
              strokeWidth="2.5"
            />

            {/* Suitcase Deep Cavity */}
            <rect
              x="66"
              y="140"
              width="188"
              height="65"
              rx="12"
              fill="#0b101c"
              stroke="#25324e"
              strokeWidth="2"
            />

            {/* Front Handle and Corner Protectors */}
            <rect x="135" y="213" width="50" height="8" rx="3" fill="#2d3b59" stroke="#3b4d75" strokeWidth="1" />
            <circle cx="70" cy="216" r="8" fill="#1b2438" stroke="#37486f" strokeWidth="2" />
            <circle cx="250" cy="216" r="8" fill="#1b2438" stroke="#37486f" strokeWidth="2" />

            {/* Internal 3D Grid markings on the floor of the suitcase */}
            <path d="M75 170 L245 170" stroke="#19243a" strokeWidth="1" strokeDasharray="5 5" />
            <path d="M125 142 L125 203" stroke="#19243a" strokeWidth="1" strokeDasharray="5 5" />
            <path d="M195 142 L195 203" stroke="#19243a" strokeWidth="1" strokeDasharray="5 5" />
          </svg>
        </div>

        {/* Status Badge & Scaffolding Banner */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#131b2e]/90 border border-[#233152] backdrop-blur-md mb-2 shadow-lg">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">3D Workspace</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
            Phase 1
          </span>
        </div>

        <p className="text-sm font-medium text-slate-300">
          Interactive suitcase view coming next
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          React Three Fiber packing canvas and 3D item placement will be rendered here.
        </p>
      </div>

      {/* Bottom Left: Camera and Viewport Toolbar Placeholder */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-1.5 p-1.5 rounded-xl bg-[#0e1424]/85 border border-[#1b253c] backdrop-blur-md shadow-lg">
        <button
          type="button"
          disabled
          title="Isometric View (Phase 2)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Box className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled
          title="Camera Angle (Phase 2)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled
          title="Expand Viewport (Phase 2)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
