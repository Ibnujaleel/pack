import React from 'react';

/**
 * The Visa Guy Brand Logo Component
 * Faithful vector reproduction of the brand avatar and typography seen in visaguy.ae.
 */
export default function VisaGuyLogo({ size = 'md', isDark = false, className = '' }) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const avatarDimensions = isSmall ? 'w-7 h-7' : isLarge ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = isSmall ? 'text-xs' : isLarge ? 'text-base' : 'text-sm';
  const theSize = isSmall ? 'text-[8px]' : isLarge ? 'text-[11px]' : 'text-[9px]';

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Brand Avatar with Golden Outer Ring */}
      <div
        className={`relative ${avatarDimensions} rounded-full overflow-hidden shrink-0 border-2 border-amber-400 bg-gradient-to-b from-amber-100 to-amber-200 shadow-sm flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="#FDE68A" />

          {/* Body/Suit */}
          <path
            d="M20 95 C 22 72, 35 68, 50 68 C 65 68, 78 72, 80 95 Z"
            fill="#1E293B"
          />
          {/* White Shirt Collar */}
          <path d="M42 68 L50 82 L58 68 Z" fill="#FFFFFF" />
          {/* Tie */}
          <path d="M48 76 L52 76 L54 95 L46 95 Z" fill="#D97706" />

          {/* Neck */}
          <path d="M43 55 L57 55 L57 69 L43 69 Z" fill="#FCD34D" />

          {/* Head & Skin */}
          <ellipse cx="50" cy="46" rx="18" ry="21" fill="#FCD34D" />

          {/* Beard & Mustache */}
          <path
            d="M32 46 C 32 63, 40 68, 50 68 C 60 68, 68 63, 68 46 C 65 52, 60 55, 50 55 C 40 55, 35 52, 32 46 Z"
            fill="#0F172A"
          />
          <path
            d="M40 50 Q 50 53 60 50 Q 50 56 40 50 Z"
            fill="#0F172A"
          />

          {/* Hair */}
          <path
            d="M31 38 C 30 24, 42 20, 50 20 C 60 20, 70 24, 69 38 C 65 29, 58 27, 50 27 C 42 27, 35 29, 31 38 Z"
            fill="#0F172A"
          />

          {/* Eyes */}
          <circle cx="43" cy="42" r="2.2" fill="#0F172A" />
          <circle cx="57" cy="42" r="2.2" fill="#0F172A" />

          {/* Eyebrows */}
          <path d="M39 37 Q 43 35 47 37" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M53 37 Q 57 35 61 37" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <span className={`${theSize} font-bold text-amber-500 tracking-[0.2em] uppercase font-sans`}>
          The
        </span>
        <span
          className={`${titleSize} font-black tracking-tight uppercase ${
            isDark ? 'text-white' : 'text-slate-900'
          } font-sans`}
        >
          Visa Guy
        </span>
      </div>
    </div>
  );
}
