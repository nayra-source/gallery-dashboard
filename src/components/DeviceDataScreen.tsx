import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DeviceSummary, ListMediaItemDto, ListMediaResultDto, DataCategoryId, DataCategoryDef } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ThumbnailImage } from './ThumbnailImage';
import { PrepareDownloadWidget } from './PrepareDownloadWidget';
import { MediaViewerModal } from './MediaViewerModal';
import { RenameModal } from './RenameModal';
import { ConfirmModal } from './ConfirmModal';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  Film,
  Image as ImageIcon,
  Layers,
  Monitor,
  Bell,
  Mic,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Search,
  Sparkles,
  Database,
  Lock
} from 'lucide-react';

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

  const renderCategoryIcon = (id: DataCategoryId, active: boolean) => {
    const iconClass = `w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`;
    switch (id) {
      case 'all-media':
        return <Layers className={iconClass} />;
      case 'photos':
        return <ImageIcon className={iconClass} />;
      case 'videos':
        return <Film className={iconClass} />;
      case 'screen':
        return <Monitor className={iconClass} />;
      case 'notifications':
        return <Bell className={iconClass} />;
      case 'audio':
        return <Mic className={iconClass} />;
      case 'filesystem':
        return <FolderTree className={iconClass} />;
      default:
        return <Database className={iconClass} />;
    }
  };

  const renderFutureCategoryPreview = (category: DataCategoryDef) => {
    const futureDetails: Record<string, { title: string; features: string[] }> = {
      screen: {
        title: 'Screen Stream & Capture',
        features: [
          'Real-time display mirroring over WebSocket stream',
          'On-demand HD screenshot capture',
          'Remote touch & input event logging',
        ],
      },
      notifications: {
        title: 'Device Notification Center',
        features: [
          'Live notification stream from all installed apps',
          'Filtered notification category alerts',
          'Historical notification log search',
        ],
      },
      audio: {
        title: 'Audio Streaming & Recording',
        features: [
          'Remote microphone audio clip streaming',
          'System sound and call audio logger',
          'Noise reduction and high-fidelity encoding',
        ],
      },
      filesystem: {
        title: 'File System Explorer',
        features: [
          'Complete directory tree browsing',
          'Remote file upload, download, and permission inspection',
          'App sandbox and external storage access',
        ],
      },
    };

    const details = futureDetails[category.id] || {
      title: category.name,
      features: ['Real-time remote data retrieval', 'WebSocket stream integration', 'Secure device access'],
    };

    return (
      <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-slate-800 text-center space-y-6 animate-fade-in max-w-2xl mx-auto my-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          {renderCategoryIcon(category.id, true)}
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
            <Lock className="w-3 h-3" />
            <span>Upcoming Data Source</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{details.title}</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{category.description}</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 text-left space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Planned Capabilities</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            {details.features.map((feat, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-slate-500 font-mono">
          Device {device.name || device.id} is ready for this data category in future dashboard releases.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Back to Devices"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-100">{device.name || 'Unnamed Phone'}</h1>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  device.isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {device.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Device ID: {device.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchMediaList(cursor, false)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh Device Data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Data Categories Sidebar + Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Data Categories Navigation List */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Data Categories
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{CATEGORY_DEFINITIONS.length} Total</span>
            </div>

            {/* Media Categories Group */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Media Content
              </div>

              {CATEGORY_DEFINITIONS.filter((c) => c.group === 'media').map((cat) => {
                const isActive = activeCategoryId === cat.id;
                let countBadge: number | null = null;
                if (cat.id === 'all-media') countBadge = mediaCounts.all;
                if (cat.id === 'photos') countBadge = mediaCounts.photos;
                if (cat.id === 'videos') countBadge = mediaCounts.videos;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-md'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          isActive
                            ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                            : 'bg-slate-800/80 border-slate-700/60 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {renderCategoryIcon(cat.id, isActive)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{cat.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{cat.description}</div>
                      </div>
                    </div>

                    {countBadge !== null && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ml-1 flex-shrink-0 ${
                          isActive
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isLoading ? '...' : countBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* System Data Group (Future Categories) */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>System Data</span>
                <span className="text-[9px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  Upcoming
                </span>
              </div>

              {CATEGORY_DEFINITIONS.filter((c) => c.group === 'system').map((cat) => {
                const isActive = activeCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700 shadow-md'
                        : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          isActive
                            ? 'bg-slate-700 border-slate-600 text-slate-200'
                            : 'bg-slate-800/80 border-slate-700/60 text-slate-500 group-hover:text-slate-400'
                        }`}
                      >
                        {renderCategoryIcon(cat.id, isActive)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{cat.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{cat.description}</div>
                      </div>
                    </div>

                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-800 text-slate-500 border border-slate-700/80 flex-shrink-0 ml-1">
                      Soon
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Category Content Area */}
        <div className="flex-1 space-y-6 min-w-0">
          {!activeCategory.isAvailable ? (
            renderFutureCategoryPreview(activeCategory)
          ) : (
            <>
              {/* Category Header & Filters */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {renderCategoryIcon(activeCategory.id, true)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                      <span>{activeCategory.name}</span>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono">
                        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">{activeCategory.description}</p>
                  </div>
                </div>

                {/* Media Search Input */}
                <div className="relative sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeCategory.name.toLowerCase()}...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Media Content Grid */}
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                  <span className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-400">Fetching media catalog via WebSocket command...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-2xl border border-slate-800 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 text-slate-400">
                    <FileImage className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200">
                    {searchQuery
                      ? `No ${activeCategory.name} Match '${searchQuery}'`
                      : `No ${activeCategory.name} Found`}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {searchQuery
                      ? 'Try clearing your search query or switching categories.'
                      : `No media items were found for the '${activeCategory.name}' category on this device.`}
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                    >
                      Clear Search Filter
                    </button>
                  ) : (
                    <button
                      onClick={() => fetchMediaList(cursor, true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
                    >
                      Retry LIST_MEDIA
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredItems.map((item) => (
                      <div
                        key={item.mediaId}
                        className="glass-panel rounded-2xl border border-slate-800/90 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
                      >
                        {/* Thumbnail Header */}
                        <div className="h-44 w-full p-2">
                          <ThumbnailImage
                            deviceId={device.id}
                            item={item}
                            onClick={() => setViewItem(item)}
                          />
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-3">
                          <div>
                            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
                              {item.mimeType.startsWith('video/') ? (
                                <Film className="w-3.5 h-3.5 text-indigo-400" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              <span className="font-mono text-[11px] truncate">{item.mimeType}</span>
                            </div>
                            <h4
                              className="font-medium text-slate-200 text-sm truncate"
                              title={item.displayName}
                            >
                              {item.displayName}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {new Date(item.takenAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Prepare download / Drag & drop */}
                          <PrepareDownloadWidget deviceId={device.id} item={item} />

                          {/* Action Bar */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
                            <button
                              onClick={() => setViewItem(item)}
                              className="p-2 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors flex items-center space-x-1 text-xs"
                              title="View High-Res Media"
                            >
                              <Eye className="w-4 h-4 text-indigo-400" />
                              <span>View</span>
                            </button>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setRenameTarget(item)}
                                className="p-2 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors"
                                title="Rename File"
                              >
                                <Edit3 className="w-4 h-4 text-slate-400" />
                              </button>

                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                title="Delete File"
                              >
                                <Trash2 className="w-4 h-4 text-slate-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <button
                      onClick={handlePrevPage}
                      disabled={cursorHistory.length === 0 || isLoading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous Page</span>
                    </button>

                    <span className="text-xs text-slate-400 font-mono">
                      Page {cursorHistory.length + 1}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={!nextCursor || isLoading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <span>Next Page</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <MediaViewerModal
        isOpen={!!viewItem}
        deviceId={device.id}
        item={viewItem}
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
    </div>
  );
};
