import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ListMediaItemDto } from '../types';
import { Image, Film, AlertCircle, RefreshCw } from 'lucide-react';

interface ThumbnailImageProps {
  deviceId: string;
  item: ListMediaItemDto;
  onClick?: () => void;
}

// Bounded in-memory cache for thumbnail Blob URLs (max 100)
const MAX_CACHE_SIZE = 100;
const thumbnailCache = new Map<string, string>();

function setCachedThumbnail(key: string, url: string) {
  if (thumbnailCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = thumbnailCache.keys().next().value;
    if (oldestKey) {
      const oldUrl = thumbnailCache.get(oldestKey);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      thumbnailCache.delete(oldestKey);
    }
  }
  thumbnailCache.set(key, url);
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({ deviceId, item, onClick }) => {
  const cacheKey = `${deviceId}_${item.mediaId}`;

  const [src, setSrc] = useState<string | null>(() => thumbnailCache.get(cacheKey) || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isVideo = item.mimeType.startsWith('video/');

  useEffect(() => {
    if (src) return; // Already cached

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadThumbnail();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load slightly ahead of scroll
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [cacheKey, src]);

  const loadThumbnail = async () => {
    if (isLoading || src) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Prepare transfer row on backend
      const transferRes = await api.prepareTransfer(deviceId, item.mediaId);
      const transferId = transferRes.transferId;

      // 2. Dispatch GET_THUMBNAIL command to Android device
      await api.sendCommand(deviceId, 'GET_THUMBNAIL', {
        mediaId: item.mediaId,
        transferId: transferId,
      });

      // 3. Poll transfer status until ready (max 12s)
      const maxAttempts = 15;
      let ready = false;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((res) => setTimeout(res, 800));
        const statusRes = await api.getTransferStatus(transferId);
        if (statusRes.status === 'ready') {
          ready = true;
          break;
        }
        if (statusRes.status === 'failed' || statusRes.status === 'expired') {
          throw new Error(`Thumbnail transfer ${statusRes.status}`);
        }
      }

      if (!ready) {
        throw new Error('Thumbnail transfer timed out');
      }

      // 4. Download staged thumbnail blob
      const blob = await api.fetchDownloadBlob(transferId);
      const objectUrl = URL.createObjectURL(blob);
      setCachedThumbnail(cacheKey, objectUrl);
      setSrc(objectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch thumbnail';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden cursor-pointer group flex items-center justify-center border border-slate-800 hover:border-indigo-500/50 transition-all duration-200"
    >
      {src ? (
        <img
          src={src}
          alt={item.displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 p-2">
          <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px]">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center space-y-1 text-slate-500 p-2 text-center">
          <AlertCircle className="w-5 h-5 text-amber-500/80" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadThumbnail();
            }}
            className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1 mt-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center text-slate-600">
          {isVideo ? <Film className="w-8 h-8" /> : <Image className="w-8 h-8" />}
        </div>
      )}

      {/* Media type overlay badge */}
      {isVideo && (
        <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 backdrop-blur-sm text-white">
          <Film className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};
