import React from 'react';
import { DataCategoryId } from '../../types';

interface CategoryIconProps {
  id: DataCategoryId;
  active?: boolean;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  id,
  active = false,
  className = 'w-4 h-4',
}) => {
  const activeColor = active ? '#6366f1' : '#94a3b8';
  const accentColor = active ? '#06b6d4' : '#cbd5e1';

  switch (id) {
    case 'all-media':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Top tilted card */}
          <rect
            x="4"
            y="3"
            width="13"
            height="13"
            rx="3"
            stroke={accentColor}
            strokeWidth="1.4"
            fill={active ? '#c7d2fe' : 'currentColor'}
            fillOpacity={active ? '0.2' : '0.05'}
          />
          {/* Main foreground card */}
          <rect
            x="7"
            y="7"
            width="13"
            height="13"
            rx="3"
            stroke={activeColor}
            strokeWidth="1.6"
            fill={active ? '#818cf8' : 'currentColor'}
            fillOpacity={active ? '0.3' : '0.1'}
          />
          <circle cx="11.5" cy="11.5" r="1.5" fill={activeColor} />
          <path
            d="M8.5 17L11.5 14L14 16.5L16 14.5L18.5 17"
            stroke={activeColor}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'photos':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="3.5"
            stroke={activeColor}
            strokeWidth="1.6"
            fill={active ? '#818cf8' : 'currentColor'}
            fillOpacity={active ? '0.2' : '0.05'}
          />
          <circle cx="8" cy="8.5" r="1.75" fill={activeColor} />
          <path
            d="M4 17L9.5 12L14.5 16.5"
            stroke={activeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 15L15.5 13L20 17"
            stroke={accentColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'videos':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect
            x="3"
            y="4.5"
            width="18"
            height="15"
            rx="3.5"
            stroke={activeColor}
            strokeWidth="1.6"
            fill={active ? '#2dd4bf' : 'currentColor'}
            fillOpacity={active ? '0.2' : '0.05'}
          />
          {/* Top sprocket punch-holes */}
          <line x1="6.5" y1="4.5" x2="6.5" y2="7.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="4.5" x2="12" y2="7.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17.5" y1="4.5" x2="17.5" y2="7.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          {/* Bottom sprocket punch-holes */}
          <line x1="6.5" y1="16.5" x2="6.5" y2="19.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="16.5" x2="12" y2="19.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17.5" y1="16.5" x2="17.5" y2="19.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          {/* Play triangle glyph */}
          <path
            d="M10.5 10L14.5 12L10.5 14V10Z"
            fill={activeColor}
            stroke={activeColor}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'screen':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect
            x="3"
            y="4"
            width="18"
            height="13"
            rx="3"
            stroke={activeColor}
            strokeWidth="1.6"
            fill={active ? '#818cf8' : 'currentColor'}
            fillOpacity={active ? '0.15' : '0.05'}
          />
          <line x1="8" y1="20" x2="16" y2="20" stroke={activeColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12" y2="20" stroke={activeColor} strokeWidth="1.6" />
          {/* Live broadcast wave inside display */}
          <path
            d="M7 11.5C9 9 15 9 17 11.5"
            stroke={accentColor}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="12" cy="11.5" r="1.25" fill={activeColor} />
        </svg>
      );

    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 16V10C18 6.68629 15.3137 4 12 4C8.68629 4 6 6.68629 6 10V16L4 18H20L18 16Z"
            stroke={activeColor}
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill={active ? '#fbbf24' : 'currentColor'}
            fillOpacity={active ? '0.2' : '0.05'}
          />
          <path
            d="M10 19C10 20.1046 10.8954 21 12 21C13.1046 21 14 20.1046 14 19"
            stroke={activeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Signal chime arc */}
          <path
            d="M19 8C20 9 20.5 10.5 20.5 12"
            stroke={accentColor}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'audio':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          {/* Microphone chassis */}
          <rect
            x="9"
            y="3"
            width="6"
            height="11"
            rx="3"
            stroke={activeColor}
            strokeWidth="1.6"
            fill={active ? '#a855f7' : 'currentColor'}
            fillOpacity={active ? '0.2' : '0.05'}
          />
          <path
            d="M5.5 10.5C5.5 14.0899 8.41015 17 12 17C15.5899 17 18.5 14.0899 18.5 10.5"
            stroke={activeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line x1="12" y1="17" x2="12" y2="21" stroke={activeColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="8.5" y1="21" x2="15.5" y2="21" stroke={activeColor} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case 'filesystem':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 6.5C3 5.39543 3.89543 4.5 5 4.5H9.5L11.5 7H19C20.1046 7 21 7.89543 21 9V17.5C21 18.6046 20.1046 19.5 19 19.5H5C3.89543 19.5 3 18.6046 3 17.5V6.5Z"
            stroke={activeColor}
            strokeWidth="1.6"
            fill={active ? '#38bdf8' : 'currentColor'}
            fillOpacity={active ? '0.2' : '0.05'}
          />
          <line x1="7" y1="12" x2="17" y2="12" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="7" y1="15.5" x2="13" y2="15.5" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="6" rx="8" ry="3" stroke={activeColor} strokeWidth="1.6" />
          <path d="M4 6V12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12V6" stroke={activeColor} strokeWidth="1.6" />
          <path d="M4 12V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V12" stroke={activeColor} strokeWidth="1.6" />
        </svg>
      );
  }
};
