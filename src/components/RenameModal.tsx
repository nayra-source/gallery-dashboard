import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ListMediaItemDto, RenameMediaResultDto } from '../types';
import { Edit3, X } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  deviceId: string;
  item: ListMediaItemDto | null;
  onClose: () => void;
  onRenamed?: (item: ListMediaItemDto, newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  deviceId,
  item,
  onClose,
  onRenamed,
}) => {
  const { showError, showSuccess, showInfo } = useToast();

  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (item) {
      setNewName(item.displayName);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === item.displayName) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      // Dispatch RENAME_MEDIA command to device
      const sendRes = await api.sendCommand(deviceId, 'RENAME_MEDIA', {
        mediaId: item.mediaId,
        newName: trimmed,
      });

      if (!sendRes.delivered) {
        showInfo('Command Queued', 'Device is offline. Rename will trigger when phone reconnects.');
      } else {
        showSuccess('Rename Requested', `Confirmation prompt sent to phone for '${trimmed}'.`);
      }

      if (onRenamed) onRenamed(item, trimmed);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rename command failed';
      showError('Rename Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rename Media File"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md p-6 glass-modal rounded-2xl shadow-2xl border border-slate-700">
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close rename modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Rename Media File</h3>
            <p className="text-xs text-slate-400">Sends rename command to the Android device</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoFocus
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !newName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Submit Rename</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
