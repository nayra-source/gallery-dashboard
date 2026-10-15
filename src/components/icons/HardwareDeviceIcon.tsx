import React from 'react';

interface HardwareDeviceIconProps {
  className?: string;
  isOnline?: boolean;
}

export const HardwareDeviceIcon: React.FC<HardwareDeviceIconProps> = ({
  className = 'w-6 h-6',
  isOnline = false,
}) => {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="chassis-online" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="screen-online" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="chassis-offline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="screen-offline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Outer Chassis */}
      <rect
        x="6"
        y="2"
        width="16"
        height="24"
        rx="4.5"
        fill={isOnline ? 'url(#chassis-online)' : 'url(#chassis-offline)'}
        stroke={isOnline ? '#a5b4fc' : '#94a3b8'}
        strokeWidth="1.2"
        strokeOpacity={isOnline ? '0.6' : '0.3'}
      />

      {/* Screen Inset */}
      <rect
        x="7.5"
        y="4"
        width="13"
        height="20"
        rx="3"
        fill={isOnline ? 'url(#screen-online)' : 'url(#screen-offline)'}
      />

      {/* Punch hole selfie camera */}
      <circle cx="14" cy="6" r="0.9" fill="#000000" />
      <circle cx="14" cy="6" r="0.4" fill="#38bdf8" fillOpacity={isOnline ? '0.9' : '0.2'} />

      {/* Dynamic Screen Wallpaper Wave */}
      {isOnline ? (
        <path
          d="M7.5 16C10 14 13 18 16 15C18 13 19.5 15 20.5 16V21C20.5 22.6569 19.1569 24 17.5 24H10.5C8.84315 24 7.5 22.6569 7.5 21V16Z"
          fill="url(#chassis-online)"
          fillOpacity="0.25"
        />
      ) : null}

      {/* Bottom Home Indicator Bar */}
      <rect
        x="11.5"
        y="22"
        width="5"
        height="1"
        rx="0.5"
        fill="#ffffff"
        fillOpacity={isOnline ? '0.6' : '0.25'}
      />

      {/* Live Status LED Dot on Top-Right */}
      <circle
        cx="21"
        cy="3.5"
        r="2"
        fill={isOnline ? '#10b981' : '#94a3b8'}
        stroke="#ffffff"
        strokeWidth="0.8"
      />
    </svg>
  );
};
