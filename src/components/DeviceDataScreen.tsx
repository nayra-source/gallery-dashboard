import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DeviceSummary, ListMediaItemDto, ListMediaResultDto, DataCategoryId, DataCategoryDef } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CategorySidebar } from './CategorySidebar';
import { FutureCategoryPreview } from './FutureCategoryPreview';
import { MediaCatalogView } from './MediaCatalogView';
import { MediaViewerModal } from './MediaViewerModal';
import { RenameModal } from './RenameModal';
import { ConfirmModal } from './ConfirmModal';
import { PairDeviceModal } from './PairDeviceModal';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { HardwareDeviceIcon } from './icons';

interface DeviceDataScreenProps {
  device: DeviceSummary;
  onBack: () => void;
}

const CATEGORY_DEFINITIONS: DataCategoryDef[] = [
  {
    id: 'all-media',
    name: 'All Media',
    group: 'media',
    description: 'Photos & Videos',
    isAvailable: true,
    subCategory: 'all',
  },
  {
    id: 'photos',
    name: 'Photos',
    group: 'media',
    description: 'Images (JPEG, PNG, HEIC)',
    isAvailable: true,
    subCategory: 'photos',
  },
  {
    id: 'videos',
    name: 'Videos',
    group: 'media',
    description: 'Video clips (MP4, MKV, 3GP)',
    isAvailable: true,
    subCategory: 'videos',
  },
  {
    id: 'screen',
    name: 'Screen',
    group: 'system',
    description: 'Live screen stream & screenshots',
    isAvailable: false,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    group: 'system',
    description: 'System notification logs & alerts',
    isAvailable: false,
  },
  {
    id: 'audio',
    name: 'Audio',
    group: 'system',
    description: 'Audio recordings & mic stream',
    isAvailable: false,
  },
  {
    id: 'filesystem',
    name: 'File System',
    group: 'system',
    description: 'Storage directory explorer',
    isAvailable: false,
  },
];

