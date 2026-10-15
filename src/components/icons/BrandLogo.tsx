import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 group ${dim} ${className}`}
      aria-label="Gallery Hub Brand Mark"
    >
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 opacity-60 blur-md group-hover:opacity-85 transition-opacity duration-300" />

      {/* Main Beveled Container */}
      <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
        <div className="w-full h-full bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md rounded-[14.5px] flex items-center justify-center overflow-hidden">
          {/* Subtle internal gradient shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

          {/* Precision SVG Aperture Prism Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/5 h-3/5 text-indigo-400 group-hover:scale-105 transition-transform duration-300 ease-out"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-blade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="logo-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Geometric Gallery Aperture Ring */}
            <circle
              cx="12"
              cy="12"
              r="9.5"
              stroke="url(#logo-blade-grad)"
              strokeWidth="1.25"
              strokeDasharray="4 2"
              strokeOpacity="0.75"
            />

            {/* Precision Interlocking Prism Blades */}
            <path
              d="M12 4.5L15.5 10.5H8.5L12 4.5Z"
              fill="url(#logo-blade-grad)"
              fillOpacity="0.85"
            />
            <path
              d="M19.5 12L13.5 15.5V8.5L19.5 12Z"
              fill="url(#logo-blade-grad)"
              fillOpacity="0.75"
            />
            <path
              d="M12 19.5L8.5 13.5H15.5L12 19.5Z"
              fill="url(#logo-blade-grad)"
              fillOpacity="0.85"
            />
            <path
              d="M4.5 12L10.5 8.5V15.5L4.5 12Z"
              fill="url(#logo-blade-grad)"
              fillOpacity="0.75"
            />

            {/* Glowing Core Jewel */}
            <circle cx="12" cy="12" r="3" fill="url(#logo-core-grad)" />
            <circle cx="11" cy="11" r="1" fill="#ffffff" fillOpacity="0.9" />
          </svg>
        </div>
      </div>
    </div>
  );
};
