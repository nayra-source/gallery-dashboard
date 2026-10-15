import React from 'react';

interface MetricIconProps {
  className?: string;
}

/**
 * Premium Fleet Hardware Icon:
 * Multi-device hierarchy with glass bevels, signal indicator, and precision display borders.
 */
export const FleetMetricIcon: React.FC<MetricIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="fleet-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
      <linearGradient id="fleet-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a5b4fc" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    {/* Secondary background device */}
    <rect
      x="9"
      y="2"
      width="11"
      height="17"
      rx="3"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="2 2"
    />
    {/* Primary foreground device */}
    <rect
      x="4"
      y="5"
      width="12"
      height="17"
      rx="3.5"
      fill="url(#fleet-grad-1)"
      stroke="#c7d2fe"
      strokeWidth="1.2"
    />
    {/* Top speaker / pill */}
    <rect x="8" y="7.5" width="4" height="1" rx="0.5" fill="#ffffff" fillOpacity="0.8" />
    {/* Screen active area */}
    <rect
      x="5.5"
      y="10"
      width="9"
      height="9"
      rx="1.5"
      fill="#1e1b4b"
      fillOpacity="0.6"
    />
    {/* Screen pulse dot */}
    <circle cx="10" cy="14.5" r="1.5" fill="#38bdf8" />
  </svg>
);

/**
 * Premium Live Pulse Telemetry Icon:
 * Concentric radar ping arcs with glowing emerald core beacon.
 */
export const LivePulseMetricIcon: React.FC<MetricIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="pulse-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Outer radar wave */}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="#10b981"
      strokeWidth="1.2"
      strokeDasharray="3 3"
      strokeOpacity="0.4"
      className="animate-spin"
      style={{ animationDuration: '12s' }}
    />
    {/* Mid signal arc */}
    <circle
      cx="12"
      cy="12"
      r="6"
      stroke="#34d399"
      strokeWidth="1.5"
      strokeOpacity="0.75"
    />
    {/* Center glowing beacon */}
    <circle cx="12" cy="12" r="3.2" fill="url(#pulse-core-grad)" />
    <circle cx="11.2" cy="11.2" r="1" fill="#ffffff" fillOpacity="0.85" />
  </svg>
);

/**
 * Premium Queue Chronometer Icon:
 * Segmented progress dial with precision hour/minute tick indices and angled hand.
 */
export const QueueMetricIcon: React.FC<MetricIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="queue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Outer bezel dial */}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="#f59e0b"
      strokeWidth="1.3"
      strokeOpacity="0.8"
    />
    {/* Ticks at 12, 3, 6, 9 */}
    <line x1="12" y1="4.5" x2="12" y2="6.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19.5" y1="12" x2="17.5" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="19.5" x2="12" y2="17.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="4.5" y1="12" x2="6.5" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    {/* Clock hands */}
    <path
      d="M12 7.5V12L15.5 14"
      stroke="url(#queue-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Center pin */}
    <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
  </svg>
);

/**
 * Premium Sync Engine / Duplex WebSocket Telemetry Icon:
 * Interlocking bidirectional high-speed data stream arrows with dynamic telemetry points.
 */
export const SyncEngineMetricIcon: React.FC<MetricIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sync-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="sync-grad-b" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
    {/* Top outgoing stream curve & arrowhead */}
    <path
      d="M18 7H9C6.79086 7 5 8.79086 5 11V12"
      stroke="url(#sync-grad-a)"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M15.5 4.5L18.5 7L15.5 9.5"
      stroke="url(#sync-grad-a)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Bottom incoming stream curve & arrowhead */}
    <path
      d="M6 17H15C17.2091 17 19 15.2091 19 13V12"
      stroke="url(#sync-grad-b)"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M8.5 19.5L5.5 17L8.5 14.5"
      stroke="url(#sync-grad-b)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Data packet spark */}
    <circle cx="12" cy="7" r="1.25" fill="#c7d2fe" />
    <circle cx="12" cy="17" r="1.25" fill="#bae6fd" />
  </svg>
);
