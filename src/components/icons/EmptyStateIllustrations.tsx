import React from 'react';

interface IllustrationProps {
  className?: string;
}

export const EmptyGalleryIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 96 96" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="empty-frame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="empty-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#312e81" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
      </linearGradient>
      <filter id="empty-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Ambient backlight glow */}
    <ellipse cx="48" cy="48" rx="34" ry="24" fill="#6366f1" fillOpacity="0.18" filter="url(#empty-glow)" />

    {/* Background tilted card */}
    <rect
      x="22"
      y="18"
      width="54"
      height="46"
      rx="12"
      transform="rotate(6 49 41)"
      fill="currentColor"
      fillOpacity="0.04"
      stroke="#818cf8"
      strokeOpacity="0.25"
      strokeWidth="1.5"
    />

    {/* Foreground Picture Frame */}
    <rect
      x="18"
      y="22"
      width="60"
      height="52"
      rx="14"
      fill="url(#empty-bg-grad)"
      stroke="url(#empty-frame-grad)"
      strokeWidth="1.75"
    />

    {/* Sun / Moon Orb */}
    <circle cx="34" cy="38" r="6" fill="#38bdf8" fillOpacity="0.85" />
    <circle cx="32" cy="36" r="2" fill="#ffffff" />

    {/* Landscape Mountains */}
    <path
      d="M23 64L38 48L52 62L62 52L73 64"
      stroke="#818cf8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Sparkling Accent Stars */}
    <path
      d="M74 18L75.5 22L79.5 23.5L75.5 25L74 29L72.5 25L68.5 23.5L72.5 22L74 18Z"
      fill="#a855f7"
    />
    <path
      d="M18 68L19 70.5L21.5 71.5L19 72.5L18 75L17 72.5L14.5 71.5L17 70.5L18 68Z"
      fill="#38bdf8"
    />
  </svg>
);

export const EmptyFleetIllustration: React.FC<IllustrationProps> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 96 96" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fleet-phone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
    </defs>

    {/* Radar ripple rings */}
    <circle cx="48" cy="48" r="40" stroke="#6366f1" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 4" />
    <circle cx="48" cy="48" r="28" stroke="#818cf8" strokeOpacity="0.3" strokeWidth="1.5" />

    {/* Central Floating Device */}
    <rect
      x="34"
      y="24"
      width="28"
      height="48"
      rx="7"
      fill="#0f172a"
      stroke="url(#fleet-phone-grad)"
      strokeWidth="2"
    />
    <rect x="42" y="27" width="8" height="2" rx="1" fill="#94a3b8" />
    <rect x="37" y="32" width="22" height="32" rx="4" fill="#1e1b4b" fillOpacity="0.5" />
    <circle cx="48" cy="48" r="4" fill="#818cf8" fillOpacity="0.8" />
    <circle cx="48" cy="48" r="8" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />

    {/* Add Device Spark */}
    <path
      d="M70 30L71.5 34L75.5 35.5L71.5 37L70 41L68.5 37L64.5 35.5L68.5 34L70 30Z"
      fill="#34d399"
    />
  </svg>
);
