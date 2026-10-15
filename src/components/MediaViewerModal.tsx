import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { ListMediaItemDto } from '../types';
import { PrepareDownloadWidget } from './PrepareDownloadWidget';
import { ThumbnailImage, getCachedThumbnailUrl } from './ThumbnailImage';
import {
  X,
  Calendar,
  FileType,
  HardDrive,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface MediaViewerModalProps {
  isOpen: boolean;
  deviceId: string;
  item: ListMediaItemDto | null;
  items?: ListMediaItemDto[];
  onNavigate?: (item: ListMediaItemDto) => void;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  deviceId,
  item,
  items = [],
  onNavigate,
  onClose,
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailFallbackUrl, setThumbnailFallbackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const modalRef = useFocusTrap(isOpen, onClose);

  const isVideo = item?.mimeType.startsWith('video/');

  const currentIndex = items.findIndex((i) => i.mediaId === item?.mediaId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onNavigate) {
      onNavigate(items[currentIndex - 1]);
    }
  }, [hasPrev, onNavigate, items, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) {
      onNavigate(items[currentIndex + 1]);
    }
  }, [hasNext, onNavigate, items, currentIndex]);

  // Keyboard navigation: Left/Right arrows for photo swapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext]);

  // Auto-scroll active item into view on filmstrip
  useEffect(() => {
    if (filmstripRef.current && currentIndex >= 0) {
      const activeBtn = filmstripRef.current.children[currentIndex] as HTMLElement | undefined;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  // Load cached thumbnail preview immediately for instant photo swap feedback
  useEffect(() => {
    if (!isOpen || !item) {
      setThumbnailFallbackUrl(null);
      return;
    }

    const cached = getCachedThumbnailUrl(deviceId, item.mediaId);
    if (cached) {
      setThumbnailFallbackUrl(cached);
    }
  }, [isOpen, deviceId, item?.mediaId]);

  // Load full high-res media via WebSocket command
  useEffect(() => {
    if (!isOpen || !item) {
      setMediaUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    let activeTransferId: string | null = null;
    let createdUrl: string | null = null;

    const loadFullMedia = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const prepareRes = await api.prepareTransfer(deviceId, item.mediaId);
        activeTransferId = prepareRes.transferId;

        await api.sendCommand(deviceId, 'GET_FULL_MEDIA', {
          mediaId: item.mediaId,
          transferId: activeTransferId,
        });

        const maxAttempts = 30;
        let ready = false;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 800));
          if (!isMounted) return;
          const statusRes = await api.getTransferStatus(activeTransferId);
          if (statusRes.status === 'ready') {
            ready = true;
            break;
          }
          if (statusRes.status === 'failed' || statusRes.status === 'expired') {
            throw new Error(`Media transfer failed (${statusRes.status})`);
          }
        }

        if (!ready) {
          throw new Error('Media transfer timed out');
        }

        const blob = await api.fetchDownloadBlob(activeTransferId);
        if (!isMounted) return;

        createdUrl = URL.createObjectURL(blob);
        setMediaUrl(createdUrl);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load full media';
        setError(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFullMedia();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
      if (activeTransferId) {
        api.deleteTransfer(activeTransferId).catch(() => {});
      }
    };
  }, [isOpen, deviceId, item?.mediaId]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;

    if (deltaX > 50 && hasNext) {
      handleNext();
    } else if (deltaX < -50 && hasPrev) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  if (!isOpen || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer for ${item.displayName}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-backdrop"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[94vh] glass-modal rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in"
      >
        {/* Header with Title, Photo Counter & Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="truncate pr-4 flex-1">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base truncate">
              {item.displayName}
            </h3>
            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center space-x-1.5 font-mono text-[11px]">
                <FileType className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{item.mimeType}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center space-x-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{new Date(item.takenAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          {/* Center/Right Counter Strip & Prev/Next Toolbar */}
          <div className="flex items-center space-x-2">
            {items.length > 1 && (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-inner">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Previous photo (←)"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-[11px]">
                  {currentIndex >= 0 ? currentIndex + 1 : 1} of {items.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  title="Next photo (→)"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Close viewer"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95 shadow-sm"
              title="Close Viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Viewport with Floating Photo Swap Navigation */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 min-h-[340px] max-h-[62vh] bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none"
        >
          {/* Floating Left Swap Button */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-slate-950/75 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-indigo-400"
              title="Previous photo (Left Arrow)"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Floating Right Swap Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-slate-950/75 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-indigo-400"
              title="Next photo (Right Arrow)"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Main Content Render */}
          {error ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-rose-400 p-6 text-center z-10">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : mediaUrl ? (
            isVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[58vh] rounded-2xl shadow-2xl object-contain animate-fade-in"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={item.displayName}
                className="max-w-full max-h-[58vh] rounded-2xl shadow-2xl object-contain animate-fade-in"
              />
            )
          ) : thumbnailFallbackUrl ? (
            // Instant Thumbnail Preview while High-Res is downloading
            <div className="relative flex items-center justify-center max-w-full max-h-[58vh]">
              <img
                src={thumbnailFallbackUrl}
                alt={item.displayName}
                className="max-w-full max-h-[58vh] rounded-2xl shadow-2xl object-contain filter blur-[1px] brightness-90 transition-all duration-300"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/40 backdrop-blur-[2px] rounded-2xl">
                <div className="p-2.5 rounded-full bg-slate-900/80 border border-white/20 shadow-xl">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
                <span className="text-xs font-semibold text-white drop-shadow-md">
                  Staging high-res file...
                </span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-slate-400 z-10">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium animate-pulse">
                Fetching high-resolution file from device...
              </p>
            </div>
          ) : null}
        </div>

        {/* Interactive Bottom Filmstrip Carousel for Photo Swapping */}
        {items.length > 1 && (
          <div className="px-4 py-2.5 bg-slate-900/90 dark:bg-slate-950 border-t border-slate-800/80 flex items-center space-x-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex-shrink-0 flex items-center space-x-1">
              <Maximize2 className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Swap Photo:</span>
            </div>

            <div
              ref={filmstripRef}
              className="flex-1 flex items-center space-x-2 overflow-x-auto py-1 scrollbar-thin px-1"
            >
              {items.map((it, idx) => {
                const isActive = it.mediaId === item.mediaId;
                return (
                  <button
                    key={it.mediaId}
                    onClick={() => onNavigate && onNavigate(it)}
                    className={`relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all active:scale-95 group focus:outline-none ${
                      isActive
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105 shadow-lg shadow-indigo-500/30 z-10'
                        : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                    }`}
                    title={`Swap to ${it.displayName} (${idx + 1} of ${items.length})`}
                    aria-label={`Swap to ${it.displayName}`}
                  >
                    <ThumbnailImage deviceId={deviceId} item={it} />
                    {isActive && (
                      <div className="absolute inset-0 bg-indigo-500/15 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions & Staged Download */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="truncate">Media ID: {item.mediaId}</span>
          </div>

          <div className="w-full sm:w-64">
            <PrepareDownloadWidget deviceId={deviceId} item={item} />
          </div>
        </div>
      </div>
    </div>
  );
};
