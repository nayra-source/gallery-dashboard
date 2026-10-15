import React, { useState } from 'react';
import { api } from '../services/api';
import { ListMediaItemDto } from '../types';
import { useToast } from '../context/ToastContext';
import { Download, Grip, CheckCircle2, Loader2, FileDown } from 'lucide-react';

interface PrepareDownloadWidgetProps {
  deviceId: string;
  item: ListMediaItemDto;
}

export const PrepareDownloadWidget: React.FC<PrepareDownloadWidgetProps> = ({ deviceId, item }) => {
  const { showError, showSuccess } = useToast();

  const [status, setStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');
  const [transferId, setTransferId] = useState<string | null>(null);
  const [_errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePrepare = async () => {
    setStatus('preparing');
    setErrorMessage(null);

    try {
      // 1. Trigger backend transfer prepare
      const prepareRes = await api.prepareTransfer(deviceId, item.mediaId);
      const tid = prepareRes.transferId;
      setTransferId(tid);

      // 2. Dispatch GET_FULL_MEDIA command to Android phone
      await api.sendCommand(deviceId, 'GET_FULL_MEDIA', {
        mediaId: item.mediaId,
        transferId: tid,
      });

      // 3. Poll transfer status until ready
      const maxAttempts = 30; // ~24 sec max
      let ready = false;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((res) => setTimeout(res, 800));
        const statusRes = await api.getTransferStatus(tid);
        if (statusRes.status === 'ready') {
          ready = true;
          break;
        }
        if (statusRes.status === 'failed' || statusRes.status === 'expired') {
          throw new Error(`Transfer failed on device (${statusRes.status})`);
        }
      }

      if (!ready) {
        throw new Error('Device transfer response timed out');
      }

      setStatus('ready');
      showSuccess('File Staged', `'${item.displayName}' is ready! Drag to desktop or click Save.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Prepare download failed';
      setErrorMessage(msg);
      setStatus('error');
      showError('Transfer Error', msg);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!transferId || status !== 'ready') return;

    const downloadUrl = `${window.location.origin}${api.getDownloadUrl(transferId)}`;
    const mimeType = item.mimeType || 'application/octet-stream';
    const fileName = item.displayName || 'download';

    // DownloadURL DataTransfer format for OS desktop/file manager direct drag drop
    const downloadUrlHeader = `${mimeType}:${fileName}:${downloadUrl}`;
    e.dataTransfer.setData('DownloadURL', downloadUrlHeader);
    e.dataTransfer.setData('text/uri-list', downloadUrl);
    e.dataTransfer.setData('text/plain', downloadUrl);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDirectDownload = async () => {
    if (!transferId) return;
    try {
      const blob = await api.fetchDownloadBlob(transferId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.displayName || 'media_file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      showError('Download Error', msg);
    }
  };

  if (status === 'idle') {
    return (
      <button
        onClick={handlePrepare}
        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center space-x-1.5 active:scale-98 group shadow-sm"
      >
        <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
        <span>Prepare Download</span>
      </button>
    );
  }

  if (status === 'preparing') {
    return (
      <div className="w-full py-2 px-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span>Staging file on device...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={handlePrepare}
        className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-1.5 active:scale-98"
      >
        <FileDown className="w-3.5 h-3.5" />
        <span>Retry Prepare</span>
      </button>
    );
  }

  // Ready state: Draggable element + Direct Save button
  return (
    <div className="space-y-2 animate-fade-in">
      <div
        draggable="true"
        onDragStart={handleDragStart}
        className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold cursor-grab active:cursor-grabbing transition-all flex items-center justify-between shadow-sm active:scale-98"
        title="Drag onto your OS desktop or file explorer to copy directly!"
      >
        <div className="flex items-center space-x-2 truncate">
          <Grip className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="truncate">Drag file to Desktop</span>
        </div>
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-1" />
      </div>

      <button
        onClick={handleDirectDownload}
        className="w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-1 active:scale-98 shadow-sm"
      >
        <Download className="w-3 h-3 text-slate-500 dark:text-slate-400" />
        <span>Or click to Save file</span>
      </button>
    </div>
  );
};
