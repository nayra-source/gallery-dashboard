import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ListMediaItemDto } from '../types';
import { PrepareDownloadWidget } from './PrepareDownloadWidget';
import { X, Calendar, FileType, HardDrive, Loader2, AlertCircle } from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  deviceId: string;
  item: ListMediaItemDto | null;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  deviceId,
  item,
  onClose,
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = item?.mimeType.startsWith('video/');

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        // Prepare transfer
        const prepareRes = await api.prepareTransfer(deviceId, item.mediaId);
        activeTransferId = prepareRes.transferId;

        // Command full media fetch
        await api.sendCommand(deviceId, 'GET_FULL_MEDIA', {
          mediaId: item.mediaId,
          transferId: activeTransferId,
        });

        // Poll transfer status
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
  }, [isOpen, deviceId, item]);

  if (!isOpen || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer for ${item.displayName}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="truncate pr-4">
            <h3 className="font-semibold text-slate-100 text-base truncate">{item.displayName}</h3>
            <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1">
                <FileType className="w-3.5 h-3.5 text-indigo-400" />
                <span>{item.mimeType}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{new Date(item.takenAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Area */}
        <div className="flex-1 min-h-[300px] max-h-[65vh] bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-10 h-10 border-indigo-500 text-indigo-400 animate-spin" />
              <p className="text-sm font-medium">Fetching high-resolution file from device...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center space-y-2 text-red-400 p-6 text-center">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : mediaUrl ? (
            isVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[60vh] rounded-lg shadow-2xl object-contain"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={item.displayName}
                className="max-w-full max-h-[60vh] rounded-lg shadow-2xl object-contain"
              />
            )
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <span>Media ID: {item.mediaId}</span>
          </div>

          <div className="w-full sm:w-64">
            <PrepareDownloadWidget deviceId={deviceId} item={item} />
          </div>
        </div>
      </div>
    </div>
  );
};
