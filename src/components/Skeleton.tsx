import React from 'react';

interface SkeletonProps {
  className?: string;
  /** Width (CSS value or Tailwind class applied via className) */
  width?: string;
  /** Height (CSS value or Tailwind class applied via className) */
  height?: string;
  /** Border radius — defaults to 8px */
  rounded?: string;
}

/**
 * Skeleton shimmer placeholder component.
 * Uses the `.skeleton` CSS class from index.css for the shimmer animation.
 *
 * Usage:
 *   <Skeleton className="w-full h-44" />                    // media thumbnail
 *   <Skeleton className="w-24 h-4" />                       // text line
 *   <Skeleton className="w-10 h-10" rounded="rounded-full"/> // avatar circle
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-lg',
}) => {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Grid of skeleton card placeholders matching the device card layout.
 */
export const SkeletonDeviceCards: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800/60 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10" />
            <div className="space-y-2">
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-16 h-6" rounded="rounded-full" />
        </div>
        {/* Info rows */}
        <div className="pt-3 border-t border-slate-800/50 space-y-2">
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-3/4 h-3" />
        </div>
        {/* Actions */}
        <div className="pt-3 border-t border-slate-800/50 flex items-center space-x-2">
          <Skeleton className="flex-1 h-9" />
          <Skeleton className="w-20 h-9" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Grid of skeleton card placeholders matching the media card layout.
 */
export const SkeletonMediaCards: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
        {/* Thumbnail */}
        <Skeleton className="w-full h-44" rounded="rounded-none" />
        {/* Details */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
          <Skeleton className="w-full h-8" />
          <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between">
            <Skeleton className="w-16 h-7" />
            <div className="flex space-x-1">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