export const DeviceDataScreen: React.FC<DeviceDataScreenProps> = ({ device, onBack }) => {
  const { showError, showSuccess, showInfo } = useToast();

  const [activeCategoryId, setActiveCategoryId] = useState<DataCategoryId>('all-media');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [items, setItems] = useState<ListMediaItemDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [viewItem, setViewItem] = useState<ListMediaItemDto | null>(null);
  const [renameTarget, setRenameTarget] = useState<ListMediaItemDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListMediaItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);

  const fetchMediaList = useCallback(
    async (targetCursor: string | null = null, showLoader = true) => {
      if (showLoader) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        if (!device.isOnline) {
          showInfo('Device Offline', 'Device is currently offline. LIST_MEDIA command will queue until connected.');
        }

        const resultDto = await api.executeCommandAndPoll<ListMediaResultDto>(
          device.id,
          'LIST_MEDIA',
          { cursor: targetCursor || undefined },
          15000,
          800
        );

        if (resultDto && Array.isArray(resultDto.items)) {
          setItems(resultDto.items);
          setNextCursor(resultDto.nextCursor);
        } else {
          setItems([]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch media list';
        showError('Media List Error', msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [device.id, device.isOnline, showError, showInfo]
  );

  useEffect(() => {
    fetchMediaList(null, true);
  }, [fetchMediaList]);

  // Dynamic counts for media categories
  const mediaCounts = useMemo(() => {
    const photos = items.filter((item) => item.mimeType.startsWith('image/')).length;
    const videos = items.filter((item) => item.mimeType.startsWith('video/')).length;
    const all = items.length;
    return { photos, videos, all };
  }, [items]);

  // Filtered items based on active category and search query
  const filteredItems = useMemo(() => {
    const activeCategoryDef = CATEGORY_DEFINITIONS.find((c) => c.id === activeCategoryId);
    if (!activeCategoryDef || !activeCategoryDef.isAvailable) return [];

    let categoryFiltered = items;
    if (activeCategoryDef.subCategory === 'photos') {
      categoryFiltered = items.filter((item) => item.mimeType.startsWith('image/'));
    } else if (activeCategoryDef.subCategory === 'videos') {
      categoryFiltered = items.filter((item) => item.mimeType.startsWith('video/'));
    }

    if (!searchQuery.trim()) return categoryFiltered;

    const query = searchQuery.toLowerCase();
    return categoryFiltered.filter((item) => item.displayName.toLowerCase().includes(query));
  }, [items, activeCategoryId, searchQuery]);

  const activeCategory = useMemo(() => {
    return CATEGORY_DEFINITIONS.find((c) => c.id === activeCategoryId) || CATEGORY_DEFINITIONS[0];
  }, [activeCategoryId]);

  const handleNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
    fetchMediaList(nextCursor, true);
  };

  const handlePrevPage = () => {
    if (cursorHistory.length === 0) return;
    const prevCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((prev) => prev.slice(0, -1));
    setCursor(prevCursor);
    fetchMediaList(prevCursor, true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const sendRes = await api.sendCommand(device.id, 'DELETE_MEDIA', {
        mediaIds: [deleteTarget.mediaId],
      });

      if (!sendRes.delivered) {
        showInfo('Delete Queued', 'Device is offline. Delete command queued.');
      } else {
        showSuccess('Delete Requested', 'Confirmation prompt sent to phone for photo/video.');
      }

      setItems((prev) => prev.filter((i) => i.mediaId !== deleteTarget.mediaId));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showError('Delete Error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenamed = (item: ListMediaItemDto, newName: string) => {
    setItems((prev) =>
      prev.map((i) => (i.mediaId === item.mediaId ? { ...i, displayName: newName } : i))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header matching mockup layout in Light & Dark modes */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800 transition-colors active:scale-95 shadow-sm"
            title="Back to Devices"
            aria-label="Back to Devices"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 shadow-inner flex items-center justify-center">
              <HardwareDeviceIcon isOnline={device.isOnline} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">{device.name || 'Unnamed Phone'}</h1>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
                  {device.id}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span
                  className={`inline-flex items-center space-x-1.5 px-2 py-0.2 text-[10px] font-bold rounded-full border ${
                    device.isOnline
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${device.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{device.isOnline ? 'Online' : 'Offline'}</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-500 font-mono">
                  {device.isOnline ? 'Direct WebSocket Sync' : 'Commands Queued'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchMediaList(cursor, false)}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800 transition-colors active:scale-95 shadow-sm"
            title="Refresh Device Data"
            aria-label="Refresh Device Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsPairModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair Device</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Data Categories Sidebar + Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Data Categories Navigation */}
        <CategorySidebar
          categories={CATEGORY_DEFINITIONS}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          mediaCounts={mediaCounts}
          isLoading={isLoading}
        />

        {/* Right Column: Active Category Content Area */}
        <div className="flex-1 min-w-0">
          {!activeCategory.isAvailable ? (
            <FutureCategoryPreview category={activeCategory} device={device} />
          ) : (
            <MediaCatalogView
              device={device}
              activeCategory={activeCategory}
              filteredItems={filteredItems}
              isLoading={isLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              cursor={cursor}
              nextCursor={nextCursor}
              cursorHistory={cursorHistory}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onRefresh={() => fetchMediaList(cursor, true)}
              onViewItem={(item) => setViewItem(item)}
              onRenameItem={(item) => setRenameTarget(item)}
              onDeleteItem={(item) => setDeleteTarget(item)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <MediaViewerModal
        isOpen={!!viewItem}
        deviceId={device.id}
        item={viewItem}
        items={filteredItems}
        onNavigate={(newItem) => setViewItem(newItem)}
        onClose={() => setViewItem(null)}
      />

      <RenameModal
        isOpen={!!renameTarget}
        deviceId={device.id}
        item={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRenamed={handleRenamed}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Media Item"
        message={`Are you sure you want to delete '${deleteTarget?.displayName}'? This sends a DELETE_MEDIA command to the Android device.`}
        confirmLabel="Delete Item"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
      />
    </div>
  );
};
